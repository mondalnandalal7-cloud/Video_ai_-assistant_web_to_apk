import React from 'react';
import {
  LayoutDashboard,
  Film,
  PlusCircle,
  Tv,
  BookmarkCheck,
  Settings,
  Sparkles,
  Layers,
  Smartphone,
} from 'lucide-react';

export type TabType = 'dashboard' | 'create' | 'videos' | 'series' | 'templates' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isDemoMode: boolean;
  onOpenAndroidApk?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  isDemoMode,
  onOpenAndroidApk,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Video', icon: PlusCircle },
    { id: 'videos', label: 'My Videos', icon: Film },
    { id: 'series', label: 'Series', icon: Tv },
    { id: 'templates', label: 'Templates', icon: BookmarkCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header
        id="app-header"
        className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080B11]/90 backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div
            id="brand-logo"
            onClick={() => onTabChange('dashboard')}
            className="flex cursor-pointer items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                  AI Studio <span className="text-indigo-400">Faceless</span>
                </span>
                {isDemoMode ? (
                  <span
                    id="demo-mode-badge"
                    className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300"
                  >
                    DEMO MODE
                  </span>
                ) : (
                  <span
                    id="ai-online-badge"
                    className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AI ONLINE
                  </span>
                )}
              </div>
              <p className="hidden text-xs text-slate-400 sm:block">Automated Faceless Video Engine</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`desktop-nav-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700/80'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Create & Android Actions */}
          <div className="flex items-center gap-2.5">
            {onOpenAndroidApk && (
              <button
                id="header-android-apk-btn"
                onClick={onOpenAndroidApk}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 shadow-sm transition-all hover:bg-emerald-500/20 active:scale-95"
                title="Android App & APK Download"
              >
                <Smartphone className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">Android APK</span>
              </button>
            )}

            <button
              id="header-create-btn"
              onClick={() => onTabChange('create')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-500 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">New Project</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Large touch targets for Android & iOS) */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/90 bg-[#080B11]/95 backdrop-blur-lg md:hidden"
      >
        <div className="grid h-16 grid-cols-6 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-1 transition-colors ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    isActive ? 'bg-indigo-500/20 text-indigo-400' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] leading-tight mt-0.5 truncate max-w-[52px]">
                  {item.id === 'create' ? 'Create' : item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
