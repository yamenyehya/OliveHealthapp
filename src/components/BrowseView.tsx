import { useState, useMemo } from "react";
import { Search, ChevronRight, BookOpen, Sparkles, MessageSquare } from "lucide-react";
import { Article } from "../types.js";
import { motion } from "motion/react";
import { useTranslation } from "../localization.js";
import { PaeonixLogo } from "./PaeonixLogo.js";

interface BrowseViewProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  loading: boolean;
  lang?: string;
  onTryAIChat?: () => void;
}

export default function BrowseView({ articles, onSelectArticle, loading, lang = "en", onTryAIChat }: BrowseViewProps) {
  const { t } = useTranslation(lang);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Topics");
  const [showFeatureAd, setShowFeatureAd] = useState(() => {
    return localStorage.getItem("paeonix_hide_chat_feature_ad_v1") !== "true";
  });

  const categoryLabelMap: Record<string, string> = {
    "All Topics": t("allTopics"),
    "Chronic Conditions": t("chronicConditions"),
    "Cardiovascular Health": t("cardioHealth"),
    "General Wellness": t("generalWellness"),
    "Infectious Diseases": t("infectiousDiseases"),
    "Mental Health": t("mentalHealth")
  };

  const CATEGORIES = [
    "All Topics",
    "Chronic Conditions",
    "Cardiovascular Health",
    "General Wellness",
    "Infectious Diseases",
    "Mental Health"
  ];

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory =
        selectedCategory === "All Topics" || article.category === selectedCategory;

      const cleanQuery = searchQuery.toLowerCase().trim();
      if (!cleanQuery) return matchesCategory;

      const matchesSearch =
        article.title.toLowerCase().includes(cleanQuery) ||
        article.summary.toLowerCase().includes(cleanQuery) ||
        article.content.toLowerCase().includes(cleanQuery) ||
        article.category.toLowerCase().includes(cleanQuery) ||
        article.tags.some((tag) => tag.toLowerCase().includes(cleanQuery));

      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  const spotlightArticle = useMemo(() => {
    if (!articles || articles.length === 0) return null;
    // Prioritize approved articles if any are approved, otherwise use any
    const pool = articles.filter((a) => a.approved !== false);
    const finalPool = pool.length > 0 ? pool : articles;

    // Use a deterministic hash based on YYYY-MM-DD
    const dateStr = new Date().toISOString().split("T")[0];
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % finalPool.length;
    return finalPool[idx];
  }, [articles]);

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header Panel */}
      <div className="bg-gradient-to-b from-medical-50 to-white pt-6 pb-4 px-4 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <PaeonixLogo size="sm" showText={true} />
          <div className="bg-medical-100 text-medical-800 text-[9px] font-bold py-1 px-2.5 rounded-full border border-medical-200">
            {t("verifiedSource")}
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Categories Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all focus:outline-none ${
                  isSelected
                    ? "bg-medical-500 text-white shadow-md scale-102"
                    : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 shadow-sm"
                }`}
              >
                {categoryLabelMap[cat] || cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Listing Content */}
      <div className="px-4 mt-2">
        {/* Daily Medical Spotlight Banner */}
        {selectedCategory === "All Topics" && !searchQuery && spotlightArticle && (
          <div 
            onClick={() => onSelectArticle(spotlightArticle)}
            className="bg-gradient-to-br from-medical-600 to-medical-700 text-white rounded-3xl p-5 mb-5 shadow-md shadow-medical-700/10 relative overflow-hidden cursor-pointer hover:brightness-105 hover:scale-[1.01] active:scale-[0.99] transition-all group"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/5 rounded-full transition-transform duration-300 group-hover:scale-110" />
            
            <span className="bg-white/20 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
              {t("dailyFocus")}
            </span>
            <h2 className="text-base font-bold tracking-tight mb-1 leading-snug group-hover:text-medical-100 transition-colors">
              {spotlightArticle.title}
            </h2>
            <p className="text-xs text-white/80 leading-relaxed mb-4 line-clamp-2">
              {spotlightArticle.summary}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60 font-mono">
                PAEONIX Certified • {categoryLabelMap[spotlightArticle.category] || spotlightArticle.category}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectArticle(spotlightArticle);
                }}
                className="bg-white text-medical-800 text-[10px] font-extrabold px-3 py-1.5 rounded-xl hover:bg-gray-50 active:scale-98 transition-all"
              >
                {t("learnMore")}
              </button>
            </div>
          </div>
        )}

        {/* Secure AI Chat Update Advertisement Box */}
        {selectedCategory === "All Topics" && !searchQuery && showFeatureAd && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 mb-5 shadow-sm relative overflow-hidden animate-fade-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFeatureAd(false);
                localStorage.setItem("paeonix_hide_chat_feature_ad_v1", "true");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all p-1 rounded-full hover:bg-gray-50"
              title="Dismiss ad"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-3.5">
              <div className="bg-medical-50 text-medical-600 p-2.5 rounded-2xl shrink-0 mt-0.5 shadow-inner">
                <Sparkles className="w-5 h-5 text-medical-500" />
              </div>
              <div className="pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="bg-medical-100 text-medical-800 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    NEW FEATURE UPDATE
                  </span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 mt-2">
                  Clinical AI Communication Assistant
                </h3>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                  Paeonix has introduced a high-security Clinical AI Chat designed to <strong>improve communication between patients and their doctors</strong>.
                </p>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                  The AI is fully restricted from diagnosing, prescribing, or replacing professional clinical oversight. Its purpose is to help you understand medical information, translate complex terminology, organize your symptom timeline, and automatically prepare a **structured message in your language** ({lang.toUpperCase()}) to share directly with your doctor.
                </p>

                {onTryAIChat && (
                  <button
                    onClick={onTryAIChat}
                    className="mt-4 flex items-center gap-1.5 bg-medical-600 hover:bg-medical-700 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl transition-all shadow-sm focus:outline-none"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Launch AI Chat Assistant</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-medical-500 mb-4" />
            <p className="text-sm text-gray-500">{t("connecting")}</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-3xl p-6 border border-dashed border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No matching articles found</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
              Try exploring different terms or search symptoms like "fever" or "blood pressure".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredArticles.map((article, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
                key={article.id}
                onClick={() => onSelectArticle(article)}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md overflow-hidden border border-gray-100 shadow-2xs shrink-0">
                        <img 
                          src="/files/icon/icon.svg" 
                          alt="Paeonix Icon" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <span className="bg-medical-50 text-medical-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {categoryLabelMap[article.category] || article.category}
                      </span>
                    </div>
                    {!article.approved && (
                      <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-100">
                        Pending Approval
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-gray-800 tracking-tight leading-snug line-clamp-2 mb-2 hover:text-medical-600 transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                    {article.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1 max-w-[70%] overflow-hidden">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-medical-500 text-xs font-semibold flex items-center gap-1 shrink-0">
                    {t("learnMore")} <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Custom Partnership Attribution Banner */}
        <div className="mt-8 bg-gradient-to-r from-medical-50 to-gray-50/50 border border-medical-100/40 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left shadow-xs">
          <div>
            <h4 className="text-xs font-extrabold text-medical-950 uppercase tracking-wider">
              Need Custom Clinical Software?
            </h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              This evidence-based clinical platform was crafted and engineered by the experts at <strong>NuxWeb Agency</strong>. Let's build your next app together.
            </p>
          </div>
          <a 
            href="https://nuxweb.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-medical-600 hover:bg-medical-700 active:scale-98 text-white font-extrabold text-[10px] px-4.5 py-2.5 rounded-xl text-center shadow-sm hover:shadow-md transition-all shrink-0 uppercase tracking-wider"
          >
            Powered by NuxWeb Agency
          </a>
        </div>
      </div>
    </div>
  );
}
