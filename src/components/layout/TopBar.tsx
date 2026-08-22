import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { ROLE_LABELS } from "@/data/constant/roles";
import { useLogout } from "@/features/auth/useAuth";
import { useOnline } from "@/hooks/useOnline";
import { usePendingSyncCount } from "@/hooks/usePendingSyncCount";
import { useTranslation } from "react-i18next";
import { LogOut, ChevronDown, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const FlagFR = () => (
  <svg
    viewBox="0 0 3 2"
    className="h-3 w-4 shrink-0 rounded-sm object-cover"
    aria-hidden
  >
    <rect width="1" height="2" fill="#002395" />
    <rect x="1" width="1" height="2" fill="#ffffff" />
    <rect x="2" width="1" height="2" fill="#ED2939" />
  </svg>
);

const FlagMG = () => (
  <svg
    viewBox="0 0 900 600"
    className="h-3 w-4 shrink-0 rounded-sm object-cover"
    aria-hidden
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
  const roleLabel = roles
    .filter((r) => r !== "ROLE_USER" && r in ROLE_LABELS)
    .map((r) => ROLE_LABELS[r])
    .join(", ");

  const { mutate: logout } = useLogout();
  const isOnline = useOnline();
  const pendingSyncCount = usePendingSyncCount();
  const { t, i18n } = useTranslation();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const currentLang = i18n.language?.startsWith("mg") ? "mg" : "fr";

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

  const statusMessage = !isOnline
    ? pendingSyncCount > 0
      ? `${t("offline.banner")} · ${t("offline.pending", { count: pendingSyncCount })}`
      : t("offline.banner")
    : pendingSyncCount > 0
      ? t("offline.pending", { count: pendingSyncCount })
      : null;

  return (
    <header
      className="sticky top-0 z-30 border-b border-gray-200 bg-white pt-[max(0px,env(safe-area-inset-top))]"
    >
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <button
            onClick={toggleSidebar}
            aria-label={t("nav.openMenu")}
            className="touch-target flex shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img
            src="/images/TOA.png"
            alt="TOA"
            className="h-6 w-auto shrink-0 lg:hidden"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              aria-label={t("nav.changeLanguage")}
              className="touch-target flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:border sm:border-gray-200 sm:bg-gray-50 sm:gap-2 sm:px-3"
            >
              {currentLang === "mg" ? <FlagMG /> : <FlagFR />}
              <span className="hidden text-sm font-medium uppercase text-gray-900 sm:inline">
                {currentLang}
              </span>
              <ChevronDown
                className={`hidden h-4 w-4 text-gray-500 transition-transform sm:block ${langOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {langOpen && (
              <div className="absolute right-0 z-50 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    i18n.changeLanguage("fr");
                    setLangOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FlagFR />
                  <span className="font-medium">Français</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    i18n.changeLanguage("mg");
                    setLangOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FlagMG />
                  <span className="font-medium">Malagasy</span>
                </button>
              </div>
            )}
          </div>

          <div className="hidden min-w-0 text-right md:block">
            <p className="truncate text-sm font-medium text-gray-700">
              {user?.nom}
            </p>
            {roleLabel && (
              <p className="truncate text-xs text-gray-500">{roleLabel}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogoutClick}
            title={t("auth.logout")}
            aria-label={t("auth.logout")}
            className="touch-target flex shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`border-b px-3 py-1.5 text-center text-xs font-medium sm:px-4 ${
            !isOnline
              ? "border-yellow-100 bg-yellow-50 text-yellow-800"
              : "border-blue-100 bg-blue-50 text-blue-800"
          }`}
        >
          {statusMessage}
        </div>
      )}

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
