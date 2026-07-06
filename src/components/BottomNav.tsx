import { motion } from "motion/react";
import { BookOpen, MessageSquare, Bookmark, Shield, Settings, Award, User, Stethoscope } from "lucide-react";
import { useTranslation } from "../localization.js";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  isDoctor?: boolean;
  lang?: string;
}

export default function BottomNav({ activeTab, setActiveTab, isAdmin, isDoctor = false, lang = "en" }: BottomNavProps) {
  const { t } = useTranslation(lang);

  const navItems = [
    { id: "browse", label: "Browse", icon: BookOpen },
    { id: "assistant", label: "AI", icon: MessageSquare },
    { id: "doctors", label: "Doctors", icon: Stethoscope },
    ...(isDoctor ? [{ id: "doctor-hub", label: "Doc Hub", icon: Award }] : []),
    ...(isAdmin ? [{ id: "admin-hub", label: "Admin Hub", icon: Shield }] : []),
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg px-1 pb-safe md:max-w-md md:mx-auto">
      <div className="flex justify-between items-center h-14 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex-1 flex flex-col items-center justify-center min-w-0 h-12 focus:outline-none"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div
                className={`transition-all duration-200 ${
                  isActive ? "text-medical-600 scale-105" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[9px] mt-0.5 font-medium transition-colors duration-200 truncate w-full text-center px-0.5 ${
                  isActive ? "text-medical-700 font-bold" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-1 w-6 h-0.5 bg-medical-500 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
