import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { User as UserIcon, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserMenuProps {
  fullName: string;
  roleLabel: string;
  onLogoutClick: () => void;
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({ fullName, roleLabel, onLogoutClick }: UserMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("nav.openUserMenu")}
        aria-expanded={open}
        className="touch-target flex items-center gap-1.5 rounded-lg px-1 py-1 text-gray-900 transition-colors hover:bg-blue-100/60 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:gap-2 sm:px-1.5"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {initials(fullName)}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900">{fullName}</p>
            {roleLabel && <p className="truncate text-xs text-gray-500">{roleLabel}</p>}
          </div>
          <Link
            to="/mon-profil"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <UserIcon className="h-4 w-4 text-gray-400" aria-hidden />
            {t("nav.myProfile")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogoutClick();
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t("auth.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
