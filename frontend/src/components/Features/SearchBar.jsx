import React from "react";
import { useSearchParams } from "react-router-dom"
import Navbar from "@/components/Common/Navbar";
import Posts from "@/components/Features/ProductCard"

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="min-h-screen w-full bg-gray-100 text-gray-900">
      <Navbar />
      <Posts searchQuery={query} />
    </div>
  );
}

export default SearchPage;