import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ChevronRight, Activity, AlertTriangle, FileText, Check, MessageSquare, Phone, ArrowRight, X, Trash2, Plus, History } from "lucide-react";
import { ChatMessage, Article, User } from "../types.js";
import { useTranslation } from "../localization.js";

// Helper function to render text formatted with **bold** and *italics*
const renderFormattedText = (text: string) => {
  if (!text) return null;
  // Split by ** to support bold text
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-extrabold text-medical-950">
          {part}
        </strong>
      );
    }
    // Handle single * for italics
    const subParts = part.split(/\*([^*]+)\*/g);
    return subParts.map((subPart, subIndex) => {
      if (subIndex % 2 === 1) {
        return (
          <em key={`${index}-${subIndex}`} className="italic font-medium">
            {subPart}
          </em>
        );
      }
      return subPart;
    });
  });
};

interface AssistantViewProps {
  user: User | null;
  chatHistory: ChatMessage[];
  onSendMessage: (text: string, threadId?: string, threadTitle?: string) => Promise<void>;
  onClearChat?: (threadId?: string) => Promise<void>;
  onSelectArticle: (article: Article) => void;
  articles: Article[];
  isThinking: boolean;
  lang?: string;
}

export default function AssistantView({
  user,
  chatHistory,
  onSendMessage,
  onClearChat,
  onSelectArticle,
  articles,
  isThinking,
  lang = "en"
}: AssistantViewProps) {
  const { t } = useTranslation(lang);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Thread and History States
  const [currentThreadId, setCurrentThreadId] = useState<string>(() => {
    return localStorage.getItem("active_chat_thread_id") || "default";
  });
  const [showHistory, setShowHistory] = useState(false);

  // Doctor Summary States
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [doctorSummary, setDoctorSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter messages for current thread
  const currentThreadMessages = chatHistory.filter(
    (msg) => (msg.threadId || "default") === currentThreadId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentThreadMessages.length, isThinking]);

  const changeThread = (id: string) => {
    setCurrentThreadId(id);
    localStorage.setItem("active_chat_thread_id", id);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;

    const isFirstMsg = currentThreadMessages.length === 0;
    const threadTitle = isFirstMsg 
      ? (inputText.trim().slice(0, 35) + (inputText.trim().length > 35 ? "..." : "")) 
      : undefined;

    onSendMessage(inputText.trim(), currentThreadId, threadTitle);
    setInputText("");
  };

  const handleNewChat = () => {
    const newId = `thread-${Date.now()}`;
    changeThread(newId);
    setInputText("");
    setShowHistory(false);
  };

  const handleGenerateSummary = async () => {
    if (currentThreadMessages.length === 0) return;
    setGeneratingSummary(true);
    setSummaryError(null);
    setDoctorSummary(null);
    setShowSummaryPanel(true);

    try {
      const res = await fetch("/api/ai/summarize-for-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          history: currentThreadMessages,
          language: lang
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDoctorSummary(data.summaryMessage);
      } else {
        const err = await res.json();
        setSummaryError(err.error || "Failed to generate summary.");
      }
    } catch (err) {
      setSummaryError("Could not reach communication gateway. Please try again.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!doctorSummary) return;
    try {
      await navigator.clipboard.writeText(doctorSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  // Group threads
  const getThreadList = () => {
    const threadsMap: Record<string, { id: string; title: string; lastActivity: string; msgCount: number }> = {};
    
    const hasDefaultMessages = chatHistory.some(m => !m.threadId || m.threadId === "default");
    if (hasDefaultMessages || currentThreadId === "default") {
      threadsMap["default"] = {
        id: "default",
        title: "General Inquiries",
        lastActivity: new Date(0).toISOString(),
        msgCount: 0
      };
    }

    chatHistory.forEach((msg) => {
      const tId = msg.threadId || "default";
      if (!threadsMap[tId]) {
        threadsMap[tId] = {
          id: tId,
          title: "New Chat",
          lastActivity: msg.createdAt,
          msgCount: 0
        };
      }
      
      threadsMap[tId].msgCount += 1;
      if (new Date(msg.createdAt) > new Date(threadsMap[tId].lastActivity)) {
        threadsMap[tId].lastActivity = msg.createdAt;
      }

      if (msg.sender === "user" && (threadsMap[tId].title === "New Chat" || threadsMap[tId].title === "General Inquiries")) {
        threadsMap[tId].title = msg.text.slice(0, 35) + (msg.text.length > 35 ? "..." : "");
      }
    });

    if (currentThreadId && !threadsMap[currentThreadId]) {
      threadsMap[currentThreadId] = {
        id: currentThreadId,
        title: "New Chat",
        lastActivity: new Date().toISOString(),
        msgCount: 0
      };
    }

    return Object.values(threadsMap).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  };

  // Contact parameters
  const docNum = user?.settings?.doctorContactNum || "";
  const docMethod = user?.settings?.doctorContactMethod || "whatsapp";
  const cleanPhone = docNum.replace(/[^\d]/g, "");

  const handleContactDoctor = () => {
    if (!doctorSummary) return;
    
    // Check if number was configured
    if (!cleanPhone) {
      alert("Please configure your doctor's contact number first in your profile settings!");
      return;
    }

    if (docMethod === "whatsapp") {
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(doctorSummary)}`;
      window.open(waUrl, "_blank");
    } else {
      const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(doctorSummary)}`;
      window.open(smsUrl, "_blank");
    }
  };

  const sampleQuestions = [
    "What are the warning signs of type 2 diabetes?",
    "How does physical activity help reduce high blood pressure?",
    "What is sleep hygiene and how does blue light affect melatonin?",
    "How can I tell the difference between a cold and influenza?"
  ];

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col bg-gray-50 pb-20 md:pb-6 animate-fade-in relative">
      
      {/* Assistant Header banner */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-medical-500 text-white p-1.5 rounded-lg shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">{t("chatHeader")}</h1>
            <p className="text-[10px] text-gray-400 font-semibold">
              {currentThreadId === "default" ? t("chatSub") : "Active Chat Session"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chat History Button */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 hover:text-medical-800 hover:bg-medical-50 active:bg-medical-100 rounded-lg border border-gray-200 hover:border-medical-200 transition-all font-bold select-none cursor-pointer"
            id="history-chat-btn"
            title="View Chat History"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-medical-600 hover:bg-medical-700 active:scale-95 text-white rounded-lg transition-all font-bold select-none cursor-pointer shadow-sm"
            id="new-chat-btn"
            title="Start New Chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Safety Disclaimer Warning */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-start gap-2 text-amber-800 shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[10px] leading-relaxed font-semibold">
          {t("chatDisclaimer")}
        </p>
      </div>

      {/* Chat History Sidebar Overlay */}
      {showHistory && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-30 flex justify-start">
          <div className="w-80 max-w-[85%] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right relative">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-medical-600" />
                <h3 className="text-sm font-bold text-gray-950">Chat History</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {getThreadList().map((thread) => {
                const isActive = thread.id === currentThreadId;
                return (
                  <div
                    key={thread.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isActive
                        ? "bg-medical-50/75 border-medical-200 text-medical-900 shadow-sm"
                        : "bg-white hover:bg-gray-50 border-gray-100 text-gray-700"
                    }`}
                  >
                    <button
                      onClick={() => {
                        changeThread(thread.id);
                        setShowHistory(false);
                      }}
                      className="flex-1 text-left min-w-0 font-semibold text-xs focus:outline-none cursor-pointer"
                    >
                      <p className="truncate">{thread.title}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {thread.msgCount} {thread.msgCount === 1 ? "message" : "messages"}
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this chat session?")) {
                          if (onClearChat) {
                            onClearChat(thread.id);
                          }
                          if (thread.id === currentThreadId) {
                            changeThread("default");
                          }
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer shrink-0 ml-1"
                      title="Delete chat session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleNewChat}
                className="w-full py-2.5 px-4 bg-medical-600 hover:bg-medical-700 active:scale-98 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Chat</span>
              </button>
            </div>
          </div>
          {/* Backdrop click to close */}
          <div className="flex-1 h-full cursor-pointer" onClick={() => setShowHistory(false)} />
        </div>
      )}

      {/* Message List area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentThreadMessages.length === 0 ? (
          <div className="text-center py-8 space-y-6 max-w-sm mx-auto">
            <div className="bg-medical-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-medical-600">
              <Activity className="w-8 h-8 animate-pulse-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">{t("chatHeader")}</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {t("chatSub")}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left pl-1">Suggested inquiries</p>
              {sampleQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInputText(q)}
                  className="w-full text-left bg-white hover:bg-medical-50 border border-gray-100 hover:border-medical-100 rounded-2xl p-3 text-xs text-gray-600 hover:text-medical-800 transition-all shadow-sm focus:outline-none flex items-center justify-between"
                >
                  <span className="line-clamp-2">{q}</span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            


            {currentThreadMessages.map((msg) => {
              const isAssistant = msg.sender === "assistant";
              return (
                <div key={msg.id} className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isAssistant
                        ? "bg-white text-gray-800 border border-gray-100 shadow-sm"
                        : "bg-medical-600 text-white shadow-md"
                    }`}
                  >
                    {/* Render message body */}
                    <div className="whitespace-pre-wrap">{renderFormattedText(msg.text)}</div>

                    {/* Interactive matched article cards, if suggested by AI model */}
                    {isAssistant && msg.suggestedArticles && msg.suggestedArticles.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-medical-600 uppercase tracking-wider">
                          <Activity className="w-3.5 h-3.5" /> Recommended verified references:
                        </div>
                        {msg.suggestedArticles.map((sug) => {
                          const fullArticle = articles.find((a) => a.id === sug.id);
                          return (
                            <button
                              key={sug.id}
                              onClick={() => fullArticle && onSelectArticle(fullArticle)}
                              className="w-full bg-medical-50 hover:bg-medical-100/75 border border-medical-100 rounded-xl p-2.5 text-left transition-all focus:outline-none flex items-start justify-between gap-1"
                            >
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-medical-950 truncate">{sug.title}</h4>
                                <p className="text-[10px] text-medical-700 truncate mt-0.5">{sug.summary}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-medical-500 mt-1 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex flex-col items-start">
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-bounce" />
                </div>
                <span className="text-[9px] text-gray-400 mt-1 px-1">AI Inquiring knowledge base...</span>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* DOCTOR CLINICAL SUMMARY FLOATING DIALOG */}
      {showSummaryPanel && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-20 flex items-end justify-center p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-medical-600" />
                <h3 className="text-sm font-bold text-gray-900">Your Structured Clinical Summary</h3>
              </div>
              <button
                onClick={() => setShowSummaryPanel(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex items-start gap-2 text-[10px] text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">
                This message was structured based on your conversation. It describes symptoms, concerns, and timeline. It does not provide any diagnosis or medical conclusion.
              </p>
            </div>

            {generatingSummary ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-medical-500" />
                <p className="text-xs text-gray-500">Formulating professional summary message...</p>
              </div>
            ) : summaryError ? (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs text-center">
                {summaryError}
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={doctorSummary || ""}
                  onChange={(e) => setDoctorSummary(e.target.value)}
                  className="w-full h-44 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-medical-500 leading-relaxed font-sans"
                />

                <div className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {docMethod === "whatsapp" ? (
                      <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Contact Target</p>
                      <p className="text-xs font-bold text-gray-700 truncate">
                        {docNum ? `${docNum} (${docMethod.toUpperCase()})` : "No primary care doctor registered"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyToClipboard}
                    className="text-[10px] font-bold text-medical-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 shadow-sm transition-all whitespace-nowrap"
                  >
                    {copied ? "Copied!" : "Copy Text"}
                  </button>
                </div>

                <button
                  onClick={handleContactDoctor}
                  disabled={!docNum}
                  className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs text-white transition-all flex items-center justify-center gap-2 shadow-md ${
                    !docNum 
                      ? "bg-gray-300 cursor-not-allowed shadow-none" 
                      : docMethod === "whatsapp"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <span>Send to Primary Care Doctor via {docMethod === "whatsapp" ? "WhatsApp" : "SMS"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                {!docNum && (
                  <p className="text-[9px] text-center font-bold text-rose-500 uppercase tracking-wide">
                    ⚠️ Setup Required: Please add your doctor's contact number in Settings first.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Form footer bar */}
      <form onSubmit={handleSend} className="bg-white border-t border-gray-100 p-3 shrink-0 flex flex-col gap-2">
        <div className="flex items-center gap-2 w-full">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isThinking ? "Thinking..." : t("chatPlaceholder")}
            disabled={isThinking}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl py-2.5 px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all disabled:opacity-50"
          />
          {chatHistory.length > 0 && (
            <button
              type="button"
              onClick={handleGenerateSummary}
              title="Summarize conversation for doctor"
              className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-2xl transition-all shadow-md active:scale-95 focus:outline-none shrink-0 flex items-center gap-1 text-xs font-extrabold"
            >
              <FileText className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Summarize</span>
            </button>
          )}
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="bg-medical-600 hover:bg-medical-700 text-white p-2.5 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:scale-100 focus:outline-none shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest pt-0.5 select-none">
          Medical AI System designed & powered by{" "}
          <a
            href="https://nuxweb.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-medical-600 hover:text-medical-700 hover:underline transition-all font-extrabold"
          >
            NuxWeb Agency
          </a>
        </div>
      </form>
    </div>
  );
}
