import React, { ReactNode } from "react";

interface StudioSidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  brandTitle: string;
  brandSubtitle: string;
  brandCollapsedLabel?: string;
  topSection?: ReactNode;
  footerSection?: ReactNode;
  children: ReactNode;
}

export default function StudioSidebar({
  className = "",
  collapsed = false,
  onToggleCollapsed,
  brandTitle,
  brandSubtitle,
  brandCollapsedLabel = "CS",
  topSection,
  footerSection,
  children
}: StudioSidebarProps) {
  return (
    <aside className={`studio-sidebar flex flex-col justify-between transition-[width] duration-200 ${collapsed ? "!w-[72px]" : ""} ${className}`}>
      <div>
        <div className={`h-[80px] flex items-center border-b border-yt-bg-overlay ${collapsed ? "justify-center px-3" : "px-7"}`}>
          {onToggleCollapsed ? (
            <button type="button" onClick={onToggleCollapsed} className="text-left w-full flex items-center justify-between group bg-transparent border-0 cursor-pointer">
              {!collapsed ? (
                <div className="flex items-center gap-3">
                  <img src="/apple-touch-icon.png" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-yt-text-primary leading-none">{brandTitle}</h1>
                    <p className="text-[10px] text-yt-text-disabled uppercase tracking-[0.2em] mt-1 font-sans">{brandSubtitle}</p>
                  </div>
                </div>
              ) : (
                <img src="/apple-touch-icon.png" alt="Logo" className="w-8 h-8 object-contain mx-auto rounded-md" />
              )}
              {!collapsed && <span className="material-icons text-yt-text-disabled text-base group-hover:text-yt-text-secondary transition-colors">chevron_left</span>}
            </button>
          ) : (
            <div className="w-full flex items-center justify-between">
              {!collapsed ? (
                <div className="flex items-center gap-3">
                  <img src="/apple-touch-icon.png" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-yt-text-primary leading-none">{brandTitle}</h1>
                    <p className="text-[10px] text-yt-text-disabled uppercase tracking-[0.2em] mt-1 font-sans">{brandSubtitle}</p>
                  </div>
                </div>
              ) : (
                <img src="/apple-touch-icon.png" alt="Logo" className="w-8 h-8 object-contain mx-auto rounded-md" />
              )}
            </div>
          )}
        </div>

        {topSection && (
          <div className={`border-b border-yt-bg-overlay ${collapsed ? "px-3 py-4" : "px-5 py-4"}`}>
            {topSection}
          </div>
        )}

        <nav className="py-2 space-y-0.5">
          {children}
        </nav>
      </div>

      {footerSection && (
        <div className={`border-t border-yt-bg-overlay ${collapsed ? "px-3 py-5" : "px-7 py-5"}`}>
          {footerSection}
        </div>
      )}
    </aside>
  );
}