'use client'

import Link from "next/link";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Clients", href: "/dashboard/clients", icon: "👥" },
  { name: "Leads", href: "/dashboard/leads", icon: "🎯" },
  { name: "Services", href: "/dashboard/services", icon: "🛠️" },
  { name: "Jobs", href: "/dashboard/jobs", icon: "📅" },
  { name: "Quotes", href: "/dashboard/quotes", icon: "📄" },
  { name: "Invoices", href: "/dashboard/invoices", icon: "🧾" },
  { name: "Reports", href: "/dashboard/reports", icon: "📈" },
  { name: "Reviews", href: "/dashboard/reviews", icon: "⭐" },
];

function Sidebar({ isCollapsed, toggleSidebar }: { isCollapsed: boolean; toggleSidebar: () => void }) {
  return (
    <div className={`flex h-full flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo / Business Name */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            BRNNO
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            title={isCollapsed ? item.name : undefined}
          >
            <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-zinc-200 dark:border-zinc-800"></div>

      {/* Settings and Logout */}
      <div className="space-y-1 px-3 py-4">
        <Link
          href="/dashboard/settings"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          title={isCollapsed ? "Settings" : undefined}
        >
          <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>⚙️</span>
          {!isCollapsed && <span>Settings</span>}
        </Link>
        <button
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          title={isCollapsed ? "Logout" : undefined}
        >
          <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Business Name
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Settings
        </button>
        <div className="h-10 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
          <span className="text-sm font-medium">A</span>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

