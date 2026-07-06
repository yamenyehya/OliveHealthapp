import { Bookmark, ChevronRight, Lock } from "lucide-react";
import { Article } from "../types.js";
import { motion } from "motion/react";
import { useTranslation } from "../localization.js";

interface SavedViewProps {
  savedArticles: Article[];
  onSelectArticle: (article: Article) => void;
  isAuthenticated: boolean;
  onNavigateToAuth: () => void;
  lang?: string;
}

export default function SavedView({
  savedArticles,
  onSelectArticle,
  isAuthenticated,
  onNavigateToAuth,
  lang = "en"
}: SavedViewProps) {
  const { t } = useTranslation(lang);

  if (!isAuthenticated) {
    return (
      <div className="px-4 py-20 text-center space-y-6 max-w-sm mx-auto animate-fade-in">
        <div className="bg-medical-50 text-medical-600 p-5 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t("bookmarkTabTitle")}</h2>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            {t("noSavedDesc")}
          </p>
        </div>
        <button
          onClick={onNavigateToAuth}
          className="w-full bg-medical-600 hover:bg-medical-700 text-white font-semibold py-3 px-4 rounded-2xl shadow-md transition-all active:scale-98 focus:outline-none text-sm"
        >
          {t("loginBtn")}
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-medical-500 text-white p-2 rounded-xl shadow-md">
          <Bookmark className="w-6 h-6" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t("bookmarkTabTitle")}</h1>
          <p className="text-xs text-gray-500">{t("bookmarkTabDesc")}</p>
        </div>
      </div>

      {savedArticles.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl p-6 border border-dashed border-gray-200">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">{t("noSavedTitle")}</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 leading-relaxed">
            {t("noSavedDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">
            {savedArticles.length} Saved Article{savedArticles.length > 1 ? "s" : ""}
          </p>

          {savedArticles.map((article, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
            >
              <div className="min-w-0 pr-4">
                <span className="bg-medical-50 text-medical-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {article.category}
                </span>
                <h3 className="text-sm font-bold text-gray-800 tracking-tight mt-1 truncate">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  Source: {article.source}
                </p>
              </div>

              <div className="bg-medical-50 text-medical-600 p-2 rounded-xl shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
