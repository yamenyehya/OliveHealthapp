import React, { useState } from "react";
import { Award, Send, Sparkles, AlertCircle, CheckCircle, FileText, Link, HelpCircle } from "lucide-react";
import { Article } from "../types.js";

interface DoctorHubViewProps {
  user: any;
  articles: Article[];
  token: string;
  onRefreshArticles: () => void;
}

export default function DoctorHubView({ user, articles, token, onRefreshArticles }: DoctorHubViewProps) {
  const [doctorTab, setDoctorTab] = useState<"add" | "edit">("add");
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorSuccess, setDoctorSuccess] = useState<string | null>(null);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  // Ingestion States
  const [ingestionUrl, setIngestionUrl] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestStep, setIngestStep] = useState("");

  // Article Draft States
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftCategory, setDraftCategory] = useState("General Wellness");
  const [draftTags, setDraftTags] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftSource, setDraftSource] = useState("");

  // Edit Recommendation States
  const [editArticleId, setEditArticleId] = useState("");
  const [editDetails, setEditDetails] = useState("");

  const handleIngestUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestionUrl.trim()) return;

    setIngestLoading(true);
    setDoctorError(null);
    setDoctorSuccess(null);
    setIngestStep("Analyzing URL structures...");

    const steps = [
      "Accessing medical reference body...",
      "Extracting peer-reviewed clinical evidence...",
      "Synthesizing high-contrast educational markdown...",
      "Polishing draft guidelines and layout..."
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setIngestStep(steps[currentStepIdx]);
        currentStepIdx++;
      }
    }, 1200);

    try {
      const res = await fetch("/api/doctor/extract", {
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
        setDraftTitle(data.title || "");
        setDraftSummary(data.summary || "");
        setDraftCategory(data.category || "General Wellness");
        setDraftTags(data.tags ? data.tags.join(", ") : "");
        setDraftContent(data.content || "");
        setDraftSource(data.source || ingestionUrl);
        setDoctorSuccess("AI ingestion complete! Review the loaded draft fields below, adjust if needed, and submit.");
        setIngestionUrl("");
      } else {
        const errData = await res.json();
        setDoctorError(errData.error || "AI Ingestion failed. Please ensure your GEMINI_API_KEY is configured.");
      }
    } catch (err) {
      clearInterval(interval);
      setDoctorError("Error parsing URL via AI clinical gateways.");
    } finally {
      setIngestLoading(false);
    }
  };

  const handleSubmitDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim() || !draftContent.trim()) {
      setDoctorError("Title and content are required.");
      return;
    }

    setDoctorLoading(true);
    setDoctorError(null);
    setDoctorSuccess(null);

    try {
      const tagsArray = draftTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

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
          tags: tagsArray,
          content: draftContent,
          source: draftSource || `Verified Doctor (${user?.email})`
        })
      });

      if (res.ok) {
        setDoctorSuccess("Draft submitted successfully! An administrator has been notified to review and publish it.");
        setDraftTitle("");
        setDraftSummary("");
        setDraftCategory("General Wellness");
        setDraftTags("");
        setDraftContent("");
        setDraftSource("");
        onRefreshArticles();
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
    if (!editArticleId || !editDetails.trim()) {
      setDoctorError("Please select an article to suggest edits.");
      return;
    }

    setDoctorLoading(true);
    setDoctorError(null);
    setDoctorSuccess(null);

    const targetArticle = articles.find((a) => a.id === editArticleId);

    try {
      const res = await fetch("/api/doctor/edit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          articleId: editArticleId,
          articleTitle: targetArticle ? targetArticle.title : "Unknown Article",
          details: editDetails
        })
      });

      if (res.ok) {
        setDoctorSuccess("Edit request submitted successfully! An administrator will review and apply the updates.");
        setEditArticleId("");
        setEditDetails("");
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

  return (
    <div className="px-4 py-6 pb-24 space-y-6 animate-fade-in max-w-4xl mx-auto" id="doctor-hub-view">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-emerald-100 text-emerald-800 p-1.5 rounded-xl">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-xl font-black text-gray-950">Doctors Clinical Hub</h1>
          </div>
          <p className="text-xs text-gray-400">
            Publish educational articles, suggest peer-reviewed corrections, and utilize AI ingestion pipelines.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => { setDoctorTab("add"); setDoctorError(null); setDoctorSuccess(null); }}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none text-center ${
              doctorTab === "add" ? "bg-white text-emerald-950 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Submit Draft
          </button>
          <button
            onClick={() => { setDoctorTab("edit"); setDoctorError(null); setDoctorSuccess(null); }}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none text-center ${
              doctorTab === "edit" ? "bg-white text-emerald-950 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Suggest Revisions
          </button>
        </div>
      </div>

      {/* Message banners */}
      {doctorError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-3.5 py-3 rounded-2xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="font-semibold">{doctorError}</span>
        </div>
      )}
      {doctorSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-3.5 py-3 rounded-2xl flex items-start gap-2.5 animate-pulse-once">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span className="font-semibold">{doctorSuccess}</span>
        </div>
      )}

      {doctorTab === "add" ? (
        <div className="space-y-6">
          {/* AI URL INGESTION SECTION */}
          <div className="bg-gradient-to-tr from-emerald-50/50 to-teal-50/20 border border-emerald-100/50 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <h2 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wider">
                Clinical AI URL Ingestion Engine
              </h2>
            </div>
            <p className="text-xs text-emerald-900/70 leading-relaxed">
              Paste standard medical literature, WHO journals, health articles, or research links. Our Clinical AI engine will automatically parse, summarize, extract keywords, and compose a drafted, educational template in markdown below.
            </p>

            <form onSubmit={handleIngestUrl} className="flex gap-2.5">
              <div className="relative flex-1">
                <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  required
                  placeholder="https://example-medical-journal.org/clinical-study"
                  value={ingestionUrl}
                  disabled={ingestLoading}
                  onChange={(e) => setIngestionUrl(e.target.value)}
                  className="w-full bg-white border border-gray-100 pl-10 pr-4 py-2.5 text-xs rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-2xs"
                />
              </div>
              <button
                type="submit"
                disabled={ingestLoading || !ingestionUrl.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {ingestLoading ? "Ingesting..." : "Ingest URL"}
              </button>
            </form>

            {ingestLoading && (
              <div className="flex items-center gap-2.5 bg-white border border-emerald-100 p-3.5 rounded-2xl text-[11px] text-emerald-900 font-bold shadow-2xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>AI Ingestion: {ingestStep}</span>
              </div>
            )}
          </div>

          {/* DRAFT FORM */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-400" /> Article Metadata & Content Guidelines
            </h3>

            <form onSubmit={handleSubmitDraft} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Understanding Atrial Fibrillation: Causes and Management"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">
                  Brief Summary statement
                </label>
                <input
                  type="text"
                  required
                  placeholder="A concise, 1-2 sentence overview for the list catalog."
                  value={draftSummary}
                  onChange={(e) => setDraftSummary(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">
                    Therapeutic Category
                  </label>
                  <select
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Chronic Conditions">Chronic Conditions</option>
                    <option value="Cardiovascular Health">Cardiovascular Health</option>
                    <option value="General Wellness">General Wellness</option>
                    <option value="Infectious Diseases">Infectious Diseases</option>
                    <option value="Mental Health">Mental Health</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">
                    Keywords / tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., heart, arrhythmia, stroke risk, anticoagulation"
                    value={draftTags}
                    onChange={(e) => setDraftTags(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">
                  Long-form Content (Markdown syntax supported)
                </label>
                <textarea
                  required
                  rows={10}
                  placeholder="## Clinical Presentation&#10;Describe typical symptoms here...&#10;&#10;### Interventions&#10;List peer-reviewed guidance points..."
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono resize-y min-h-[200px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">
                  Medical Source Citation or URL
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mayo Clinic, New England Journal of Medicine, or World Health Organization"
                  value={draftSource}
                  onChange={(e) => setDraftSource(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={doctorLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                {doctorLoading ? "Submitting draft to administrator..." : "Submit Draft for Admin Verification"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* SUGGEST REVISION FORM */
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Submit peer-review recommendation
            </h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Flag an existing published guide to correct clinical data, append new findings, or point out updated references. Admins will review your recommendation and apply changes.
          </p>

          <form onSubmit={handleSubmitEditRequest} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">
                Select target Published Article
              </label>
              <select
                required
                value={editArticleId}
                onChange={(e) => setEditArticleId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Choose published guide...</option>
                {articles
                  .filter((a) => a.approved)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.category}] {a.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase">
                Revision guidelines and evidence
              </label>
              <textarea
                required
                rows={6}
                placeholder="Detail the clinical facts to modify, citing clinical literature, current guidelines, or studies..."
                value={editDetails}
                onChange={(e) => setEditDetails(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-3.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={doctorLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {doctorLoading ? "Submitting revision report..." : "Submit Revision Request"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
