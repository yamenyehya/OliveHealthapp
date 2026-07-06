import React, { useState } from "react";
import { User, Lock, Mail, LogOut, ShieldCheck, Clock, BookOpen, KeyRound, CheckCircle, PlusCircle, Edit3, Send, AlertCircle, Award } from "lucide-react";
import { Article, User as UserType } from "../types.js";
import AdminPanel from "./AdminPanel.js";
import { motion } from "motion/react";

interface ProfileViewProps {
  user: UserType | null;
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onSignup: (email: string, pass: string) => Promise<boolean>;
  onLogout: () => void;
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onRefreshArticles: () => Promise<void>;
  token: string;
}

export default function ProfileView({
  user,
  onLogin,
  onSignup,
  onLogout,
  articles,
  onSelectArticle,
  onRefreshArticles,
  token
}: ProfileViewProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Doctors Hub States
  const [doctorTab, setDoctorTab] = useState<"add" | "edit">("add");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftCategory, setDraftCategory] = useState("General Wellness");
  const [draftContent, setDraftContent] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftSource, setDraftSource] = useState("");
  const [editArticleId, setEditArticleId] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorSuccess, setDoctorSuccess] = useState<string | null>(null);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  const handleSubmitDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorLoading(true);
    setDoctorError(null);
    setDoctorSuccess(null);
    try {
      const res = await fetch("/api/doctor/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: draftTitle,
          summary: draftSummary,
          category: draftCategory,
          tags: draftTags.split(",").map(t => t.trim().toLowerCase()).filter(t => t !== ""),
          content: draftContent,
          source: draftSource || `${user?.role === "admin" ? "Administrator" : "Verified Doctor"} (${user?.email})`
        })
      });
      if (res.ok) {
        setDoctorSuccess("Draft submitted successfully! An administrator has been notified to review and publish it.");
        setDraftTitle("");
        setDraftSummary("");
        setDraftContent("");
        setDraftTags("");
        setDraftSource("");
      } else {
        const err = await res.json();
        setDoctorError(err.error || "Failed to submit draft.");
      }
    } catch (err) {
      setDoctorError("Could not connect to server.");
    } finally {
      setDoctorLoading(false);
    }
  };

  const handleSubmitEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editArticleId) {
      setDoctorError("Please select an article to suggest edits.");
      return;
    }
    setDoctorLoading(true);
    setDoctorError(null);
    setDoctorSuccess(null);

    const selectedArt = articles.find(a => a.id === editArticleId);
    if (!selectedArt) return;

    try {
      const res = await fetch("/api/doctor/edit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          articleId: editArticleId,
          articleTitle: selectedArt.title,
          details: editDetails
        })
      });
      if (res.ok) {
        setDoctorSuccess("Edit request submitted successfully! An administrator will review and apply the updates.");
        setEditDetails("");
        setEditArticleId("");
      } else {
        const err = await res.json();
        setDoctorError(err.error || "Failed to submit request.");
      }
    } catch (err) {
      setDoctorError("Could not connect to server.");
    } finally {
      setDoctorLoading(false);
    }
  };

  // Filter full articles for history
  const readingHistoryArticles = user?.readingHistory?.map((hist) => {
    const art = articles.find((a) => a.id === hist.articleId);
    return art ? { ...art, readAt: hist.readAt } : null;
  }).filter((x) => x !== null) || [];

  if (!user) {
    return (
      <div className="px-4 py-8 pb-24 animate-fade-in max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="bg-medical-50 text-medical-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-sm mb-3">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {isLoginMode ? "Sign In to Health Portal" : "Create Health Account"}
          </h1>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 leading-relaxed">
            Manage your bookmark library, track your health reading history, and access moderator controls.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!email || !password) return;
            if (!isLoginMode && password !== confirmPassword) {
              alert("Passwords do not match!");
              return;
            }
            setLoading(true);
            try {
              const ok = isLoginMode ? await onLogin(email, password) : await onSignup(email, password);
              if (ok) {
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }
            } catch (err: any) {
              alert(err.message || "An authentication error occurred.");
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4 bg-white border border-gray-100 p-5 rounded-3xl shadow-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500 transition-all"
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Confirm Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500 transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-medical-600 hover:bg-medical-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all active:scale-98 focus:outline-none text-sm disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLoginMode ? "Sign In" : "Register Account"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-xs text-medical-600 hover:text-medical-700 font-semibold focus:outline-none"
            >
              {isLoginMode ? "Don't have an account? Sign Up" : "Already registered? Sign In"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const isDoctor = user.role === "doctor";

  return (
    <div className="px-4 py-6 pb-24 space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* User Card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-medical-100 text-medical-700 p-3.5 rounded-2xl shrink-0">
            {isAdmin ? <ShieldCheck className="w-7 h-7" /> : isDoctor ? <Award className="w-7 h-7" /> : <User className="w-7 h-7" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base font-bold text-gray-900 truncate">{user.email}</h2>
              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                isAdmin ? "bg-medical-500 text-white" : isDoctor ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {user.role}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {isDoctor ? "Verified Medical Contributor" : "Account active and fully synchronized"}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-gray-100/50 focus:outline-none shrink-0"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* READING HISTORY AND STATS */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
          <Clock className="w-4 h-4" /> Personal Activity Stats
        </h3>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-center">
            <span className="block text-2xl font-extrabold text-medical-600">{user.savedArticles?.length || 0}</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Saved Articles</span>
          </div>
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-center">
            <span className="block text-2xl font-extrabold text-medical-600">{user.readingHistory?.length || 0}</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Articles Consulted</span>
          </div>
        </div>

        {readingHistoryArticles.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Recently Read</p>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {readingHistoryArticles.slice(0, 10).map((art: any, idx: number) => (
                <div
                  key={`${art.id}-${idx}`}
                  onClick={() => onSelectArticle(art)}
                  className="bg-gray-50 hover:bg-medical-50/50 border border-gray-100 hover:border-medical-100/50 rounded-xl p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-all"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-medical-700 bg-medical-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {art.category}
                    </span>
                    <h4 className="text-xs font-bold text-gray-700 truncate mt-1">{art.title}</h4>
                    <p className="text-[9px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Reviewed on {new Date(art.readAt).toLocaleDateString()}
                    </p>
                  </div>
                  <BookOpen className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
