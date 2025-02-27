"use client";

import { useState, useEffect } from "react";
import { signIn } from "@/src/utils/cognitoAuth";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [requireNewPassword, setRequireNewPassword] = useState(false);
  const [userAttributes, setUserAttributes] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Ensure that hydration mismatch doesn't happen by using useEffect
  useEffect(() => {
    setEmail(""); // Reset fields on client-side only
    setPassword("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await signIn(email.trim(), password, requireNewPassword ? newPassword : null);

      if (response?.message === "NEW_PASSWORD_REQUIRED") {
        setRequireNewPassword(true);
        setUserAttributes(response.userAttributes || {}); 
      } else {
        router.push("/dashboard"); 
      }
    } catch (err) {
      if (err.message === "NEW_PASSWORD_REQUIRED") {
        setRequireNewPassword(true);
        setUserAttributes(err.userAttributes || {});
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded text-black"
        required
        disabled={loading || requireNewPassword}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded text-black"
        required
        disabled={loading || requireNewPassword}
      />
      
      {requireNewPassword && (
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border p-2 rounded"
          required
          disabled={loading}
        />
      )}

      <button
        type="submit"
        className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Processing..." : requireNewPassword ? "Set New Password" : "Sign In"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
