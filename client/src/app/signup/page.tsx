"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/Auth.css";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        alert("Signup successful! Please log in.");
        router.push("/login");
      } else {
        const data = await response.json();
        setError(data.detail || "Signup failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSignup} className="auth-card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-xl mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
          <p className="text-slate-600 mt-2">Get started with EndpointX</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="space-y-5">
          <div>
            <label className="auth-label">Username</label>
            <input
              className="auth-input"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-button" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </button>

        <p className="auth-link-text">
          Already have an account?
          <a href="/login" className="auth-link">Sign in</a>
        </p>
      </form>
    </div>
  );
}