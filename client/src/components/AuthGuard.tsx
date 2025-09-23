"use client";
import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    apiFetch("/accounts/check-auth/")
      .then(() => {
        setIsAuthenticated(true);
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}