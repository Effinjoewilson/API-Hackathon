"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/AuthGuard";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname === "/login" || pathname === "/signup";

  return (
    <>
      {isPublic ? (
        children
      ) : (
        <AuthGuard>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthGuard>
      )}
    </>
  );
}