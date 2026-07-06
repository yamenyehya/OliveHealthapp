import { useState, useEffect } from "react";
import { Article, ChatMessage, User } from "./types.js";
import BottomNav from "./components/BottomNav.js";
import BrowseView from "./components/BrowseView.js";
import ArticleDetailView from "./components/ArticleDetailView.js";
import AssistantView from "./components/AssistantView.js";
import SavedView from "./components/SavedView.js";
import ProfileView from "./components/ProfileView.js";
import LoginView from "./components/LoginView.js";
import SettingsView from "./components/SettingsView.js";
import DoctorsView from "./components/DoctorsView.js";
import DoctorHubView from "./components/DoctorHubView.js";
import AdminHubView from "./components/AdminHubView.js";
import { CookieBanner, LegalModal } from "./components/LegalViews.js";
import { PaeonixLogo } from "./components/PaeonixLogo.js";

const THEME_COLORS: Record<string, Record<string, string>> = {
  botanical: {
    "--color-medical-50": "#F1F4F0",
    "--color-medical-100": "#E1E7E0",
    "--color-medical-200": "#CDD6CB",
    "--color-medical-500": "#8CA18B",
    "--color-medical-600": "#6E7F6D",
    "--color-medical-700": "#546353",
    "--color-medical-950": "#2C302E",
    "--app-bg": "#F7F9F6",
    "--app-card-bg": "#FFFFFF",
    "--app-text": "#2C302E",
    "--app-text-muted": "#656E69",
    "--app-border": "#E1E7E0",
    "--app-border-dark": "#CDD6CB"
  },
  terracotta: {
    "--color-medical-50": "#FAF4F0",
    "--color-medical-100": "#F3E6DF",
    "--color-medical-200": "#EAD2C6",
    "--color-medical-500": "#D09E88",
    "--color-medical-600": "#E2B4A4",
    "--color-medical-700": "#B58069",
    "--color-medical-950": "#3D2E2B",
    "--app-bg": "#FAF6F0",
    "--app-card-bg": "#FFFFFF",
    "--app-text": "#3D2E2B",
    "--app-text-muted": "#7E6C68",
    "--app-border": "#F3E6DF",
    "--app-border-dark": "#EAD2C6"
  },
  radiance: {
    "--color-medical-50": "#F3FAF7",
    "--color-medical-100": "#E5F2ED",
    "--color-medical-200": "#CEE5DD",
    "--color-medical-500": "#8FB9A8",
    "--color-medical-600": "#C1E1C1",
    "--color-medical-700": "#749D8D",
    "--color-medical-950": "#2E3D44",
    "--app-bg": "#FAFAFA",
    "--app-card-bg": "#FFFFFF",
    "--app-text": "#2E3D44",
    "--app-text-muted": "#667C86",
    "--app-border": "#E5F2ED",
    "--app-border-dark": "#CEE5DD"
  },
  phoenix: {
    "--color-medical-50": "#FAF5F2",
    "--color-medical-100": "#F6E6E3",
    "--color-medical-200": "#EDD0CB",
    "--color-medical-500": "#E8A79B",
    "--color-medical-600": "#F3C6BC",
    "--color-medical-700": "#CC8C80",
    "--color-medical-950": "#262322",
    "--app-bg": "#FAF8F5",
    "--app-card-bg": "#FFFFFF",
    "--app-text": "#262322",
    "--app-text-muted": "#6E6462",
    "--app-border": "#F6E6E3",
    "--app-border-dark": "#EDD0CB"
  }
};
// Aliases for backward compatibility
THEME_COLORS.olive = THEME_COLORS.botanical;
THEME_COLORS.emerald = THEME_COLORS.radiance;
THEME_COLORS.gold = THEME_COLORS.terracotta;
THEME_COLORS.slate = THEME_COLORS.phoenix;

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("browse");
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const [legalTab, setLegalTab] = useState<"privacy" | "cookies">("privacy");
  
  // Authentication States
  const [token, setToken] = useState<string | null>(() => {
    // Force unsign once if requested
    const hasUnsigned = localStorage.getItem("paeonix_force_unsigned_v1");
    if (!hasUnsigned) {
      localStorage.removeItem("health_platform_token");
      localStorage.setItem("paeonix_force_unsigned_v1", "true");
      return null;
    }
    return localStorage.getItem("health_platform_token");
  });
  const [user, setUser] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(!!token);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(() => {
    return window.location.pathname !== "/signup";
  });

  // Dynamic Theme Swapper Effect
  useEffect(() => {
    let activeTheme = user?.settings?.theme || localStorage.getItem("paeonix_theme") || "botanical";
    if (activeTheme === "olive") activeTheme = "botanical";
    else if (activeTheme === "emerald") activeTheme = "radiance";
    else if (activeTheme === "gold") activeTheme = "terracotta";
    else if (activeTheme === "slate") activeTheme = "phoenix";

    const colors = THEME_COLORS[activeTheme] || THEME_COLORS.botanical;
    Object.entries(colors).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  }, [user?.settings?.theme]);

  // Chat States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [articlesLoading, setArticlesLoading] = useState<boolean>(true);
  const [chatThinking, setChatThinking] = useState<boolean>(false);

  const handleSelectArticle = (art: Article | null) => {
    setSelectedArticle(art);
    if (art) {
      const slug = art.slug || art.title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
      window.history.pushState(null, "", `/articles/${slug}`);
    } else {
      const targetPath = activeTab === "browse" ? "/" : `/${activeTab}`;
      window.history.pushState(null, "", targetPath);
    }
  };

  // Custom client-side router and URL synchronization effect
  useEffect(() => {
    const handleLocationChange = async () => {
      const path = window.location.pathname;
      if (path.startsWith("/articles/")) {
        const slug = path.split("/articles/")[1];
        if (slug) {
          try {
            const headers: HeadersInit = {};
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }
            const res = await fetch(`/api/articles/by-slug/${slug}`, { headers });
            if (res.ok) {
              const art = await res.json();
              setSelectedArticle(art);
            } else {
              window.history.replaceState(null, "", "/");
              setSelectedArticle(null);
            }
          } catch (err) {
            console.error("Error loading article by slug route:", err);
          }
        }
      } else {
        setSelectedArticle(null);
        if (path === "/assistant") {
          setActiveTab("assistant");
        } else if (path === "/saved") {
          setActiveTab("saved");
        } else if (path === "/doctors") {
          setActiveTab("doctors");
        } else if (path === "/doctor-hub") {
          setActiveTab("doctor-hub");
        } else if (path === "/admin-hub") {
          setActiveTab("admin-hub");
        } else if (path === "/profile") {
          setActiveTab("profile");
        } else if (path === "/settings") {
          setActiveTab("settings");
        } else if (path === "/signup") {
          setIsLoginMode(false);
        } else if (path === "/login") {
          setIsLoginMode(true);
        } else {
          setActiveTab("browse");
        }
      }
    };

    handleLocationChange();
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, [token]);

  // Sync activeTab state changes to the URL pathname
  useEffect(() => {
    if (!user || selectedArticle) return;
    
    const currentPath = window.location.pathname;
    const targetPath = activeTab === "browse" ? "/" : `/${activeTab}`;
    
    if (currentPath !== targetPath && !currentPath.startsWith("/articles/")) {
      window.history.pushState(null, "", targetPath);
    }
  }, [activeTab, user, selectedArticle]);

  // Sync non-logged-in redirection
  useEffect(() => {
    if (!profileLoading && !user) {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/signup") {
        window.history.replaceState(null, "", isLoginMode ? "/login" : "/signup");
      }
    }
  }, [user, profileLoading, isLoginMode]);

  // Fetch articles and user profile on load or token change
  useEffect(() => {
    fetchArticles();
    if (token) {
      fetchProfile();
    } else {
      setUser(null);
      setProfileLoading(false);
    }
  }, [token]);

  const fetchArticles = async () => {
    setArticlesLoading(true);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/articles", { headers });
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error("Error loading articles:", err);
    }
    setArticlesLoading(false);
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Stale or invalid token
        handleLogout();
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogin = async (emailStr: string, passStr: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailStr, password: passStr })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("health_platform_token", data.token);
        setToken(data.token);
        setUser(data.user);
        return true;
      } else {
        const err = await res.json();
        throw new Error(err.error || "Login credentials rejected.");
      }
    } catch (err: any) {
      console.error("Login service error:", err);
      throw err;
    }
  };

  const handleSignup = async (emailStr: string, passStr: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailStr, password: passStr })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("health_platform_token", data.token);
        setToken(data.token);
        setUser(data.user);
        return true;
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to create account.");
      }
    } catch (err: any) {
      console.error("Registration service error:", err);
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("health_platform_token");
    setToken(null);
    setUser(null);
    setChatHistory([]);
    setSelectedArticle(null);
    setActiveTab("browse");
  };

  const handleToggleSave = async (articleId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/articles/${articleId}/toggle-save`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (user) {
          setUser({ ...user, savedArticles: data.savedArticles });
        }
      }
    } catch (err) {
      console.error("Error toggling bookmark save:", err);
    }
  };

  const handleReportArticle = async (articleId: string, reason: string, details: string): Promise<boolean> => {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api/articles/${articleId}/report`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason, details })
      });
      return res.ok;
    } catch (err) {
      console.error("Error submitting report:", err);
      return false;
    }
  };

  const handleSendChatMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      sender: "user",
      text,
      createdAt: new Date().toISOString()
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setChatThinking(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-10) // Send last 10 messages for context
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `ai-msg-${Date.now()}`,
          sender: "assistant",
          text: data.text,
          createdAt: new Date().toISOString(),
          suggestedArticles: data.suggestedArticles || []
        };
        setChatHistory((prev) => [...prev, assistantMsg]);
      } else {
        const err = await res.json();
        const assistantError: ChatMessage = {
          id: `ai-msg-err-${Date.now()}`,
          sender: "assistant",
          text: err.error || "I am currently offline due to missing secure system configurations. Please check with your platform administrator to verify the active AI gateway settings.",
          createdAt: new Date().toISOString()
        };
        setChatHistory((prev) => [...prev, assistantError]);
      }
    } catch (err) {
      const assistantError: ChatMessage = {
        id: `ai-msg-err-${Date.now()}`,
        sender: "assistant",
        text: "I was unable to reach the AI Assistant gateway. Please check your internet connection.",
        createdAt: new Date().toISOString()
      };
      setChatHistory((prev) => [...prev, assistantError]);
    }
    setChatThinking(false);
  };

  // Filter bookmarked articles
  const savedArticles = articles.filter((a) => user?.savedArticles?.includes(a.id));

  // Determine if owner admin logged in
  const isOwnerAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-800 pb-16 md:pb-0">
      
      {/* Sleek Header Navigation for Desktop / Tablet */}
      {user && (
        <header className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs">
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
            <div 
              className="flex items-center gap-2.5 cursor-pointer select-none" 
              onClick={() => { handleSelectArticle(null); setActiveTab("browse"); }}
            >
              <PaeonixLogo size="md" showText={true} />
            </div>

            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-1.5">
                {[
                  { id: "browse", label: "Browse Articles" },
                  { id: "assistant", label: "AI Assistant" },
                  { id: "saved", label: "Bookmarks" },
                  { id: "doctors", label: "Doctors" },
                  ...(user?.role === "doctor" ? [{ id: "doctor-hub", label: "Doctor Hub" }] : []),
                  ...(isOwnerAdmin ? [{ id: "admin-hub", label: "Admin Hub" }] : []),
                  { id: "profile", label: "Profile" },
                  { id: "settings", label: "Settings" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleSelectArticle(null);
                      setActiveTab(item.id);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === item.id
                        ? "bg-medical-500 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="h-6 w-[1px] bg-gray-200" />

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-medical-50/80 border border-medical-100/50">
                <div className="w-2 h-2 rounded-full bg-medical-500 animate-pulse" />
                <span className="text-xs font-extrabold text-medical-900 truncate max-w-[150px]">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main viewport */}
      <div className="flex-1 w-full max-w-7xl mx-auto md:px-6 py-0 md:py-6 flex flex-col min-h-0">
        <main className="flex-1 bg-white md:rounded-3xl md:border md:border-gray-100 md:shadow-xs flex flex-col overflow-hidden min-h-0">
          {profileLoading ? (
            /* Elegant brand loading splash */
            <div className="flex-1 flex flex-col items-center justify-center bg-white p-8">
              <PaeonixLogo size="xl" className="mb-4" showText={true} />
              <p className="text-[10px] text-gray-400 font-medium mt-1">Connecting securely to medical records...</p>
            </div>
          ) : !user ? (
            /* Required Login Portal */
            <LoginView
              onLogin={handleLogin}
              onSignup={handleSignup}
              isLoginMode={isLoginMode}
              onModeChange={(loginMode) => {
                setIsLoginMode(loginMode);
                window.history.pushState(null, "", loginMode ? "/login" : "/signup");
              }}
            />
          ) : selectedArticle ? (
            <ArticleDetailView
              article={selectedArticle}
              onBack={() => {
                handleSelectArticle(null);
                // Refresh articles in case an admin was reading / editing
                fetchArticles();
              }}
              isSaved={user?.savedArticles?.includes(selectedArticle.id) || false}
              onToggleSave={handleToggleSave}
              isAuthenticated={!!user}
              onReport={handleReportArticle}
            />
          ) : (
            <>
              {activeTab === "browse" && (
                <BrowseView
                  articles={articles}
                  onSelectArticle={handleSelectArticle}
                  loading={articlesLoading}
                  lang={user?.settings?.language || "en"}
                />
              )}

              {activeTab === "assistant" && (
                <AssistantView
                  chatHistory={chatHistory}
                  onSendMessage={handleSendChatMessage}
                  onSelectArticle={handleSelectArticle}
                  articles={articles}
                  isThinking={chatThinking}
                  lang={user?.settings?.language || "en"}
                />
              )}

              {activeTab === "saved" && (
                <SavedView
                  savedArticles={savedArticles}
                  onSelectArticle={handleSelectArticle}
                  isAuthenticated={!!user}
                  onNavigateToAuth={() => setActiveTab("profile")}
                  lang={user?.settings?.language || "en"}
                />
              )}

              {activeTab === "doctors" && (
                <DoctorsView
                  user={user}
                  token={token || ""}
                />
              )}

              {activeTab === "doctor-hub" && (
                <DoctorHubView
                  user={user}
                  articles={articles}
                  token={token || ""}
                  onRefreshArticles={fetchArticles}
                />
              )}

              {activeTab === "admin-hub" && (
                <AdminHubView
                  articles={articles}
                  onRefreshArticles={fetchArticles}
                  token={token || ""}
                />
              )}

              {activeTab === "profile" && (
                <ProfileView
                  user={user}
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                  onLogout={handleLogout}
                  articles={articles}
                  onSelectArticle={handleSelectArticle}
                  onRefreshArticles={fetchArticles}
                  token={token || ""}
                />
              )}

              {activeTab === "settings" && (
                <SettingsView
                  user={user}
                  onLogout={handleLogout}
                  token={token || ""}
                  onRefreshProfile={fetchProfile}
                />
              )}
            </>
          )}
        </main>

        {/* Compliance Footer Links */}
        <div className="px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-gray-400 font-bold border-t border-gray-100 bg-white/50 backdrop-blur-xs md:rounded-b-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 select-none text-center sm:text-left">
            <span>© 2026 PAEONIX. Evidence-Based Clinical Portal.</span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span>
              Powered & Crafted by{" "}
              <a 
                href="https://nuxweb.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-medical-600 hover:text-medical-700 hover:underline transition-all font-extrabold"
              >
                NuxWeb Agency
              </a>
            </span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => { setLegalTab("privacy"); setIsLegalOpen(true); }}
              className="hover:text-medical-600 transition-all cursor-pointer underline decoration-dotted underline-offset-2"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => { setLegalTab("cookies"); setIsLegalOpen(true); }}
              className="hover:text-medical-600 transition-all cursor-pointer underline decoration-dotted underline-offset-2"
            >
              Cookies Usage
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dock - hidden on desktop */}
        {user && !selectedArticle && (
          <div className="md:hidden">
            <BottomNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isAdmin={isOwnerAdmin}
              isDoctor={user?.role === "doctor"}
              lang={user?.settings?.language || "en"}
            />
          </div>
        )}
      </div>

      {/* Global Modals and Banners */}
      <CookieBanner onAccept={() => {}} />
      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab={legalTab}
      />
    </div>
  );
}
