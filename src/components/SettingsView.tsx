import React, { useState } from "react";
import { 
  Settings, User, Lock, Globe, LogOut, Check, Palette, 
  Bell, HelpCircle, ShieldAlert, Award, ChevronRight, Activity,
  Upload, Trash2, ShieldCheck, CheckCircle2, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "../localization.js";
import { User as UserType } from "../types.js";

interface SettingsViewProps {
  user: UserType | null;
  onLogout: () => void;
  token: string;
  onRefreshProfile: () => Promise<void>;
}

const LANGUAGES = [
  { code: "en", label: "English (US)" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" }
];

const THEMES = [
  { id: "botanical", label: "Ancient Botanical", color: "bg-[#8CA18B]" },
  { id: "terracotta", label: "Mediterranean Terracotta", color: "bg-[#D09E88]" },
  { id: "radiance", label: "Clinical Radiance", color: "bg-[#8FB9A8]" },
  { id: "phoenix", label: "The Mythic Phoenix", color: "bg-[#E8A79B]" }
];

export default function SettingsView({ user, onLogout, token, onRefreshProfile }: SettingsViewProps) {
  const [selectedLang, setSelectedLang] = useState(user?.settings?.language || "en");
  const { t } = useTranslation(selectedLang);
  const [selectedTheme, setSelectedTheme] = useState(user?.settings?.theme || "botanical");
  const [notifications, setNotifications] = useState(user?.settings?.notifications !== false);

  // Doctor profile fields
  const [specialty, setSpecialty] = useState(user?.doctorProfile?.specialty || "general practice");
  const [profilePic, setProfilePic] = useState(user?.doctorProfile?.profilePicture || "");
  const [docPhone, setDocPhone] = useState(user?.doctorProfile?.phone || "");
  const [docEmail, setDocEmail] = useState(user?.doctorProfile?.email || "");
  const [docInsta, setDocInsta] = useState(user?.doctorProfile?.instagram || "");
  const [docTiktok, setDocTiktok] = useState(user?.doctorProfile?.tiktok || "");
  const [docFb, setDocFb] = useState(user?.doctorProfile?.facebook || "");
  const [docMaps, setDocMaps] = useState(user?.doctorProfile?.clinicLocationUrl || "");

  const [doctorProfileLoading, setDoctorProfileLoading] = useState(false);
  const [doctorProfileError, setDoctorProfileError] = useState<string | null>(null);
  const [doctorProfileSuccess, setDoctorProfileSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (user?.settings?.language) {
      setSelectedLang(user.settings.language);
    }
    if (user?.settings?.theme) {
      setSelectedTheme(user.settings.theme);
    }
    if (user?.settings?.notifications !== undefined) {
      setNotifications(user.settings.notifications !== false);
    }
    if (user?.doctorProfile) {
      setSpecialty(user.doctorProfile.specialty || "general practice");
      setProfilePic(user.doctorProfile.profilePicture || "");
      setDocPhone(user.doctorProfile.phone || "");
      setDocEmail(user.doctorProfile.email || "");
      setDocInsta(user.doctorProfile.instagram || "");
      setDocTiktok(user.doctorProfile.tiktok || "");
      setDocFb(user.doctorProfile.facebook || "");
      setDocMaps(user.doctorProfile.clinicLocationUrl || "");
    }
  }, [user]);

  const compressImage = (dataUrl: string, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
    });
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Src = reader.result as string;
      const compressed = await compressImage(base64Src, 240, 240, 0.75);
      setProfilePic(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDoctorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorProfileError(null);
    setDoctorProfileSuccess(null);

    const VALID_SPECIALTIES = [
      "cardiology", "neurology", "pediatrics", "dermatology", "surgery", "psychiatry",
      "internal medicine", "family medicine", "gynecology", "orthopedics", "oncology",
      "ophthalmology", "otolaryngology", "urology", "endocrinology", "gastroenterology", "radiology", "anesthesiology", "general practice"
    ];
    if (!VALID_SPECIALTIES.includes(specialty)) {
      setDoctorProfileError("Please select a valid specialty.");
      return;
    }

    if (docPhone) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(docPhone)) {
        setDoctorProfileError("Invalid phone number. Use 7-20 characters: numbers, spaces, hyphens, parentheses.");
        return;
      }
    }

    if (docEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(docEmail)) {
        setDoctorProfileError("Please enter a valid public email address.");
        return;
      }
    }

    if (docInsta) {
      const instaRegex = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+\/?$/;
      if (!instaRegex.test(docInsta)) {
        setDoctorProfileError("Invalid Instagram URL. Must match: https://instagram.com/username");
        return;
      }
    }

    if (docTiktok) {
      const tiktokRegex = /^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.-]+\/?$/;
      if (!tiktokRegex.test(docTiktok)) {
        setDoctorProfileError("Invalid TikTok URL. Must match: https://tiktok.com/@username");
        return;
      }
    }

    if (docFb) {
      const fbRegex = /^https:\/\/(www\.)?facebook\.com\/[A-Za-z0-9.]+\/?$/;
      if (!fbRegex.test(docFb)) {
        setDoctorProfileError("Invalid Facebook URL. Must match: https://facebook.com/username");
        return;
      }
    }

    if (docMaps) {
      const mapsRegex = /^https:\/\/(www\.)?(google\.com\/maps|maps\.app\.goo\.gl)\/.*$/;
      if (!mapsRegex.test(docMaps)) {
        setDoctorProfileError("Invalid Google Maps link. Must match google.com/maps or maps.app.goo.gl structure.");
        return;
      }
    }

    setDoctorProfileLoading(true);
    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          specialty,
          profilePicture: profilePic,
          phone: docPhone,
          email: docEmail,
          instagram: docInsta,
          tiktok: docTiktok,
          facebook: docFb,
          clinicLocationUrl: docMaps
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDoctorProfileSuccess("Doctor public profile updated successfully!");
        await onRefreshProfile();
      } else {
        setDoctorProfileError(data.error || "Failed to save profile.");
      }
    } catch (err) {
      setDoctorProfileError("Could not connect to server.");
    } finally {
      setDoctorProfileLoading(false);
    }
  };
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // General settings update loader
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Verification request states
  const [verificationInfo, setVerificationInfo] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; dataUrl: string }[]>([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);
  const [clearingNotification, setClearingNotification] = useState(false);

  const handleClearNotification = async () => {
    setClearingNotification(true);
    try {
      await fetch("/api/auth/notifications/clear", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      await onRefreshProfile();
    } catch (err) {
      console.error("Failed to clear notification:", err);
    } finally {
      setClearingNotification(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files) as File[];
    
    filesArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFiles(prev => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            dataUrl: reader.result as string
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);
    setVerificationSuccess(null);
    
    if (!verificationInfo.trim()) {
      setVerificationError("Please provide details about your medical license, hospital affiliation, and credentials.");
      return;
    }

    setVerificationLoading(true);
    try {
      const res = await fetch("/api/verification/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          info: verificationInfo,
          files: uploadedFiles
        })
      });

      const data = await res.json();
      if (res.ok) {
        setVerificationSuccess("Your application was submitted successfully! It is now pending admin review.");
        setVerificationInfo("");
        setUploadedFiles([]);
        await onRefreshProfile();
      } else {
        setVerificationError(data.error || "Failed to submit request.");
      }
    } catch (err) {
      setVerificationError("Could not connect to server.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const isDeclined = user?.verificationStatus === "declined";
  const declinedAtStr = user?.verificationDeclinedAt;
  
  let isCooldownActive = false;
  let cooldownDaysLeft = 0;
  
  if (isDeclined && declinedAtStr) {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const cooldownEnd = new Date(declinedAtStr).getTime() + oneWeek;
    if (Date.now() < cooldownEnd) {
      isCooldownActive = true;
      cooldownDaysLeft = Math.ceil((cooldownEnd - Date.now()) / (24 * 60 * 60 * 1000));
    }
  }

  const handleSavePreferences = async (themeId: string, langCode: string, notifyVal: boolean) => {
    setSelectedTheme(themeId);
    setSelectedLang(langCode);
    setNotifications(notifyVal);
    setSuccessMsg(null);
    setSavingSettings(true);

    try {
      const res = await fetch("/api/auth/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          theme: themeId,
          language: langCode,
          notifications: notifyVal
        })
      });

      if (res.ok) {
        setSuccessMsg("Preferences successfully saved to PAEONIX servers.");
        await onRefreshProfile();
        
        // Dynamically apply quick skin transformations if theme changes
        localStorage.setItem("paeonix_theme", themeId);
      } else {
        setSuccessMsg("Failed to synchronize settings with server.");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setSuccessMsg("Error updating online profile.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwdMessage({ text: "Please fill in all fields.", isError: true });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwdMessage({ text: "New passwords do not match.", isError: true });
      return;
    }

    if (newPassword.length < 6) {
      setPwdMessage({ text: "New password must be at least 6 characters.", isError: true });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPwdMessage({ text: "Password changed successfully!", isError: false });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setPwdMessage({ text: data.error || "Password change failed.", isError: true });
      }
    } catch (err) {
      setPwdMessage({ text: "Server connection failed.", isError: true });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="pb-24 animate-fade-in px-4 pt-6">
      {/* Settings Header */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
        <div className="bg-medical-500 text-white p-2.5 rounded-2xl shadow-md">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t("appSettings")}</h1>
          <p className="text-xs text-gray-400">{t("managePrefs")}</p>
        </div>
      </div>

      {/* User Alerts and Notifications Banner */}
      {user?.notification && (
        <div className="bg-medical-50 border border-medical-200 p-4 rounded-3xl mb-6 shadow-sm flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-medical-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-medical-900">User Profile Alert</p>
              <p className="text-xs text-medical-700 mt-1 leading-relaxed break-words">{user.notification}</p>
            </div>
          </div>
          <button
            onClick={handleClearNotification}
            disabled={clearingNotification}
            className="text-[10px] bg-white hover:bg-medical-100 text-medical-800 border border-medical-200 py-1 px-2.5 rounded-lg font-bold shadow-sm transition-all shrink-0"
          >
            Acknowledge
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* SECTION 1: Personalization Theme */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-medical-600" /> {t("themeCustomization")}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((th) => {
              const isSelected = selectedTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => handleSavePreferences(th.id, selectedLang, notifications)}
                  className={`relative flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                    isSelected 
                      ? "border-medical-500 bg-medical-50/50 shadow-sm" 
                      : "border-gray-100 hover:bg-gray-50 bg-white"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${th.color} shrink-0 shadow-inner flex items-center justify-center`}>
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-gray-700">{th.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: General & Localization */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-medical-600" /> {t("langRegional")}
          </h2>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {t("preferredLang")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSavePreferences(selectedTheme, lang.code, notifications)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                      isSelected
                        ? "bg-medical-600 text-white border-medical-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700">{t("pushNotifications")}</span>
              <span className="text-[10px] text-gray-400">{t("notifyDesc")}</span>
            </div>
            <button
              onClick={() => handleSavePreferences(selectedTheme, selectedLang, !notifications)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                notifications ? "bg-medical-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {successMsg && (
            <div className="bg-medical-50/50 text-medical-800 text-[10px] py-1.5 px-3 rounded-lg border border-medical-100 font-semibold text-center">
              {successMsg}
            </div>
          )}
        </div>

        {/* SECTION 3: Account Security & Password */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-medical-600" /> {t("accountSecurity")}
          </h2>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
            <h3 className="text-xs font-bold text-gray-700">{t("changePwd")}</h3>

            {pwdMessage && (
              <div className={`text-[11px] p-2.5 rounded-xl border ${
                pwdMessage.isError 
                  ? "bg-rose-50 border-rose-100 text-rose-700" 
                  : "bg-emerald-50 border-emerald-100 text-emerald-700"
              }`}>
                {pwdMessage.text}
              </div>
            )}

            <div>
              <input
                type="password"
                required
                placeholder={t("currentPwd")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-gray-50/60 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                required
                placeholder={t("newPwd")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-50/60 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
              <input
                type="password"
                required
                placeholder={t("confirmNewPwd")}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-gray-50/60 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
            </div>

            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
            >
              {pwdLoading ? "Processing..." : t("updatePwd")}
            </button>
          </form>
        </div>

        {/* SECTION 3.5: Medical Professional Verification */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-medical-600" /> Medical Professional Verification
          </h2>

          {user?.role === "doctor" ? (
            <div className="bg-medical-50/50 border border-medical-100 rounded-2xl p-4 text-center space-y-2 animate-fade-in">
              <CheckCircle2 className="w-8 h-8 text-medical-600 mx-auto" />
              <p className="text-xs font-bold text-gray-900">Verified Medical Account</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Your medical credentials have been successfully verified on PAEONIX. You have authorized editing and writing privileges in the Doctors Hub.
              </p>
            </div>
          ) : user?.verificationStatus === "pending" ? (
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-center space-y-2 animate-fade-in">
              <Clock className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
              <p className="text-xs font-bold text-amber-900">Application Pending Review</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Your credentials are currently being reviewed by our clinical panel. Once approved, you will receive full access to publishing systems.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-gray-500 leading-relaxed">
                Apply to become a verified medical professional on PAEONIX. Verified doctors can publish educational guides, suggest draft edits, and moderate health content.
              </p>

              {isCooldownActive ? (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center animate-fade-in">
                  <ShieldAlert className="w-7 h-7 text-rose-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-rose-950">Application Cooldown</p>
                  <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                    Your previous application was declined. To maintain verification integrity, you can apply again in <strong>{cooldownDaysLeft} day(s)</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitVerification} className="space-y-3.5 pt-1">
                  {verificationError && (
                    <div className="text-[11px] p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 font-semibold">
                      {verificationError}
                    </div>
                  )}
                  {verificationSuccess && (
                    <div className="text-[11px] p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold">
                      {verificationSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Professional Information & License Details
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={verificationInfo}
                      onChange={(e) => setVerificationInfo(e.target.value)}
                      placeholder="Please specify your licensing country/state, medical license ID, current hospital/clinical affiliation, and professional specialization."
                      className="w-full bg-gray-50/60 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Supporting Credentials (ID, Certifications)
                    </label>
                    
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-gray-700">Choose file or drag here</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">PDF, PNG, JPG (Max 5MB per file)</p>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Selected Files</p>
                        {uploadedFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-100 py-1.5 px-2.5 rounded-xl text-xs">
                            <span className="text-gray-600 truncate max-w-[200px] font-medium">{f.name}</span>
                            <button
                              type="button"
                              onClick={() => removeUploadedFile(idx)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={verificationLoading}
                    className="w-full bg-medical-600 hover:bg-medical-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-medical-600/5 active:scale-98"
                  >
                    {verificationLoading ? "Submitting Request..." : "Submit Verification Application"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* SECTION 3.6: Doctor Public Clinical Profile Settings (For Doctor Accounts Only) */}
        {user?.role === "doctor" && (
          <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> Doctor Public Clinical Profile Settings
            </h2>
            <p className="text-xs text-gray-400">
              Set up your clinical specialty, upload a compressed profile picture, and add public contact details for patient lookup.
            </p>

            <form onSubmit={handleSaveDoctorProfile} className="space-y-4">
              {doctorProfileError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold">
                  {doctorProfileError}
                </div>
              )}
              {doctorProfileSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold">
                  {doctorProfileSuccess}
                </div>
              )}

              {/* Profile Picture */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Compressed Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                    {profilePic ? (
                      <img src={profilePic} alt="Doctor avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="relative inline-block bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 py-1.5 px-3 rounded-xl text-[11px] font-bold cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 inline mr-1" /> Select Profile Picture
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePicChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Automatic local compression optimizes size instantly to reduce server and database footprint.
                    </p>
                  </div>
                </div>
              </div>

              {/* Specialty Field */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Doctor Specialty
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cardiology">Cardiology</option>
                  <option value="neurology">Neurology</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="dermatology">Dermatology</option>
                  <option value="surgery">Surgery</option>
                  <option value="psychiatry">Psychiatry</option>
                  <option value="internal medicine">Internal Medicine</option>
                  <option value="family medicine">Family Medicine</option>
                  <option value="gynecology">Gynecology</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="oncology">Oncology</option>
                  <option value="ophthalmology">Ophthalmology</option>
                  <option value="otolaryngology">Otolaryngology</option>
                  <option value="urology">Urology</option>
                  <option value="endocrinology">Endocrinology</option>
                  <option value="gastroenterology">Gastroenterology</option>
                  <option value="radiology">Radiology</option>
                  <option value="anesthesiology">Anesthesiology</option>
                  <option value="general practice">General Practice</option>
                </select>
              </div>

              {/* Public Contact and Social Media Info */}
              <div className="space-y-3.5 pt-2 border-t border-gray-100">
                <h3 className="text-[11px] font-bold text-gray-600 uppercase">Public Contact and Profiles</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g., +1 (555) 019-2834"
                      value={docPhone}
                      onChange={(e) => setDocPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Public Email</label>
                    <input
                      type="email"
                      placeholder="doctor@clinic.com"
                      value={docEmail}
                      onChange={(e) => setDocEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Instagram Profile</label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/doctor_handle"
                      value={docInsta}
                      onChange={(e) => setDocInsta(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">TikTok Profile</label>
                    <input
                      type="url"
                      placeholder="https://tiktok.com/@doctor_handle"
                      value={docTiktok}
                      onChange={(e) => setDocTiktok(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Facebook Page</label>
                    <input
                      type="url"
                      placeholder="https://facebook.com/doctor_page"
                      value={docFb}
                      onChange={(e) => setDocFb(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Clinic Google Maps Location URL</label>
                    <input
                      type="url"
                      placeholder="https://google.com/maps/place/... or https://maps.app.goo.gl/..."
                      value={docMaps}
                      onChange={(e) => setDocMaps(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={doctorProfileLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                {doctorProfileLoading ? "Saving profile..." : "Save Public Doctor Profile"}
              </button>
            </form>
          </div>
        )}

        {/* SECTION 3.5: Design & Development Partner */}
        <div className="bg-gradient-to-br from-medical-50/70 to-white border border-medical-100/40 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-medical-500 rounded-lg text-white">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold text-medical-950 uppercase tracking-wider">
              Design & Development Partner
            </h3>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            PAEONIX's user experience, clinical-grade interfaces, and full-stack architecture were designed and engineered by <strong>NuxWeb Agency</strong>.
          </p>
          <a
            href="https://nuxweb.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white border border-medical-200 hover:bg-medical-50 text-medical-800 font-bold py-2.5 px-4 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            Visit NuxWeb Agency <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* SECTION 4: Info & Logout */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{t("buildVersion")}</span>
            <span className="font-mono text-[10px]">v1.4.2-release</span>
          </div>

          <button
            onClick={onLogout}
            className="w-full bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 font-bold py-3.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut className="w-4 h-4" /> {t("signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}
