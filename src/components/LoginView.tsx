import React, { useState } from "react";
import { User, Lock, Mail, Activity, Eye, EyeOff, ShieldAlert, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PaeonixLogo } from "./PaeonixLogo";

interface LoginViewProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onSignup: (email: string, pass: string) => Promise<boolean>;
  isLoginMode?: boolean;
  onModeChange?: (isLogin: boolean) => void;
}

export default function LoginView({ onLogin, onSignup, isLoginMode: propIsLoginMode, onModeChange }: LoginViewProps) {
  const [localIsLoginMode, setLocalIsLoginMode] = useState(true);
  
  const isLoginMode = propIsLoginMode !== undefined ? propIsLoginMode : localIsLoginMode;
  const setIsLoginMode = (val: boolean) => {
    if (onModeChange) {
      onModeChange(val);
    } else {
      setLocalIsLoginMode(val);
    }
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      setErrorMessage("Please fill in all credentials.");
      return;
    }

    if (!isLoginMode && password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        await onLogin(emailTrim, password);
      } else {
        await onSignup(emailTrim, password);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error communicating with authentication servers.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google/url");
      const data = await res.json();
      if (!data.url) {
        throw new Error("No Google URL returned.");
      }

      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(
        data.url,
        "google-oauth-popup",
        `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
      );

      if (!popup) {
        setErrorMessage("Popup blocked! Please allow popups for PAEONIX to authenticate with Google.");
        setLoading(false);
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
          const { token } = event.data;
          localStorage.setItem("health_platform_token", token);
          window.location.reload();
          window.removeEventListener("message", handleMessage);
        } else if (event.data?.type === "OAUTH_AUTH_FAILURE") {
          setErrorMessage(`Google Login Failed: ${event.data.error}`);
          setLoading(false);
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setLoading(false);
        }
      }, 1000);
      
    } catch (err: any) {
      setErrorMessage("Could not connect to Google Authentication service.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center px-6 py-10 bg-gradient-to-b from-medical-50/70 to-white">
      {/* Top Brand Banner */}
      <div className="flex flex-col items-center text-center mb-8">
        <PaeonixLogo size="lg" className="mb-2" showText={true} />
        <p className="text-xs text-gray-500 mt-2 max-w-[240px] mx-auto leading-relaxed">
          Your secure, evidence-based portal for clinical knowledge and guidance.
        </p>
      </div>

      <motion.div
        layout
        className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl shadow-gray-100/50"
      >
        <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(true);
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              isLoginMode
                ? "bg-white text-medical-800 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(false);
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              !isLoginMode
                ? "bg-white text-medical-800 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-3.5 py-3 rounded-xl mb-5 flex flex-col gap-2 animate-shake">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {errorMessage.toLowerCase().includes("registered") && (
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(true);
                  setErrorMessage(null);
                }}
                className="mt-1 ml-6 text-left text-[11px] font-bold text-medical-700 hover:text-medical-800 underline cursor-pointer"
              >
                Switch to Sign In (Login) →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50/60 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50/60 border border-gray-100 rounded-xl py-3 pl-10 pr-10 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLoginMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50/60 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-medical-600 hover:bg-medical-700 active:scale-98 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-medical-600/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLoginMode ? (
              "Access Platform with Email"
            ) : (
              "Register Account with Email"
            )}
          </button>
        </form>

        {/* OR DIVIDER FOR THIRD PARTY SOCIAL SIGNUPS */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-400 font-extrabold tracking-wider text-[10px]">Or continue with</span>
          </div>
        </div>

        {/* GOOGLE INTEGRATION */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100/80 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 transition-all active:scale-98 shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.235 1.923 15.42 1 12.24 1 6.01 1 1 5.925 1 12s5.01 11 11.24 11c6.51 0 10.83-4.505 10.83-11 0-.74-.08-1.305-.18-1.715H12.24z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </motion.div>

      {/* Agency Footer Attribution */}
      <div className="text-center mt-6 select-none animate-fade-in">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Secured & Powered by{" "}
          <a 
            href="https://nuxweb.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-medical-600 hover:text-medical-700 hover:underline transition-all font-extrabold"
          >
            NuxWeb Agency
          </a>
        </p>
      </div>
    </div>
  );
}
