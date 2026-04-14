import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { ThemeProvider } from "../lib/ThemeContext";
import { useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <UserProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          <title>YourTube Clone</title>
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <Toaster />
          <div className="flex">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Component {...pageProps} />
          </div>
        </div>
      </ThemeProvider>
    </UserProvider>
  );
}
