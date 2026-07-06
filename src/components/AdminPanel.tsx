import React, { useState, useEffect } from "react";
import { Sparkles, FileText, Flag, AlertTriangle, PlusCircle, Check, Trash2, Edit3, X, RefreshCw, ExternalLink, Award } from "lucide-react";
import { Article, Report, VerificationRequest } from "../types.js";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  articles: Article[];
  onRefreshArticles: () => Promise<void>;
  token: string;
}

export default function AdminPanel({ articles, onRefreshArticles, token }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"extract" | "manage" | "reports" | "verifications">("extract");

  // Ingestion Ingest State
  const [ingestionUrl, setIngestionUrl] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestStep, setIngestStep] = useState("");
  const [extractedDraft, setExtractedDraft] = useState<Partial<Article> | null>(null);

  // Edit / Add Manual Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editArticleId, setEditArticleId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formCategory, setFormCategory] = useState("General Wellness");
  const [formTags, setFormTags] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSource, setFormSource] = useState("");
  const [formApproved, setFormApproved] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  // Verification requests states
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [declineReasonText, setDeclineReasonText] = useState<{ [id: string]: string }>({});
  const [showDeclineInput, setShowDeclineInput] = useState<{ [id: string]: boolean }>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchVerifications = async () => {
    setVerificationsLoading(true);
    try {
      const res = await fetch("/api/admin/verification/requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVerifications(data);
      }
    } catch (err) {
      console.error("Error loading verification requests:", err);
    } finally {
      setVerificationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "verifications") {
      fetchVerifications();
    }
  }, [activeSubTab]);

  const handleVerificationAction = async (id: string, action: "accept" | "decline") => {
    const reason = declineReasonText[id] || "";
    if (action === "decline" && !reason.trim()) {
      alert("Please provide a decline reason so the user knows why their request was rejected.");
      return;
    }

    setActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/verification/requests/${id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ action, reason })
      });

      if (res.ok) {
        alert(action === "accept" ? "Professional verified successfully! User role has been upgraded to Doctor." : "Application declined.");
        setDeclineReasonText(prev => {
          const u = { ...prev };
          delete u[id];
          return u;
        });
        setShowDeclineInput(prev => {
          const u = { ...prev };
          delete u[id];
          return u;
        });
        fetchVerifications();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update request.");
      }
    } catch (err) {
      alert("Error contacting verification endpoint.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleGenerateTags = async () => {
    if (!formTitle.trim()) {
      alert("Please enter a Title first so we can generate tags.");
      return;
    }
    setIsGeneratingTags(true);
    try {
      const res = await fetch("/api/admin/generate-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          summary: formSummary,
          category: formCategory,
          content: formContent
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tags && data.tags.length > 0) {
          setFormTags(data.tags.join(", "));
        } else {
          alert("No tags were returned by AI.");
        }
      } else {
        alert("AI Tag generation failed.");
      }
    } catch (err) {
      alert("Error communicating with AI tag generator.");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // Reports Queue State
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    if (activeSubTab === "reports") {
      fetchReports();
    }
  }, [activeSubTab]);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await fetch("/api/admin/reports", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    }
    setReportsLoading(false);
  };

  // AI Extraction Ingestion
  const handleIngestUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestionUrl.trim()) return;

    setIngestLoading(true);
    setExtractedDraft(null);
    setIngestStep("Analyzing URL structures...");

    const steps = [
      "Accessing reference body...",
      "Extracting critical clinical insights...",
      "Structuring categories and search tags...",
      "Synthesizing high-contrast educational markdown...",
      "Polishing final draft review layout..."
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setIngestStep(steps[currentStepIdx]);
        currentStepIdx++;
      }
    }, 1500);

    try {
      const res = await fetch("/api/admin/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ url: ingestionUrl })
      });

      clearInterval(interval);

      if (res.ok) {
        const data = await res.json();
        setExtractedDraft(data);
        
        // Populate edit form with the AI generated draft
        setFormTitle(data.title || "");
        setFormSummary(data.summary || "");
        setFormCategory(data.category || "General Wellness");
        setFormTags(data.tags ? data.tags.join(", ") : "");
        setFormContent(data.content || "");
        setFormSource(data.source || "");
        setFormApproved(true);
        setIsEditing(false); // Mode: Approving/Publishing AI Ingestion Draft
      } else {
        const errData = await res.json();
        alert(errData.error || "AI Ingestion failed. Please ensure your GEMINI_API_KEY is configured.");
      }
    } catch (err) {
      clearInterval(interval);
      alert("Error parsing URL via AI.");
    }
    setIngestLoading(false);
  };

  // Submit manual create, manual edit, or AI draft approval
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSummary.trim() || !formContent.trim()) {
      alert("Please fill in Title, Summary, and Content.");
      return;
    }

    setFormSubmitting(true);
    const tagsArray = formTags.split(",").map(t => t.trim().toLowerCase()).filter(t => t !== "");

    const payload = {
      title: formTitle,
      summary: formSummary,
      category: formCategory,
      tags: tagsArray,
      content: formContent,
      source: formSource || "Self-published",
      approved: formApproved
    };

    try {
      const url = editArticleId ? `/api/articles/${editArticleId}` : "/api/articles";
      const method = editArticleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await onRefreshArticles();
        alert(editArticleId ? "Article updated successfully!" : "Article published successfully!");
        
        // Reset state
        resetForm();
        setActiveSubTab("manage");
      } else {
        const err = await res.json();
        alert(err.error || "Error saving article.");
      }
    } catch (err) {
      alert("Failed to communicate with publication backend.");
    }
    setFormSubmitting(false);
  };

  const handleEditClick = (article: Article) => {
    setEditArticleId(article.id);
    setFormTitle(article.title);
    setFormSummary(article.summary);
    setFormCategory(article.category);
    setFormTags(article.tags.join(", "));
    setFormContent(article.content);
    setFormSource(article.source);
    setFormApproved(article.approved);
    setIsEditing(true);
    setExtractedDraft(null); // Clear any draft to avoid confusion
    setActiveSubTab("extract"); // Share extract form for editing
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you absolutely sure you want to delete this article? This is completely irreversible.")) return;

    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        await onRefreshArticles();
        alert("Article deleted successfully.");
      } else {
        alert("Delete failed.");
      }
    } catch (err) {
      alert("Error reaching server.");
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchReports();
        alert("Report marked as resolved.");
      }
    } catch (err) {
      alert("Error updating report.");
    }
  };

  const resetForm = () => {
    setEditArticleId(null);
    setExtractedDraft(null);
    setFormTitle("");
    setFormSummary("");
    setFormCategory("General Wellness");
    setFormTags("");
    setFormContent("");
    setFormSource("");
    setFormApproved(true);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-100 mb-6 pb-1">
        <button
          onClick={() => { setActiveSubTab("extract"); }}
          className={`flex-1 text-center py-2 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeSubTab === "extract"
              ? "text-medical-600 border-medical-500 scale-102"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          <Sparkles className="w-4 h-4" /> {editArticleId ? "Edit Article" : "AI Ingest Draft"}
        </button>
        <button
          onClick={() => { setActiveSubTab("manage"); }}
          className={`flex-1 text-center py-2 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeSubTab === "manage"
              ? "text-medical-600 border-medical-500 scale-102"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          <FileText className="w-4 h-4" /> Manage DB ({articles.length})
        </button>
        <button
          onClick={() => { setActiveSubTab("reports"); }}
          className={`flex-1 text-center py-2 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeSubTab === "reports"
              ? "text-medical-600 border-medical-500 scale-102"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          <Flag className="w-4 h-4" /> Flags/Reports
        </button>
        <button
          onClick={() => { setActiveSubTab("verifications"); }}
          className={`flex-1 text-center py-2 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeSubTab === "verifications"
              ? "text-medical-600 border-medical-500 scale-102"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          <Award className="w-4 h-4" /> Verifications
        </button>
      </div>

      {/* --- SUBTAB 1: EXTRACT & PUBLISH --- */}
      {activeSubTab === "extract" && (
        <div className="space-y-6">
          {!editArticleId && !extractedDraft && !isEditing && (
            <div className="space-y-4">
              <div className="bg-medical-50 border border-medical-100 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-medical-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-medical-600" />
                  AI URL Ingestion Engine
                </h4>
                <p className="text-xs text-medical-800 leading-relaxed mt-1">
                  Pasting clinical literature, medical guides, or journal URLs allows our proprietary PAEONIX AI Engine to automatically parse, summarize, extract medical keywords, categorize, and draft detailed, eye-safe structured educational articles.
                </p>
              </div>

              <form onSubmit={handleIngestUrl} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                    Reference URL link
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example-medical-site.com/article"
                    value={ingestionUrl}
                    onChange={(e) => setIngestionUrl(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={ingestLoading}
                    className="flex-1 bg-medical-600 hover:bg-medical-700 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" /> {ingestLoading ? "Ingesting..." : "AI Generate Draft"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsEditing(true);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl text-xs transition-colors"
                  >
                    Write Manually
                  </button>
                </div>
              </form>

              {ingestLoading && (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-medical-500 animate-spin mb-3" />
                  <p className="text-xs font-bold text-gray-700">{ingestStep}</p>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-normal">
                    This can take a few moments as PAEONIX AI processes and drafts clinical markdown content...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* EDITABLE DRAFT / CREATION FORM */}
          {(extractedDraft || isEditing || editArticleId) && (
            <form onSubmit={handleSaveArticle} className="space-y-4 border-t border-gray-50 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-medical-600 uppercase tracking-widest bg-medical-50 px-2.5 py-1 rounded">
                  {editArticleId ? "Reviewing manual edit" : extractedDraft ? "Reviewing AI Draft" : "New manual publication"}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-medical-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Short summary
                </label>
                <input
                  type="text"
                  required
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  >
                    <option value="Chronic Conditions">Chronic Conditions</option>
                    <option value="Cardiovascular Health">Cardiovascular Health</option>
                    <option value="General Wellness">General Wellness</option>
                    <option value="Infectious Diseases">Infectious Diseases</option>
                    <option value="Mental Health">Mental Health</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase">
                      Metadata tags (comma separated)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateTags}
                      disabled={isGeneratingTags}
                      className="text-[10px] text-medical-600 font-extrabold hover:text-medical-700 flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isGeneratingTags ? "Generating..." : "AI Auto Tags"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="diet, blood sugar, stress"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Source Reference
                </label>
                <input
                  type="text"
                  required
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 flex justify-between">
                  <span>Educational Content (Markdown format supported)</span>
                  <span className="text-[10px] text-gray-400 font-semibold lowercase">Supports ## Headings, lists, tables</span>
                </label>
                <textarea
                  required
                  rows={10}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-medical-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="formApproved"
                  checked={formApproved}
                  onChange={(e) => setFormApproved(e.target.checked)}
                  className="rounded border-gray-300 text-medical-600 focus:ring-medical-500 w-4 h-4"
                />
                <label htmlFor="formApproved" className="text-xs font-semibold text-gray-600 select-none">
                  Approve and publish directly to live platform database
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {formSubmitting ? "Publishing..." : editArticleId ? "Update Article" : "Approve and Publish"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* --- SUBTAB 2: DATABASE CRUD MANAGER --- */}
      {activeSubTab === "manage" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Knowledge base listings</span>
            <button
              onClick={() => {
                resetForm();
                setIsEditing(true);
                setActiveSubTab("extract");
              }}
              className="text-medical-600 hover:text-medical-700 text-xs font-bold flex items-center gap-1 focus:outline-none"
            >
              <PlusCircle className="w-4 h-4" /> Create manual article
            </button>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {articles.map((art) => (
              <div
                key={art.id}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-medical-100 text-medical-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                      {art.category}
                    </span>
                    {!art.approved && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-amber-200">
                        Draft
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 truncate mt-1">{art.title}</h4>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-[10px] text-gray-500">Source: {art.source}</p>
                    <p className="text-[10px] text-medical-600 font-mono font-bold flex items-center gap-1">
                      <span>URL:</span>
                      <a 
                        href={`/articles/${art.slug || art.title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "")}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-0.5 text-medical-600"
                      >
                        /articles/{art.slug || art.title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "")}
                        <ExternalLink className="w-2.5 h-2.5 inline-block shrink-0" />
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEditClick(art)}
                    className="p-1.5 text-gray-400 hover:text-medical-600 hover:bg-white rounded-lg transition-all focus:outline-none"
                    title="Edit article"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(art.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all focus:outline-none"
                    title="Delete article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: REPORTS MODERATION QUEUE --- */}
      {activeSubTab === "reports" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Moderation flags queue</span>
            <button
              onClick={fetchReports}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-all focus:outline-none"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {reportsLoading ? (
            <div className="text-center py-12 flex flex-col items-center">
              <RefreshCw className="w-6 h-6 text-medical-500 animate-spin mb-2" />
              <p className="text-xs text-gray-400">Loading reports from database...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-100 p-4">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-700">All content clear</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-0.5">
                No articles have been flagged. High trust standards maintained!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className={`border rounded-2xl p-4 flex flex-col justify-between gap-2.5 ${
                    rep.resolved
                      ? "bg-gray-50 border-gray-100 opacity-60"
                      : "bg-red-50/25 border-red-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-red-100 text-red-800 flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3" /> {rep.reason}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        {new Date(rep.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-extrabold text-gray-900 mt-2 truncate">
                      Article: {rep.articleTitle}
                    </h4>
                    
                    <p className="text-xs text-gray-600 bg-white border border-gray-100 p-2.5 rounded-xl mt-1.5 whitespace-pre-wrap leading-relaxed shadow-xs">
                      "{rep.details}"
                    </p>

                    <p className="text-[10px] text-gray-400 font-semibold mt-2 truncate">
                      Flagged by: {rep.userEmail}
                    </p>
                  </div>

                  {!rep.resolved ? (
                    <div className="flex gap-2 pt-1 border-t border-gray-100/50">
                      <button
                        onClick={() => handleResolveReport(rep.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Resolve Report
                      </button>
                      <button
                        onClick={() => {
                          const matchingArt = articles.find(a => a.id === rep.articleId);
                          if (matchingArt) {
                            handleEditClick(matchingArt);
                          } else {
                            alert("Article already deleted or not found.");
                          }
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold py-2 px-3 rounded-lg transition-colors"
                      >
                        Edit Piece
                      </button>
                      <button
                        onClick={async () => {
                          await handleDeleteClick(rep.articleId);
                          await handleResolveReport(rep.id);
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold py-2 px-3 rounded-lg transition-colors"
                      >
                        Delete Article
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
                      <Check className="w-3.5 h-3.5" /> Resolved & Moderated
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 4: MEDICAL VERIFICATIONS MANAGER --- */}
      {activeSubTab === "verifications" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Verification applications</span>
            <button
              onClick={fetchVerifications}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-all focus:outline-none"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {verificationsLoading ? (
            <div className="text-center py-12 flex flex-col items-center">
              <RefreshCw className="w-6 h-6 text-medical-500 animate-spin mb-2" />
              <p className="text-xs text-gray-400">Loading applications...</p>
            </div>
          ) : verifications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-100 p-4">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-700">No Pending Requests</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-0.5">
                All submitted doctor verification credentials have been fully processed.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {verifications.map((req) => (
                <div
                  key={req.id}
                  className={`border rounded-2xl p-4 flex flex-col gap-3.5 transition-all ${
                    req.status === "pending"
                      ? "bg-amber-50/15 border-amber-100"
                      : req.status === "accepted"
                      ? "bg-emerald-50/10 border-emerald-100 opacity-75"
                      : "bg-gray-50 border-gray-100 opacity-60"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Applicant Email
                      </span>
                      <span className="text-sm font-extrabold text-gray-800 break-all">{req.userEmail}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase border ${
                      req.status === "pending"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : req.status === "accepted"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="bg-white border border-gray-100/80 rounded-xl p-3 shadow-xs">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Submitted Licensing & Professional Info
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{req.info}</p>
                  </div>

                  {req.files && req.files.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                        Supporting Credentials ({req.files.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {req.files.map((file, fIdx) => (
                          <div key={fIdx} className="bg-gray-50 border border-gray-100/60 rounded-xl p-2.5 flex items-center justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-gray-800 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[9px] text-gray-400 truncate">{file.type}</p>
                            </div>
                            {file.dataUrl && (
                              <a
                                href={file.dataUrl}
                                download={file.name}
                                className="text-[10px] bg-white border border-gray-100 hover:bg-gray-50 text-medical-700 px-2 py-1 rounded font-bold transition-all shrink-0"
                              >
                                View/Get
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {req.status === "pending" && (
                    <div className="space-y-3 pt-2 border-t border-gray-100/50">
                      {showDeclineInput[req.id] && (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="block text-[10px] font-bold text-rose-700 uppercase">
                            Decline Reason / Cooldown Feedback
                          </label>
                          <textarea
                            required
                            rows={2}
                            placeholder="State why credentials were insufficient (e.g. License ID not found in state registry)."
                            value={declineReasonText[req.id] || ""}
                            onChange={(e) => setDeclineReasonText(prev => ({ ...prev, [req.id]: e.target.value }))}
                            className="w-full bg-white border border-rose-200 focus:ring-1 focus:ring-rose-500 rounded-xl p-2 text-xs text-gray-800 resize-none focus:outline-none"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        {showDeclineInput[req.id] ? (
                          <>
                            <button
                              disabled={actionInProgress === req.id}
                              onClick={() => setShowDeclineInput(prev => ({ ...prev, [req.id]: false }))}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold py-2 px-3 rounded-xl transition-colors"
                            >
                              Cancel Decline
                            </button>
                            <button
                              disabled={actionInProgress === req.id}
                              onClick={() => handleVerificationAction(req.id, "decline")}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-2 px-3 rounded-xl transition-colors shadow-sm"
                            >
                              Submit Decline
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              disabled={actionInProgress === req.id}
                              onClick={() => setShowDeclineInput(prev => ({ ...prev, [req.id]: true }))}
                              className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold py-2 px-3 rounded-xl transition-colors"
                            >
                              Decline Request
                            </button>
                            <button
                              disabled={actionInProgress === req.id}
                              onClick={() => handleVerificationAction(req.id, "accept")}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-2 px-3 rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Accept & Verify Doctor
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
