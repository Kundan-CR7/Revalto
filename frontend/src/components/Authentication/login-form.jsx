import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { api } from "@/Services/api"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext";

function AuthForm({ className, onSubmit, mode = "login", ...props }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const { login } = useAuth(); // login function from context
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isLogin = mode === "login";
  const title = isLogin ? "Login to your account" : "Create your account";
  const subtitle = isLogin
    ? "Enter your email below to login to your account"
    : "Enter your details below to create an account";
  const buttonText = isSubmitting
    ? isLogin ? "Logging in..." : "Signing up..."
    : isLogin ? "Login" : "Sign up";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (typeof onSubmit === "function") {
        await Promise.resolve(onSubmit(e));
      } else {
        const form = e.currentTarget;
        const data = Object.fromEntries(new FormData(form).entries());
        // console.log(`${mode} form submit`, data);

        const endpoint = isLogin ? "/login" : "/register";
        const response = await api.post(endpoint, data, { withCredentials: true });
        console.log("Server response:", response.data);

        if (response.status === 200 || response.status === 201) {
          console.log(
            `${isLogin ? "Login" : "Signup"} Successful:`,
            response.data
          );
          const minimalUser = {
            id: response.data.user.id,
            userName: response.data.user.userName,
            email: response.data.user.email
          };
          login( minimalUser ); // Use context to set user state
          navigate("/");
        } else {
          alert(`${isLogin ? "Login" : "Signup"} failed: ${response.data?.message || "Unknown error"}`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "An unknown error occurred.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithub = async () => {
    try {
      setIsGitHubLoading(true);
      console.log(`${mode} with GitHub clicked`);
      await new Promise((r) => setTimeout(r, 1000));
    } finally {
      setIsGitHubLoading(false);
    }
  };

  const isDarkTheme = className?.includes('text-white');
  
  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup className="gap-8">
        <div className="flex flex-col items-center gap-2 text-center mb-2">
          <h1 className={cn("text-3xl font-bold tracking-tight", isDarkTheme ? "text-white" : "text-gray-900")}>{title}</h1>
          <p className={cn("text-sm text-balance max-w-sm", isDarkTheme ? "text-gray-300" : "text-gray-500")}>{subtitle}</p>
        </div>

        {!isLogin && (
          <Field>
            <FieldLabel htmlFor="username" className={cn("font-medium mb-2", isDarkTheme ? "text-gray-200" : "text-gray-700")}>Username</FieldLabel>
            <Input 
              id="username" 
              name="userName" 
              type="text" 
              placeholder="john_doe" 
              required 
              className={cn("h-11 transition-colors outline-none focus:outline-none focus-visible:ring-0", isDarkTheme 
                ? "border-zinc-700 focus:border-white bg-zinc-800/50 focus:bg-zinc-800 text-white placeholder:text-zinc-400" 
                : "border-gray-300 focus:border-gray-900 bg-gray-50 focus:bg-white")}
            />
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="email" className={cn("font-medium mb-2", isDarkTheme ? "text-gray-200" : "text-gray-700")}>Email</FieldLabel>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="m@adypu.edu.in" 
            required 
            className={cn("h-11 transition-colors outline-none focus:outline-none focus-visible:ring-0", isDarkTheme 
              ? "border-zinc-700 focus:border-white bg-zinc-800/50 focus:bg-zinc-800 text-white placeholder:text-zinc-400" 
              : "border-gray-300 focus:border-gray-900 bg-gray-50 focus:bg-white")}
          />
        </Field>

        <Field>
          <div className="flex items-center mb-2">
            <FieldLabel htmlFor="password" className={cn("font-medium", isDarkTheme ? "text-gray-200" : "text-gray-700")}>Password</FieldLabel>
            {isLogin && (
              <a href="#" className={cn("ml-auto text-sm underline-offset-4 hover:underline font-medium transition-colors", isDarkTheme ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900")}>
                Forgot password?
              </a>
            )}
          </div>
          <Input 
            id="password" 
            name="password" 
            type="password" 
            required 
            className={cn("h-11 transition-colors outline-none focus:outline-none focus-visible:ring-0", isDarkTheme 
              ? "border-zinc-700 focus:border-white bg-zinc-800/50 focus:bg-zinc-800 text-white placeholder:text-zinc-400" 
              : "border-gray-300 focus:border-gray-900 bg-gray-50 focus:bg-white")}
          />
        </Field>
        {error && (
          <p className={cn("text-sm font-medium", isDarkTheme ? "text-red-400" : "text-red-600")}>
            {error}
          </p>
        )}
        <Field>
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className={cn("h-11 hover:shadow-lg active:scale-[0.98] transition-all duration-150 w-full font-medium text-base rounded-lg", isDarkTheme 
              ? "bg-white text-black hover:!bg-gray-100" 
              : "bg-gray-900 text-white hover:!bg-gray-800")}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                {buttonText}
              </span>
            ) : (
              buttonText
            )}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            disabled={isGitHubLoading}
            onClick={handleGithub}
            className={cn("h-11 hover:shadow-md active:scale-[0.98] transition-all duration-150 w-full font-medium text-base rounded-lg", isDarkTheme 
              ? "text-white hover:!text-white border-white/30 hover:bg-white/10 hover:border-white/50" 
              : "text-gray-900 hover:!text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400")}
          >
            {isGitHubLoading ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" fill="currentColor"></path>
              </svg>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 
                    0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61
                    C4.422 18.07 3.633 17.7 3.633 17.7
                    c-1.087-.744.084-.729.084-.729
                    1.205.084 1.838 1.236 1.838 1.236
                    1.07 1.835 2.809 1.305 3.495.998
                    .108-.776.417-1.305.76-1.605
                    -2.665-.3-5.466-1.332-5.466-5.93
                    0-1.31.465-2.38 1.235-3.22
                    -.135-.303-.54-1.523.105-3.176
                    0 0 1.005-.322 3.3 1.23
                    .96-.267 1.98-.399 3-.405
                    1.02.006 2.04.138 3 .405
                    2.28-1.552 3.285-1.23 3.285-1.23
                    .645 1.653.24 2.873.12 3.176
                    .765.84 1.23 1.91 1.23 3.22
                    0 4.61-2.805 5.625-5.475 5.92
                    .42.36.81 1.096.81 2.22
                    0 1.606-.015 2.896-.015 3.286
                    0 .315.21.69.825.57
                    C20.565 22.092 24 17.592 24 12.297
                    c0-6.627-5.373-12-12-12"
                    fill="currentColor"
                  />
                </svg>
                <span>Continue with GitHub</span>
              </>
            )}
          </Button>

          <FieldDescription className={cn("text-center mt-2", isDarkTheme ? "text-gray-400" : "text-gray-600")}>
            {isLogin ? (
              <>Don&apos;t have an account?{" "}
                <a href="/register" className={cn("underline underline-offset-4 font-semibold transition-colors", isDarkTheme ? "text-white hover:text-gray-300" : "text-gray-900 hover:text-gray-700")}>Sign up</a></>
            ) : (
              <>Already have an account?{" "}
                <a href="/login" className={cn("underline underline-offset-4 font-semibold transition-colors", isDarkTheme ? "text-white hover:text-gray-300" : "text-gray-900 hover:text-gray-700")}>Login</a></>
            )}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default AuthForm;
