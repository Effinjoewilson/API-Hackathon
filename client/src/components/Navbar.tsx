"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">API Hackathon</h1>
      <div className="space-x-4">
        <Link href="/" className="hover:text-blue-400">Home</Link>
        <Link href="/about" className="hover:text-blue-400">About</Link>
        <Link href="/contact" className="hover:text-blue-400">Contact</Link>
      </div>
    </nav>
  );
}
