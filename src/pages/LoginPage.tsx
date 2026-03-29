import React, { useState } from "react";
import { Refrigerator } from "lucide-react";
import { motion } from "motion/react";
import { AnimatePresence } from "motion/react";
import Notification from "../components/Notification";
import type { User } from "../types";

interface LoginPageProps {
  onLoginSuccess: (token: string, user: User) => void;
}

type LoginView = 'login' | 'forgot' | 'reset';

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [view, setView] = useState<LoginView>('login');
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetForm, setResetForm] = useState({ code: "", newPassword: "", confirmPassword: "" });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      if (res.ok) {
        const { token, user } = await res.json();
        localStorage.setItem("token", token);
        onLoginSuccess(token, user);
      } else {
        showNotification("Invalid credentials", "error");
      }
    } catch {
      showNotification("Login failed", "error");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (res.ok) {
        showNotification("Check your Slack DMs for a reset code.");
        setView('reset');
        setResetForm({ code: "", newPassword: "", confirmPassword: "" });
      } else {
        const { error } = await res.json();
        showNotification(error || "Request failed", "error");
      }
    } catch {
      showNotification("Request failed", "error");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      showNotification("Passwords do not match", "error");
      return;
    }
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: resetForm.code, newPassword: resetForm.newPassword }),
      });
      if (res.ok) {
        showNotification("Password updated! Please sign in.");
        setView('login');
        setForgotEmail("");
        setResetForm({ code: "", newPassword: "", confirmPassword: "" });
      } else {
        const { error } = await res.json();
        showNotification(error || "Reset failed", "error");
      }
    } catch {
      showNotification("Reset failed", "error");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 p-8 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-block bg-emerald-600 p-3 rounded-2xl mb-2">
            <Refrigerator className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FridgeShare</h1>
          {view === 'login' && (
            <>
              <p className="text-stone-500">Sign in to manage the house fridge</p>
              <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100 text-left">
                <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Sample Credentials</p>
                <p className="text-xs text-stone-600">Email: <span className="font-mono">admin@example.com</span></p>
                <p className="text-xs text-stone-600">Password: <span className="font-mono">admin123</span></p>
              </div>
            </>
          )}
          {view === 'forgot' && (
            <p className="text-stone-500">Enter your email and we'll send a reset code to your Slack</p>
          )}
          {view === 'reset' && (
            <p className="text-stone-500">
              Enter the 6-digit code sent to <span className="font-semibold text-stone-700">{forgotEmail}</span>
            </p>
          )}
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-stone-500">Email</label>
              <input
                required
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-stone-500">Password</label>
              <input
                required
                type="password"
                placeholder="Your password"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setView('forgot'); setForgotEmail(""); }}
              className="w-full text-sm text-stone-400 hover:text-emerald-600 transition-colors"
            >
              Forgot password?
            </button>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-stone-500">Email</label>
              <input
                required
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100"
            >
              Send Reset Code
            </button>
            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full text-sm text-stone-400 hover:text-emerald-600 transition-colors"
            >
              Back to sign in
            </button>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-stone-500">Reset Code</label>
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all tracking-widest text-center font-mono text-lg"
                value={resetForm.code}
                onChange={(e) => setResetForm({ ...resetForm, code: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-stone-500">New Password</label>
              <input
                required
                type="password"
                placeholder="New password"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={resetForm.newPassword}
                onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-stone-500">Confirm Password</label>
              <input
                required
                type="password"
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={resetForm.confirmPassword}
                onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100"
            >
              Reset Password
            </button>
            <button
              type="button"
              onClick={() => setView('forgot')}
              className="w-full text-sm text-stone-400 hover:text-emerald-600 transition-colors"
            >
              Resend code
            </button>
          </form>
        )}
      </motion.div>

      <AnimatePresence>
        {notification && <Notification message={notification.message} type={notification.type} />}
      </AnimatePresence>
    </div>
  );
}
