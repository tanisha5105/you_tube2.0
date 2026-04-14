import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="bg-red-600 p-4 rounded-2xl mb-6">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </div>
      <h1 className="text-6xl font-bold mb-2">404</h1>
      <p className="text-xl text-gray-500 mb-6">This page could not be found.</p>
      <Link href="/">
        <Button className="flex items-center gap-2">
          <Home className="w-4 h-4" /> Go Home
        </Button>
      </Link>
    </main>
  );
}
