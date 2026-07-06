import React, { useState } from "react";
import { ChevronLeft, Bookmark, Flag, AlertTriangle, CheckCircle, ExternalLink, ShieldAlert } from "lucide-react";
import { Article } from "../types.js";
import { motion, AnimatePresence } from "motion/react";

interface ArticleDetailViewProps {
  article: Article;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => Promise<void>;
  isAuthenticated: boolean;
  onReport: (articleId: string, reason: string, details: string) => Promise<boolean>;
}

// Simple Markdown Parser to avoid large external bundle weight and ensure seamless React 19 rendering
function renderMarkdownToHTML(markdown: string) {
  if (!markdown) return "";
  
  // Basic translation of common patterns
  let html = markdown
    // Headings
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    // Tables
    .replace(/\|(.+)\|/g, (match, p1) => {
      const cols = p1.split('|').map((c: string) => c.trim());
      // Check if it's the header separator (e.g. ---|---)
      if (cols.every((c: string) => c.startsWith('---') || c.startsWith(':---'))) {
        return '';
      }
      return `<tr>${cols.map((c: string) => `<td>${c}</td>`).join('')}</tr>`;
    })
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Lists
    .replace(/^\*\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/^(?!<(h2|h3|li|tr|table|thead|tbody|th|td))(.+)$/gm, '<p>$2</p>');

  // Wrap groups of <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul className="list-disc my-2">${match}</ul>`);
  
  // Wrap <tr> in a <table>
  html = html.replace(/(<tr>.*?<\/tr>)+/gs, (match) => `
    <div class="overflow-x-auto my-4 border border-gray-100 rounded-xl">
      <table class="min-w-full divide-y divide-gray-100">
        ${match}
      </table>
    </div>
  `);

  // Remove empty paragraph tags that might leak
  html = html.replace(/<p><\/p>/g, '');

  return html;
}

export default function ArticleDetailView({
  article,
  onBack,
  isSaved,
  onToggleSave,
  isAuthenticated,
  onReport
}: ArticleDetailViewProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("outdated");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      alert("Please log in or sign up first to bookmark articles!");
      return;
    }
    setSavingLoading(true);
    await onToggleSave(article.id);
    setSavingLoading(false);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    const ok = await onReport(article.id, reportReason, reportDetails);
    setSubmittingReport(false);
    if (ok) {
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setShowReportModal(false);
        setReportDetails("");
      }, 3000);
    }
  };

  return (
    <div className="pb-24 bg-white animate-fade-in">
      {/* Article Top Navigation bar */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-medical-600 transition-all focus:outline-none"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSave}
            disabled={savingLoading}
            className={`p-2.5 rounded-full border focus:outline-none transition-all ${
              isSaved
                ? "bg-medical-50 border-medical-200 text-medical-600 scale-105"
                : "bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
            title="Save Article"
          >
            <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="p-2.5 rounded-full border border-gray-200 bg-white text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 focus:outline-none transition-all"
            title="Flag/Report content quality"
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 pt-6 max-w-prose mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-medical-50 text-medical-700 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide">
            {article.category}
          </span>
          {!article.approved && (
            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-100">
              Draft Pending Approval
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4 tracking-tight">
          {article.title}
        </h1>

        {/* Source and metadata */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Source Reference</p>
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mt-0.5">
              <ExternalLink className="w-4 h-4 text-medical-500 shrink-0" />
              {article.source}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Published</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {new Date(article.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Abstract/Summary Card */}
        <div className="border-l-4 border-medical-500 pl-4 py-2 italic text-gray-600 mb-6 bg-medical-50/25 rounded-r-xl pr-2 text-sm leading-relaxed">
          <strong>Summary:</strong> {article.summary}
        </div>

        {/* Article Body */}
        <div
          className="markdown-body text-gray-800"
          dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(article.content) }}
        />

        {/* Tag Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-semibold mb-2 uppercase">Keywords & Discoverability Tags</p>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-lg transition-colors cursor-default"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Flag / Moderation Reporting Modal Overlay */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-gray-100 focus:outline-none"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-50 p-2.5 rounded-2xl text-red-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Flag Article</h3>
                  <p className="text-xs text-gray-500">Report errors or outdated medical content</p>
                </div>
              </div>

              {reportSuccess ? (
                <div className="py-10 text-center animate-pulse">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-gray-900">Report Successfully Filed</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                    Thank you. Our medical editorial board and administrators have been notified to review this piece.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                      Reason for Report
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
                    >
                      <option value="outdated">Outdated clinical guidelines</option>
                      <option value="incorrect">Inaccurate medical claims</option>
                      <option value="unsafe">Unsafe / dangerous advice</option>
                      <option value="irrelevant">Spam, ads, or irrelevant content</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                      Add details (What needs correction?)
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please describe exactly which parts are incorrect, outdated, or unsafe, with links to scientific literature if available."
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReportModal(false);
                        setReportDetails("");
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl focus:outline-none transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReport}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-3 rounded-xl focus:outline-none transition-colors disabled:opacity-50"
                    >
                      {submittingReport ? "Filing..." : "Submit Report"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
