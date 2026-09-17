import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";

function TopBar({
  title,
  subtitle,
  userName = "",
  userRole = "",
  profilePath = "/",
  onLogout,
  flat = false,
}) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const wrapRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const handleLogout = () => {
    setProfileOpen(false);
    onLogout?.();
  };

  return (
    <div
      ref={wrapRef}
      className={`sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3
        ${flat
          ? "rounded-lg border border-slate-200 bg-white shadow-sm"
          : "rounded-2xl border border-slate-200 bg-white shadow-md shadow-sky-100/60"}`}
    >
      {/* ── Left: title block ── */}
      <div className="min-w-0">
        {title && (
          <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
            {title}
          </h1>
        )}
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>

      {/* ── Right: actions ── */}
      {userName && (
      <div className="flex shrink-0 items-center gap-2.5">

        {/* Divider */}
        <span className="hidden h-6 w-px bg-slate-200 sm:block" />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-3
              shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md
              bg-blue-600 text-[11px] font-semibold text-white">
              {initials}
            </span>
            <span className="hidden text-left md:block">
              <span className="block max-w-28 truncate text-xs font-bold text-slate-800">{userName}</span>
              <span className="block text-[10px] font-medium text-slate-400">{userRole || "Member"}</span>
            </span>
            <FaChevronDown className={`hidden h-2.5 w-2.5 text-slate-400 transition-transform md:block ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200
              bg-white shadow-lg">
              {/* Mini header */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md
                  bg-blue-600 text-xs font-semibold text-white">
                  {initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">{userName}</span>
                  <span className="block truncate text-[11px] text-slate-400">{userRole || "Member"}</span>
                </span>
              </div>

              <div className="p-1">
                <button
                  onClick={() => { setProfileOpen(false); navigate(profilePath); }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
                    text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                >
                  <FaUserCircle className="text-base text-slate-400" />
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
                    text-rose-600 transition hover:bg-rose-50 cursor-pointer"
                >
                  <FaSignOutAlt className="text-base" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default TopBar;
