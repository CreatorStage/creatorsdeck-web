import React, { useState } from "react";
import { User, VideoIdeaStatus, WorkspaceTab } from "../../types";
import StudioSidebar from "../shared/StudioSidebar";

interface WorkspaceHeaderProps {
  onBack: () => void;
  mainTitle: string;
  status: VideoIdeaStatus;
  saveVisualState: "sync" | "check" | "none";
  saveStatus: string;
  onStatusChange: (status: VideoIdeaStatus) => void;
  productionStatuses: { value: VideoIdeaStatus; label: string; badgeClass: string }[];
  currentTab: WorkspaceTab;
  tabs: { id: WorkspaceTab; label: string; icon: string }[];
  onTabChange: (id: WorkspaceTab) => void;
  user?: User | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onGoToDashboard?: () => void;
  onLogout?: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const WORKSPACE_TABS: Record<string, { label: string; icon: string }> = {
  overview: { label: "Visão Geral", icon: "lightbulb_outline" },
  description: { label: "Descrição", icon: "description" },
  simulator: { label: "Simulador", icon: "image_search" },
  references: { label: "Referências", icon: "link" },
  notes: { label: "Notas", icon: "sticky_note_2" },
  script: { label: "Roteiro", icon: "format_list_bulleted" },
  teleprompter: { label: "Teleprompter", icon: "videocam" }
};

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  onBack,
  mainTitle,
  status,
  saveVisualState,
  saveStatus,
  onStatusChange,
  productionStatuses,
  currentTab,
  tabs,
  onTabChange,
  user,
  sidebarCollapsed,
  onToggleSidebar,
  onGoToDashboard,
  onLogout,
  theme,
  toggleTheme
}) => {
  const initials = user?.name ? user.name[0].toUpperCase() : "C";
  const statusLabel = productionStatuses.find((item) => item.value === status)?.label || status;
  const isSaving = saveVisualState === "sync";

  return (
    <>
      {/* ─── TOP NAVIGATION BAR ─── */}
      <header className={`studio-topbar fixed top-0 right-0 left-0 ${sidebarCollapsed ? "md:left-[72px]" : "md:left-[300px]"} z-50 flex items-center justify-between px-6 md:px-10 transition-[left] duration-200 bg-yt-bg-surface border-b border-yt-bg-overlay`}>
        <div className="flex items-center gap-6 min-w-0">
          <nav className="hidden md:flex items-center gap-1 text-sm text-yt-text-secondary">
            <button onClick={() => onGoToDashboard?.()} className="hover:text-yt-text-primary px-3 py-2 bg-transparent border-0 cursor-pointer font-medium rounded-sm hover:bg-white/5 transition-colors">Painel</button>
            <span className="text-yt-bg-overlay">/</span>
            <button onClick={onBack} className="hover:text-yt-text-primary px-3 py-2 bg-transparent border-0 cursor-pointer font-medium rounded-sm hover:bg-white/5 transition-colors">Banco de Ideias</button>
            <span className="text-yt-bg-overlay">/</span>
            <span className="text-yt-text-primary px-3 py-2 font-semibold truncate max-w-[200px]">{mainTitle || "Área de Trabalho"}</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Save indicator */}
          {isSaving && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-yt-text-secondary font-sans">
              <span className="material-icons text-sm animate-spin">sync</span>
              Salvando...
            </span>
          )}
          {saveVisualState === "check" && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-[#66bb6a] font-sans">
              <span className="material-icons text-sm">check_circle</span>
              Salvo
            </span>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-yt-bg-surface hover:bg-yt-bg-elevated border border-yt-bg-overlay text-yt-text-secondary hover:text-yt-text-primary transition-all duration-200 cursor-pointer"
            title={theme === "dark" ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          >
            <span className="material-icons text-lg">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>


        </div>
      </header>

      {/* ─── SIDE BAR ─── */}
      <StudioSidebar
        className={`fixed left-0 top-0 bottom-0 z-50 hidden md:flex w-[300px] bg-yt-bg-surface border-r border-yt-bg-overlay ${sidebarCollapsed ? "!w-[72px]" : ""}`}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={onToggleSidebar}
        brandTitle="CreatorStage"
        brandSubtitle="Área de Trabalho"
        brandCollapsedLabel="CS"
        topSection={
          !sidebarCollapsed ? (
            <div>
              <p className="text-[10px] text-yt-text-disabled uppercase tracking-widest font-sans mb-1">Editando</p>
              <h2 className="text-sm font-bold text-yt-text-primary truncate leading-snug">{mainTitle || "Vídeo Sem Título"}</h2>
            </div>
          ) : null
        }
        footerSection={
          <div className={`space-y-4 ${sidebarCollapsed ? "px-0" : ""}`}>
            {!sidebarCollapsed && (
              <div>
                <p className="text-[10px] text-yt-text-disabled uppercase tracking-widest font-sans mb-2">Status do vídeo</p>
                <select
                  value={status}
                  onChange={(e) => onStatusChange(e.target.value as VideoIdeaStatus)}
                  className="studio-input w-full px-3 py-2 text-xs"
                >
                  {productionStatuses.map((item) => (
                    <option key={item.value} value={item.value} className="bg-yt-bg-surface text-yt-text-primary">
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button onClick={onBack} className={`w-full text-left text-yt-text-secondary hover:text-yt-text-primary flex items-center gap-3 text-sm transition-colors bg-transparent border-0 cursor-pointer ${sidebarCollapsed ? "justify-center" : ""}`}>
              <span className="material-icons text-[18px]">arrow_back</span>
              {!sidebarCollapsed && <span className="font-medium">Voltar ao Banco de Ideias</span>}
            </button>

            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 pt-3 border-t border-yt-bg-overlay">
                <span className="w-8 h-8 rounded-full bg-yt-bg-elevated border border-yt-bg-overlay flex items-center justify-center text-xs font-bold shrink-0 text-yt-text-primary">{initials}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-yt-text-primary">{user?.name || "Criador"}</p>
                  <p className="text-[10px] text-yt-text-disabled tracking-wider font-sans truncate">{user?.username ? `@${user.username}` : "Open Source"}</p>
                </div>
              </div>
            )}
          </div>
        }
      >
        {tabs.map((tab) => {
          const mapped = WORKSPACE_TABS[tab.id] || { label: tab.label, icon: tab.icon };
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={mapped.label}
              className={`w-full h-[50px] flex items-center gap-3.5 border-l-[3px] text-left transition-colors border-0 cursor-pointer ${
                isActive
                  ? "bg-yt-bg-elevated border-yt-red text-yt-red"
                  : "border-transparent text-yt-text-secondary hover:bg-yt-bg-elevated hover:text-yt-text-primary"
              } ${sidebarCollapsed ? "justify-center px-0" : "px-7"}`}
            >
              <span className="material-icons text-[20px] shrink-0">{mapped.icon}</span>
              {!sidebarCollapsed && <span className="text-sm font-semibold">{mapped.label}</span>}
            </button>
          );
        })}
      </StudioSidebar>
    </>
  );
};

export default WorkspaceHeader;
