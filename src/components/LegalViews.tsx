import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Cookie, FileText, X, Check, Lock, Info } from "lucide-react";

interface CookieBannerProps {
  onAccept: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onAccept }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check cookie consent
    const consent = localStorage.getItem("paeonix_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("paeonix_cookie_consent", "accepted");
    setVisible(false);
    onAccept();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md bg-white border border-gray-100 rounded-3xl p-5 shadow-2xl shadow-medical-900/10 z-50 flex flex-col gap-4"
          id="cookie-consent-banner"
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-medical-50 text-medical-600 rounded-xl flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                Cookie & Privacy Consent
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                PAEONIX uses cookies and local persistence to optimize secure authentication, preserve search preferences, and analyze platform traffic. No medical histories are sold or shared.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-102 active:scale-98"
            >
              Accept All Cookies
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "privacy" | "cookies";
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = "privacy",
}) => {
  const [activeTab, setActiveTab] = useState<"privacy" | "cookies">(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-950/45 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative bg-white border border-gray-100 rounded-3xl w-full max-w-2xl h-[85vh] md:h-[75vh] flex flex-col shadow-2xl overflow-hidden z-10"
            id="legal-views-modal"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-medical-500 text-white rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
                    Compliance & Legal Portal
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Evidence-Based Clinical Trust & Security Guidelines
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="px-6 py-2.5 border-b border-gray-100 flex gap-2">
              <button
                onClick={() => setActiveTab("privacy")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "privacy"
                    ? "bg-medical-50 text-medical-700"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Privacy Policy
              </button>
              <button
                onClick={() => setActiveTab("cookies")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "cookies"
                    ? "bg-medical-50 text-medical-700"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Cookie className="w-3.5 h-3.5" />
                Cookies Usage
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-xs text-gray-600 leading-relaxed custom-scrollbar">
              {activeTab === "privacy" ? (
                <>
                  <div className="bg-medical-50/50 border border-medical-100/50 rounded-2xl p-4 flex gap-3">
                    <Lock className="w-5 h-5 text-medical-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-medical-950 text-xs">HIPAA & Clinical Confidentiality Promise</h4>
                      <p className="text-[11px] text-medical-800 mt-1">
                        PAEONIX is built upon peer-reviewed medical scholarship. We employ state-of-the-art encryption algorithms (AES-256 for data-at-rest and TLS 1.3 for data-in-transit) to ensure your health research history remains private and fully secure. We never monetize patient or clinician searches.
                      </p>
                    </div>
                  </div>

                  <section className="space-y-2">
                    <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide">1. Information We Collect</h4>
                    <p>
                      We strictly limit data acquisition to variables required to provide reliable clinical reference lookup, secure identity assertion, and system optimization:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-1 text-[11px]">
                      <li><strong className="text-gray-700">Account Credentials:</strong> Email, cryptographically hashed passwords, and verified professional certificates.</li>
                      <li><strong className="text-gray-700">Clinical Reading History:</strong> An optional log of visited health encyclopedia logs to help clinicians track continuous medical education research.</li>
                      <li><strong className="text-gray-700">Search Context Logs:</strong> Query terms are mapped anonymously to match against database indexes and prevent malignant load distribution.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide">2. How We Store and Protect Your Data</h4>
                    <p>
                      All database queries are orchestrated online against a high-availability MongoDB Atlas cluster. No clinical telemetry or search logs are stored inside loose browser caches longer than necessary. In compliance with data sovereignty regulations:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-1 text-[11px]">
                      <li>Your information is processed in sandbox zones with zero open external endpoints.</li>
                      <li>You have the permanent right to purge your search history or completely delete your account online via the Profile settings.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide">3. Content & Diagnostic Disclaimer</h4>
                    <p className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 text-rose-950 text-[11px] font-medium">
                      <strong>IMPORTANT MEDICAL NOTICE:</strong> The clinical encyclopedia, peer-reviewed indices, and artificial intelligence diagnostic assists hosted on PAEONIX are designed strictly as informational reference companion systems for physicians, registered nurses, and academic researchers. They do not constitute diagnostic medical advice, clinical treatment directives, or doctor-patient relationships.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <div className="bg-amber-50/40 border border-amber-100/40 rounded-2xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-950 text-xs">How PAEONIX Employs Cookies</h4>
                      <p className="text-[11px] text-amber-800 mt-1">
                        We use non-invasive cookie files to maintain login tokens, preserve site language settings, and secure API callback headers against Cross-Site Request Forgery (CSRF).
                      </p>
                    </div>
                  </div>

                  <section className="space-y-2.5">
                    <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide">Essential Core Cookies</h4>
                    <p>
                      These cookies are functionally required to allow account sessions, route state tracking, and platform security operations. They cannot be disabled:
                    </p>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden mt-2">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <th className="p-3">Cookie Name</th>
                            <th className="p-3">Primary Purpose</th>
                            <th className="p-3">Expiration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-500">
                          <tr>
                            <td className="p-3 font-mono font-bold text-gray-700">health_platform_token</td>
                            <td className="p-3">Maintains secure authorization JWT for your profile session.</td>
                            <td className="p-3">7 Days</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold text-gray-700">paeonix_cookie_consent</td>
                            <td className="p-3">Remembers cookie preference selections.</td>
                            <td className="p-3">1 Year</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide">Third-Party Analytics</h4>
                    <p>
                      We run anonymized performance monitors that track document retrieval speeds. No marketing trackers, advertising cookies, or behavioral targeting tools are integrated.
                    </p>
                  </section>
                </>
              )}
            </div>

            {/* Footer Action */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-medium">
                Last Updated: July 2026
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-medical-600 hover:bg-medical-700 text-white font-bold rounded-xl text-xs transition-all hover:scale-102 active:scale-98 shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Understood & Agree
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
