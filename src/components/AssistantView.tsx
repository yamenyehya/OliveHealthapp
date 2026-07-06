import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, HelpCircle, Activity, Info, ChevronRight, AlertTriangle } from "lucide-react";
import { ChatMessage, Article } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "../localization.js";

interface AssistantViewProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onSelectArticle: (article: Article) => void;
  articles: Article[];
  isThinking: boolean;
  lang?: string;
}

export default function AssistantView({
  chatHistory,
  onSendMessage,
  onSelectArticle,
  articles,
  isThinking,
  lang = "en"
}: AssistantViewProps) {
  const { t } = useTranslation(lang);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isThinking]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const sampleQuestions = [
    "What are the warning signs of type 2 diabetes?",
    "How does physical activity help reduce high blood pressure?",
    "What is sleep hygiene and how does blue light affect melatonin?",
    "How can I tell the difference between a cold and influenza?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pb-16 bg-gray-50 animate-fade-in">
      {/* Assistant Header banner */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-medical-500 text-white p-1.5 rounded-lg shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">{t("chatHeader")}</h1>
            <p className="text-[10px] text-gray-400 font-semibold">{t("chatSub")}</p>
          </div>
        </div>
      </div>

      {/* Safety Disclaimer Warning */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-start gap-2 text-amber-800 shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[10px] leading-relaxed font-semibold">
          {t("chatDisclaimer")}
        </p>
      </div>

      {/* Message List area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
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
            {chatHistory.map((msg) => {
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
                    <div className="whitespace-pre-wrap">{msg.text}</div>

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
