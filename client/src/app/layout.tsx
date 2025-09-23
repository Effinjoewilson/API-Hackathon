import type { Metadata } from "next";
import LayoutWrapper from "./layout-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "EndpointX",
  description: "Streamline your API integrations and database connections",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}