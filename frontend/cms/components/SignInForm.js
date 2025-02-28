"use client";

import { useState, useEffect } from "react";
import { signIn } from "@/src/utils/cognitoAuth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [requireNewPassword, setRequireNewPassword] = useState(false);
  const [userAttributes, setUserAttributes] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEmailError("");
    setPasswordError("");
    setLoading(true);

    if (!email) {
      setEmailError("Email is required.");
      setLoading(false);
      return;
    }
    if (!password) {
      setPasswordError("Password is required.");
      setLoading(false);
      return;
    }

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
    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-all">
      <motion.div
        className="w-full max-w-md p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white">
          Sign In with Cognito Account
        </h2>

        {error && (
          <p className="mt-3 text-center text-red-500 text-sm">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-left">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${emailError ? "border-red-500" : ""}`}
              required
            />
            {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-left">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${passwordError ? "border-red-500" : ""}`}
              required
            />
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
            disabled={loading}
          >
            {loading ? "Processing..." : requireNewPassword ? "Set New Password" : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
