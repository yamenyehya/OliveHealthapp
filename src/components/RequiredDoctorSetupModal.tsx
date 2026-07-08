import React, { useState } from "react";
import { Stethoscope, Phone, Shield, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";

interface RequiredDoctorSetupModalProps {
  isOpen: boolean;
  token: string;
  onRefreshProfile: () => Promise<void>;
}

export default function RequiredDoctorSetupModal({ isOpen, token, onRefreshProfile }: RequiredDoctorSetupModalProps) {
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"whatsapp" | "sms">("whatsapp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(() => {
    try {
      return localStorage.getItem("paeonix_skipped_doctor_setup") === "true";
    } catch {
      return false;
    }
  });

  if (!isOpen || skipped) return null;

  const handleSkip = () => {
    try {
      localStorage.setItem("paeonix_skipped_doctor_setup", "true");
    } catch (e) {}
    setSkipped(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setError("Please enter a valid phone number.");
      return;
    }

    // Phone number pattern validator
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError("Please enter a valid phone number (7-20 digits).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorContactNum: cleanPhone,
          doctorContactMethod: method
        })
      });

      if (res.ok) {
        await onRefreshProfile();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to update doctor configuration.");
      }
    } catch (err) {
      setError("Unable to connect to security gateway. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        
        {/* Header Illustration */}
        <div className="bg-gradient-to-br from-medical-500 to-medical-600 text-white p-6 text-center relative">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full" />
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Primary Care Companion</h2>
          <p className="text-xs text-white/80 mt-1">Enhance your patient-to-doctor communication experience</p>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-medical-50/50 rounded-2xl p-4 border border-medical-100 flex items-start gap-2.5">
            <Shield className="w-5 h-5 text-medical-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-medical-800 leading-relaxed font-semibold">
              To enhance your <strong>user-to-doctor experience</strong>, you can register your primary care doctor's contact details. This allows the Paeonix Secure AI Assistant to synthesize clear, non-diagnostic symptom checklists ready to send in one tap.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Doctor's Contact Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                required
                disabled={loading}
                placeholder="e.g. +15551234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50/60 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Preferred Messaging Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setMethod("whatsapp")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all ${
                  method === "whatsapp"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold"
                    : "border-gray-100 hover:bg-gray-50 bg-white text-gray-500"
                }`}
              >
                <MessageSquare className="w-5 h-5 mb-1.5 text-emerald-600" />
                <span className="text-xs">WhatsApp</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setMethod("sms")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all ${
                  method === "sms"
                    ? "border-blue-500 bg-blue-50/50 text-blue-800 font-bold"
                    : "border-gray-100 hover:bg-gray-50 bg-white text-gray-500"
                }`}
              >
                <MessageSquare className="w-5 h-5 mb-1.5 text-blue-600" />
                <span className="text-xs">SMS / Message</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-medical-600 hover:bg-medical-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[1px]"
            >
              {loading ? (
                <span>Saving Secure Session...</span>
              ) : (
                <>
                  <span>Complete Patient Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all text-center border border-gray-100"
            >
              Add Later / Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
