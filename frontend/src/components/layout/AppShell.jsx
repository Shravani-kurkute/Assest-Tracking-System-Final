// Shared authenticated layout with sidebar, header, and route outlet.

import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  PackageOpen,
  PanelLeftClose,
  QrCode,
  PanelLeftOpen,
  Send,
  Shield,
  Users2,
  Wrench,
  X,
} from "lucide-react";

import api from "../../api/axios";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS, ROLES } from "../../utils/roles";

const ADMIN_ROLES = [ROLES.SYSTEM_ADMIN, ROLES.DEPT_ADMIN];
const REPORT_ROLES = [ROLES.SYSTEM_ADMIN, ROLES.DEPT_ADMIN, ROLES.MANAGEMENT];

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assets", label: "Assets", icon: Boxes },
  { to: "/assets/scan", label: "Scan QR", icon: QrCode },
  { to: "/my-assets", label: "My Assets", icon: PackageOpen },
  { to: "/requests", label: "Asset Requests", icon: ClipboardCheck },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports", label: "Reports", icon: BarChart3, reportOnly: true },
  { to: "/assign", label: "Assign Asset", icon: Send, adminOnly: true },
  { to: "/departments", label: "Departments", icon: Building2, systemAdminOnly: true },
  { to: "/department-users", label: "Department Users", icon: Users2, departmentAdminOnly: true },
];

const routeMeta = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Monitor asset availability, assignments, and handovers in real time.",
    sectionLabel: "Dashboard",
  },
  "/assets": {
    title: "Assets",
    subtitle: "Review your latest asset inventory overview.",
    sectionLabel: "Assets",
  },
  "/assets/scan": {
    title: "Scan Asset QR",
    subtitle: "Identify an asset by scanning its QR code or entering its asset ID.",
    sectionLabel: "Assets",
  },
  "/my-assets": {
    title: "My Assets",
    subtitle: "Review assets currently mapped to your account.",
    sectionLabel: "Assets",
  },
  "/requests": {
    title: "Asset Requests",
    subtitle: "Submit asset requests or review the latest approval queue.",
    sectionLabel: "Requests",
  },
  "/maintenance": {
    title: "Maintenance",
    subtitle: "Report issues, review the queue, and track maintenance progress.",
    sectionLabel: "Maintenance",
  },
  "/notifications": {
    title: "Notifications",
    subtitle: "Stay updated on requests, maintenance changes, and system alerts.",
    sectionLabel: "Notifications",
  },
  "/reports": {
    title: "Reports",
    subtitle: "Review analytics across assets, requests, and maintenance activity.",
    sectionLabel: "Analytics",
  },
  "/assign": {
    title: "Assign Asset",
    subtitle: "Assign available inventory to employees and review the latest handover history.",
    sectionLabel: "Assignments",
  },
  "/departments": {
    title: "Departments",
    subtitle: "Create departments, assign managers, and review organizational ownership.",
    sectionLabel: "Administration",
  },
  "/department-users": {
    title: "Department Users",
    subtitle: "Create employees and review users mapped to your department.",
    sectionLabel: "Administration",
  },
};

function buildRoleName(role) {
  if (!role) return "User";
  if (ADMIN_ROLES.includes(role)) return "Admin";
  if (role === ROLES.MANAGEMENT) return "Management";
  return "Employee";
}

function formatHeaderDate() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const isSystemAdmin = user?.role === ROLES.SYSTEM_ADMIN;
  const isDepartmentAdmin = user?.role === ROLES.DEPT_ADMIN;
  const canViewReports = REPORT_ROLES.includes(user?.role);
  const meta = routeMeta[location.pathname] || {
    title: "Workspace",
    subtitle: "Manage assets and assignments from a shared control center.",
    sectionLabel: "Workspace",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    document.title = `${meta.title} | Asset Tracking System`;
  }, [meta.title]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        const notifications = Array.isArray(response.data) ? response.data : [];
        setUnreadCount(
          notifications.filter((notification) => !notification?.is_read).length
        );
      } catch {
        setUnreadCount(0);
      }
    };

    loadNotifications();
    window.addEventListener("notificationsUpdated", loadNotifications);
    return () => window.removeEventListener("notificationsUpdated", loadNotifications);
  }, []);

  const visibleNavItems = navItems.filter(
    (item) =>
      (!item.adminOnly || isAdmin) &&
      (!item.reportOnly || canViewReports) &&
      (!item.systemAdminOnly || isSystemAdmin) &&
      (!item.departmentAdminOnly || isDepartmentAdmin)
  );

  const renderNavLinks = (compact = false) =>
    visibleNavItems.map((item) => {
      const Icon = item.icon;
      const active = location.pathname === item.to;

      return (
        <Link
          key={item.to}
          to={item.to}
          title={compact ? item.label : undefined}
          onClick={() => setMobileSidebarOpen(false)}
          className={`sidebar-link ${compact ? "justify-center px-2" : "px-4 py-3"} ${
            active ? "active" : "hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              active ? "bg-white text-gray-900" : "bg-gray-100 text-gray-500"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          {!compact ? item.label : null}
        </Link>
      );
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {mobileSidebarOpen ? (
          <div
            className="fixed inset-0 z-[70] bg-slate-950/30 backdrop-blur-sm xl:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-[80] flex w-72 flex-col border-r border-gray-100 bg-white transition-transform duration-200 xl:hidden ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Asset Tracking
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">Control Center</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="space-y-1">{renderNavLinks(false)}</div>
          </nav>
        </aside>

        <aside
          className={`hidden flex-col border-r border-gray-100 bg-white transition-all duration-200 xl:flex ${
            sidebarCollapsed ? "w-24" : "w-72"
          }`}
        >
          <div
            className={`border-b border-gray-100 py-6 ${
              sidebarCollapsed ? "px-4" : "px-6"
            }`}
          >
            <div className={`flex ${sidebarCollapsed ? "justify-center" : "items-center gap-3"}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              {!sidebarCollapsed ? (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                    Asset Tracking
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">Control Center</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className={`px-4 py-4 ${sidebarCollapsed ? "flex justify-center" : "flex justify-end"}`}>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
          </div>

          <nav className={`flex-1 px-4 pb-6 ${sidebarCollapsed ? "pt-2" : "pt-0"}`}>
            <div className="space-y-1">{renderNavLinks(sidebarCollapsed)}</div>
          </nav>
        </aside>

        <main className="flex-1">
          <div className="relative z-40 border-b border-gray-100 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 xl:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                    {meta.title}
                  </h1>
                  {meta.subtitle ? (
                    <p className="mt-1 text-sm text-gray-400">{meta.subtitle}</p>
                  ) : null}
                  </div>
                </div>

                <div className="flex justify-end">
                  <ProfileDropdown
                    user={user}
                    roleLabel={ROLE_LABELS[user?.role] || buildRoleName(user?.role)}
                    dateLabel={formatHeaderDate()}
                    unreadCount={unreadCount}
                    onLogout={handleLogout}
                  />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 xl:hidden">
                {renderNavLinks(false)}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-6 py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
