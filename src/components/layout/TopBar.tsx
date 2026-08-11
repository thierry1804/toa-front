import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { ROLE_LABELS } from "@/data/constant/roles";
import { useLogout } from "@/features/auth/useAuth";
import { useOnline } from "@/hooks/useOnline";
import { usePendingSyncCount } from "@/hooks/usePendingSyncCount";
import { useTranslation } from "react-i18next";
import { LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const FlagFR = () => (
  <svg
    viewBox="0 0 3 2"
    className="h-3 w-4 rounded-sm object-cover shadow-sm flex-shrink-0"
  >
    <rect width="1" height="2" fill="#002395" />
    <rect x="1" width="1" height="2" fill="#ffffff" />
    <rect x="2" width="1" height="2" fill="#ED2939" />
  </svg>
);

const FlagMG = () => (
  <svg
    viewBox="0 0 900 600"
    className="h-3 w-4 rounded-sm object-cover shadow-sm flex-shrink-0"
  >
    <rect width="300" height="600" fill="#ffffff" />
    <rect x="300" width="600" height="300" fill="#fc3d32" />
    <rect x="300" y="300" width="600" height="300" fill="#007e3a" />
  </svg>
);

export function TopBar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const roles = useAuthStore((s) => s.roles);
  const roleLabel = roles.map((r) => ROLE_LABELS[r] ?? r).join(", ");

  const { mutate: logout } = useLogout();
  const isOnline = useOnline();
  const pendingSyncCount = usePendingSyncCount();
  const { t, i18n } = useTranslation();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleLogoutClick = () => {
    if (pendingSyncCount > 0) {
      setLogoutConfirmOpen(true);
    } else {
      logout();
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <div className="border border-gray-200 rounded-lg p-1 lg:hidden">
          <img src="/images/TOA.png" alt="TOA" className="h-8 w-auto" />
        </div>
        <button
          onClick={toggleSidebar}
          aria-label={t("nav.openMenu")}
          className="touch-target flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        {!isOnline && (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
            {t("offline.banner")}
            {pendingSyncCount > 0 &&
              ` · ${t("offline.pending", { count: pendingSyncCount })}`}
          </span>
        )}
        {isOnline && pendingSyncCount > 0 && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            {t("offline.pending", { count: pendingSyncCount })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {i18n.language === "mg" ? <FlagMG /> : <FlagFR />}
            <span className="text-sm font-medium text-gray-900 uppercase">
              {i18n.language}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${langOpen ? "rotate-180" : ""}`}
            />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-1 w-32 rounded-lg border border-gray-200 bg-white shadow-lg z-50 py-1">
              <button
                onClick={() => {
                  i18n.changeLanguage("fr");
                  setLangOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FlagFR />
                <span className="font-medium">Français</span>
              </button>
              <button
                onClick={() => {
                  i18n.changeLanguage("mg");
                  setLangOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FlagMG />
                <span className="font-medium">Malagasy</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{user?.nom}</p>
            {roleLabel && <p className="text-xs text-gray-500">{roleLabel}</p>}
          </div>
          <button
            onClick={handleLogoutClick}
            title={t("auth.logout")}
            aria-label={t("auth.logout")}
            className="touch-target flex items-center justify-center rounded-full text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 active:scale-95"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Modal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title={t("auth.logoutConfirmTitle")}
      >
        <p className="text-sm text-gray-600">
          {t("auth.logoutConfirmMessage", { count: pendingSyncCount })}
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setLogoutConfirmOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setLogoutConfirmOpen(false);
              logout();
            }}
          >
            {t("auth.logoutConfirmAction")}
          </Button>
        </ModalFooter>
      </Modal>
    </header>
  );
}

export default TopBar;
