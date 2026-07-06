import React from "react";
import { ShieldAlert } from "lucide-react";
import AdminPanel from "./AdminPanel.js";
import { Article } from "../types.js";

interface AdminHubViewProps {
  articles: Article[];
  onRefreshArticles: () => Promise<void>;
  token: string;
}

export default function AdminHubView({ articles, onRefreshArticles, token }: AdminHubViewProps) {
  return (
    <div className="px-4 py-6 pb-24 space-y-6 animate-fade-in max-w-7xl mx-auto" id="admin-hub-view">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-5">
        <div className="bg-medical-100 text-medical-800 p-1.5 rounded-xl">
          <ShieldAlert className="w-5 h-5 text-medical-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-950">Administrator Moderation Hub</h1>
          <p className="text-xs text-gray-400">
            Verify doctor medical credentials, review/publish draft suggestions, and manage user reports.
          </p>
        </div>
      </div>

      <AdminPanel articles={articles} onRefreshArticles={onRefreshArticles} token={token} />
    </div>
  );
}
