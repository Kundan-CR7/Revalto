import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/Services/api";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Send, MessageSquare, User, Loader2, ArrowLeft } from "lucide-react";

function ConversationSelector({ onSelectConversation, selectedId }) {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get("/conversations");
        setConversations(res.data || []);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setError("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full md:w-80 lg:w-96 flex-shrink-0">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Messages
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8 text-sm">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-12 px-4">
            <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">No messages yet</p>
            <p className="text-xs text-gray-500 mt-1">Start a conversation from a product page.</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const otherUser = conv.otherUser;
            const lastMessage = conv.messages?.[0];
            const fallbackOtherUser = Number(conv.userAId) === Number(user.id) ? conv.userB : conv.userA;
            const finalOtherUser = otherUser || fallbackOtherUser;
            const displayOtherUser = finalOtherUser;
            const isSelected = Number(selectedId) === Number(conv.id);

            const isOnline = onlineUsers.includes(String(displayOtherUser?.id));

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 group ${isSelected
                    ? "bg-blue-50 border-blue-100 shadow-sm"
                    : "hover:bg-gray-50 border border-transparent hover:border-gray-100"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                      {displayOtherUser?.imgUrl ? (
                        <img
                          src={displayOtherUser.imgUrl}
                          alt={displayOtherUser.userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className={`font-semibold text-sm truncate ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                        {displayOtherUser?.userName || displayOtherUser?.name || "Unknown User"}
                      </h3>
                      {lastMessage && (
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                          {new Date(lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {conv.post && (
                      <div className="text-xs text-blue-600 font-medium truncate mb-0.5 bg-blue-50 inline-block px-1.5 py-0.5 rounded-md">
                        {conv.post.itemName}
                      </div>
                    )}

                    <div className={`text-xs truncate ${isSelected ? "text-blue-700/70" : "text-gray-500"}`}>
                      {lastMessage ? (
                        <>
                          <span className="font-medium">
                            {Number(lastMessage.sender?.id) === Number(user.id) ? "You: " : ""}
                          </span>
                          {lastMessage.text}
                        </>
                      ) : (
                        <span className="italic">No messages yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ChatRoom({ conversationId: propConversationId }) {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const conversationId = propConversationId || params.conversationId || searchParams.get("conversationId");
  const userId = user?.id;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [isMobileListVisible, setIsMobileListVisible] = useState(!conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle mobile view state
  useEffect(() => {
    setIsMobileListVisible(!conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/conversations/${conversationId}/messages`);
        setMessages(res.data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !conversationId || !isConnected) return;

    const joinRoom = () => {
      socket.emit("joinConversation", Number(conversationId));
    };

    if (isConnected) joinRoom();
    socket.on("connect", joinRoom);

    const handleReceive = (msg) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("receiveMessage", handleReceive);
    };
  }, [socket, conversationId, isConnected]);

  const sendMessage = () => {
    if (!text.trim() || !socket || !isConnected) return;
    if (!userId) return;

    const messageData = {
      conversationId: Number(conversationId),
      text: text.trim(),
    };

    const messageText = text.trim();
    setText("");

    socket.emit("sendMessage", messageData, (ack) => {
      if (ack && ack.status === "ok") {
        setMessages((prev) => {
          if (prev.some(m => m.id === ack.message.id)) return prev;
          return [...prev, ack.message];
        });
      } else {
        setError(ack?.error || "Failed to send");
        setText(messageText);
      }
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col h-[80vh] w-full max-w-4xl mx-auto border rounded-2xl shadow-xl bg-white items-center justify-center p-8">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <User className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
        <p className="text-gray-500 mb-6">Please log in to access your messages.</p>
        <Button onClick={() => navigate("/login")}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[85vh] w-full max-w-6xl mx-auto border border-gray-200 rounded-2xl shadow-xl bg-white overflow-hidden">
      {/* Sidebar - Hidden on mobile if chat is active */}
      <div className={`${isMobileListVisible ? 'block' : 'hidden'} md:block w-full md:w-auto h-full`}>
        <ConversationSelector
          selectedId={conversationId}
          onSelectConversation={(id) => {
            navigate(`/chat/${id}`);
            setIsMobileListVisible(false);
          }}
        />
      </div>

      {/* Chat Area */}
      <div className={`${!isMobileListVisible ? 'flex' : 'hidden'} md:flex flex-col flex-1 h-full bg-gray-50/50 relative`}>
        {!conversationId ? (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Messages</h3>
            <p className="text-gray-500 text-center max-w-xs">
              Select a conversation from the left to start chatting with buyers and sellers.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3 shadow-sm z-10">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden -ml-2"
                onClick={() => setIsMobileListVisible(true)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              {/* We could pass the current conversation details here to show user info in header */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Chat</h3>
                {!isConnected && (
                  <span className="text-xs text-yellow-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Connecting...
                  </span>
                )}
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = (msg.senderId || msg.sender?.id) === userId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}>
                        {!isOwnMessage && msg.sender && (
                          <span className="text-[10px] text-gray-500 ml-1 mb-1">
                            {msg.sender.userName || "User"}
                          </span>
                        )}

                        <div
                          className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${isOwnMessage
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                            }`}
                        >
                          {msg.text}
                        </div>

                        <span className={`text-[10px] text-gray-400 mt-1 mx-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2 items-center max-w-4xl mx-auto">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={!isConnected}
                  placeholder={isConnected ? "Type a message..." : "Connecting..."}
                  className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-blue-500"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!isConnected || !text.trim()}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 w-10 shrink-0 shadow-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {error && (
                <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


