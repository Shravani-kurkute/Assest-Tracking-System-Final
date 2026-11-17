// Profile avatar dropdown for user info, notifications, date, and logout.

import { useEffect, useRef, useState } from "react";
import { Bell, CalendarDays, ChevronDown, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProfileDropdown({
  user,
  roleLabel,
  dateLabel,
  unreadCount,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = user?.full_name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div ref={containerRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
          {initial}
        </span>
        <span className="hidden sm:block">
          <span className="block text-sm font-semibold text-slate-900">
            {user?.full_name || "User"}
          </span>
          <span className="block text-xs text-slate-500">{roleLabel}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[80] mt-3 w-80 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/80">
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Signed In
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {user?.full_name || "User"}
            </p>
            <p className="mt-1 text-sm text-slate-500">{roleLabel}</p>
          </div>

          <div className="my-3 border-t border-slate-100" />

          <div className="space-y-1">
            <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-sky-600" />
                Date
              </span>
              <span className="font-medium text-slate-800">{dateLabel}</span>
            </div>

            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="inline-flex items-center gap-2">
                <Bell className="h-4 w-4 text-sky-600" />
                Notifications
              </span>
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                {unreadCount}
              </span>
            </Link>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-400"
              disabled
            >
              <span className="inline-flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </span>
              <span className="text-xs">Soon</span>
            </button>
          </div>

          <div className="my-3 border-t border-slate-100" />

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
