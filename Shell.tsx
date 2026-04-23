import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutGrid, MessageSquare, FolderKanban, Settings, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function Shell() {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Gallery', icon: LayoutGrid, match: (p: string) => p === '/' || p.startsWith('/gallery') || p.startsWith('/demo/') },
    { to: '/build', label: 'Build', icon: MessageSquare, match: (p: string) => p.startsWith('/build') },
    { to: '/my-os', label: 'My OS', icon: FolderKanban, match: (p: string) => p.startsWith('/my-os') },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <span className="text-white text-sm font-bold tracking-tight">S</span>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-slate-900 truncate leading-tight">Sloe Laboratory</p>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">by Sloe Labs</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = item.match(location.pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-slate-900 text-white font-medium shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 transition-colors">
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span>Help</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 transition-colors">
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
