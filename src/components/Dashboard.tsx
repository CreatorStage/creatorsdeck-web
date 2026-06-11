import React, { useState, useEffect } from "react";
import { Channel, User } from "../types";
import { api, ValidationError } from "../api";
import SettingsDialog from "./SettingsDialog";
import StudioSidebar from "./shared/StudioSidebar";
import { swal } from "../utils/swal";

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onSelectChannel: (channel: Channel) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export default function Dashboard({ user, onLogout, onSelectChannel, theme, toggleTheme }: DashboardProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Modal Fields
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Delete Channel State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChannelToDelete, setSelectedChannelToDelete] = useState<Channel | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const data = await api.getChannels();
      setChannels(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    // Active client-side validations
    const errors: Record<string, string> = {};
    if (!name || !name.trim()) {
      errors.name = "O nome do canal é obrigatório.";
    }
    if (!niche || !niche.trim()) {
      errors.niche = "O nicho do canal é obrigatório.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const newChan = await api.createChannel(name, niche);
      setChannels([...channels, { ...newChan, ideasCount: 0 } as any]);
      setShowModal(false);
      setName("");
      setNiche("");
      swal.toast("Canal criado com sucesso!");
    } catch (err: any) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.errors);
      } else {
        setError(err.message || "Não foi possível criar o canal");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelToDelete) return;
    if (!deletePassword) {
      setDeleteError("Por favor, digite a sua senha.");
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    try {
      await api.deleteChannel(selectedChannelToDelete.id, deletePassword);
      setChannels(channels.filter((c) => c.id !== selectedChannelToDelete.id));
      setShowDeleteModal(false);
      setSelectedChannelToDelete(null);
      setDeletePassword("");
      swal.toast("Canal excluído com sucesso!");
    } catch (err: any) {
      setDeleteError(err.message || "Erro ao excluir o canal. Verifique a senha.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-yt-bg-primary text-yt-text-primary flex flex-col font-sans transition-colors duration-200">

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setMobileMenuOpen(false)} />
          <StudioSidebar
            className="absolute left-0 top-0 bottom-0 w-[300px] bg-yt-bg-surface border-r border-yt-bg-overlay"
            collapsed={false}
            brandTitle="CreatorsDeck"
            brandSubtitle="Studio"
            brandCollapsedLabel="CS"
            topSection={
              <button
                onClick={() => { setShowModal(true); setMobileMenuOpen(false); }}
                className="w-full bg-[#ff5045] hover:bg-[#ff3f33] text-[#0b0b0b] py-3 rounded-[3px] font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border-0"
              >
                <span className="material-icons text-base">add</span>
                Novo Canal
              </button>
            }
            footerSection={
              <div className="space-y-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full text-left text-yt-text-secondary hover:text-yt-text-primary flex items-center gap-3 text-sm transition-colors bg-transparent border-0 cursor-pointer"
                >
                  <span className="material-icons text-[18px]">settings</span>
                  <span className="font-medium">Configurações da Conta</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left text-[#ff5045] hover:text-white flex items-center gap-3 text-sm transition-colors bg-transparent border-0 cursor-pointer"
                >
                  <span className="material-icons text-[18px] text-[#ff5045]">logout</span>
                  <span className="font-medium">Sair</span>
                </button>
                <p className="text-[10px] text-yt-text-disabled uppercase tracking-widest font-sans text-center pt-2 border-t border-yt-bg-overlay">CreatorsDeck Studio</p>
              </div>
            }
          >
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-[#ff5045] hover:bg-[#ff3f33] text-[#0b0b0b] py-3 rounded-[3px] font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border-0"
            >
              <span className="material-icons text-base">add</span>
              Novo Canal
            </button>

            <button className="w-full h-[50px] flex items-center gap-3.5 border-l-[3px] text-left transition-colors border-[#ff5045] bg-yt-bg-elevated text-[#ff5045] cursor-default px-7 border-0">
              <span className="material-icons text-[20px] shrink-0">subscriptions</span>
              <span className="flex items-center justify-between w-full">
                <span className="text-sm font-semibold">Canais Ativos</span>
                <span className="bg-yt-bg-primary text-yt-text-secondary text-[10px] px-2 py-0.5 rounded font-mono">{channels.length}</span>
              </span>
            </button>
          </StudioSidebar>
        </div>
      )}

      {/* Settings Dialog */}
      {showSettings && <SettingsDialog user={user} onClose={() => setShowSettings(false)} />}

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <StudioSidebar
          className={`hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-[300px] bg-yt-bg-surface border-r border-yt-bg-overlay ${sidebarCollapsed ? "!w-[72px]" : ""}`}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
          brandTitle="CreatorsDeck"
          brandSubtitle="Studio"
          brandCollapsedLabel="CS"
          topSection={
            sidebarCollapsed ? (
              <button
                onClick={() => setShowModal(true)}
                title="Novo Canal"
                className="w-full h-10 bg-[#ff5045] hover:bg-[#ff3f33] text-white rounded-[3px] flex items-center justify-center transition-colors cursor-pointer border-0"
              >
                <span className="material-icons text-base">add</span>
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-[#ff5045] hover:bg-[#ff3f33] text-[#0b0b0b] py-3 rounded-[3px] font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border-0"
              >
                <span className="material-icons text-base">add</span>
                Novo Canal
              </button>
            )
          }
          footerSection={
            <div className="space-y-2">
              <button
                onClick={() => setShowSettings(true)}
                className="w-full text-left text-yt-text-secondary hover:text-yt-text-primary flex items-center gap-3 text-sm transition-colors bg-transparent border-0 cursor-pointer"
              >
                <span className="material-icons text-[18px]">settings</span>
                {!sidebarCollapsed && <span className="font-medium">Configurações da Conta</span>}
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left text-[#ff5045] hover:text-white flex items-center gap-3 text-sm transition-colors bg-transparent border-0 cursor-pointer"
              >
                <span className="material-icons text-[18px] text-[#ff5045]">logout</span>
                {!sidebarCollapsed && <span className="font-medium">Sair</span>}
              </button>
              {!sidebarCollapsed && user && (
                <div className="flex items-center gap-3 pt-3 border-t border-yt-bg-overlay">
                  <span className="w-8 h-8 rounded-full bg-yt-bg-elevated border border-yt-bg-overlay flex items-center justify-center text-xs font-bold shrink-0 text-yt-text-primary">
                    {user.username?.[0]?.toUpperCase() || "C"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-yt-text-primary">{user.username || "Criador"}</p>
                    <p className="text-[10px] text-yt-text-disabled tracking-wider font-sans truncate">@{user.username}</p>
                  </div>
                </div>
              )}
            </div>
          }
        >
          <button
            onClick={() => setShowSettings(true)}
            className={`w-full h-[50px] flex items-center gap-3.5 border-l-[3px] text-left transition-colors border-[#ff5045] bg-yt-bg-elevated text-[#ff5045] cursor-default ${sidebarCollapsed ? "justify-center px-0" : "px-7"}`}
          >
            <span className="material-icons text-[20px] shrink-0">subscriptions</span>
            {!sidebarCollapsed && (
              <span className="flex items-center justify-between w-full">
                <span className="text-sm font-semibold">Canais Ativos</span>
                <span className="bg-yt-bg-primary text-yt-text-secondary text-[10px] px-2 py-0.5 rounded font-mono">{channels.length}</span>
              </span>
            )}
          </button>
        </StudioSidebar>

        {/* Content Area (Background bg-yt-bg-primary, padding 24px) */}
        <main className={`flex-1 bg-yt-bg-primary p-6 overflow-y-auto transition-[margin] duration-200 ${sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[300px]"}`}>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-yt-bg-overlay pb-5">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-yt-text-primary">Canais do Painel</h1>
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
              <p className="text-xs text-yt-text-secondary mt-1">
                Selecione o canal para desenvolver ideias inéditas, organizar roteiros e abrir o teleprompter de gravação.
              </p>
            </div>
          </div>

          {/* Loading States */}
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <span className="material-icons text-3xl text-[#ff5045] animate-sync-spin">sync</span>
              <p className="text-xs text-[#aaaaaa] uppercase tracking-wider">Acessando banco de dados...</p>
            </div>
          ) : channels.length === 0 ? (
            /* Empty State */
            <div className="yt-card p-10 text-center max-w-xl mx-auto my-6">
              <span className="material-icons text-yt-text-disabled text-5xl mb-4">subscriptions</span>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-yt-text-primary mb-2">Nenhum canal cadastrado</h3>
              <p className="text-xs text-yt-text-secondary leading-relaxed max-w-sm mx-auto mb-6">
                Você precisa configurar no mínimo um canal para começar a organizar novos roteiros de gravação.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="yt-btn-primary"
              >
                Criar Meu Primeiro Canal
              </button>
            </div>
          ) : (
            /* Channels List in List standard style */
            <div className="flex flex-col gap-3">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => onSelectChannel(channel)}
                  className="yt-card p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2.5 mb-1">
                      <h3 className="text-base font-semibold text-yt-text-primary group-hover:text-yt-red transition-colors truncate">
                        {channel.name}
                      </h3>
                      <span className="text-[10px] font-medium tracking-wider uppercase text-[#ce93d8] bg-purple-900/20 py-0.5 px-2.5 rounded-full border border-[#ce93d8]/20 shrink-0">
                        {channel.niche || "Geral"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-yt-text-secondary font-sans mt-1">
                      <span>Nicho configurado: <strong>{channel.niche || "Geral"}</strong></span>
                      <span className="text-yt-text-disabled">•</span>
                      <span className="flex items-center gap-1 font-sans">
                        <span className="material-icons text-yt-text-disabled text-xs mt-0.5">lightbulb_outline</span>
                        <strong>{channel.ideasCount ?? 0}</strong> ideias salvas
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-yt-bg-overlay/50 sm:pl-4 self-end sm:self-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChannelToDelete(channel);
                        setDeletePassword("");
                        setDeleteError(null);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-yt-text-disabled hover:text-yt-red rounded bg-transparent border-0 cursor-pointer flex items-center justify-center transition-colors"
                      title="Excluir canal"
                    >
                      <span className="material-icons text-sm">delete</span>
                    </button>
                    
                    <span className="text-[#ff5045] group-hover:text-[#ff3f33] uppercase tracking-wider font-semibold text-[11px] flex items-center gap-0.5 transition-colors">
                      Acessar <span className="material-icons text-sm">chevron_right</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="h-[40px] bg-yt-bg-surface border-t border-yt-bg-overlay flex items-center justify-between px-6 text-[11px] text-yt-text-disabled uppercase tracking-widest mt-auto">
        <span>YouTube Studio Design Framework</span>
        <span>MVP 1.0</span>
      </footer>

      {/* CREATE CHANNEL DIALOG */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-yt-bg-surface border border-yt-bg-overlay rounded-sm w-full max-w-md p-6 relative z-10 shadow-2xl">
            <h3 className="text-base font-semibold text-yt-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-icons text-yt-red">add_box</span>
              Cadastrar Novo Canal
            </h3>

            {error && (
              <div className="mb-4 bg-red-950/40 border border-yt-red/30 text-red-100 p-2.5 rounded-sm text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-yt-text-secondary mb-1.5">
                  Nome Oficial do Canal
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: "" }));
                  }}
                  placeholder="ex: Canal Finanças Explicadas ou Vlogs de Culinária"
                  className="w-full bg-yt-bg-primary border border-yt-bg-overlay text-yt-text-primary rounded-sm py-2 px-3 focus:outline-none focus:border-yt-red text-sm"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-[#ff5045] font-sans">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-yt-text-secondary mb-1.5">
                  Nicho / Categoria Principal
                </label>
                <input
                  type="text"
                  required
                  value={niche}
                  onChange={(e) => {
                    setNiche(e.target.value);
                    if (fieldErrors.niche) setFieldErrors(prev => ({ ...prev, niche: "" }));
                  }}
                  placeholder="ex: Finanças, Culinária, Tecnologia, Notícias"
                  className="w-full bg-yt-bg-primary border border-yt-bg-overlay text-yt-text-primary rounded-sm py-2 px-3 focus:outline-none focus:border-yt-red text-sm"
                />
                {fieldErrors.niche && (
                  <p className="mt-1 text-xs text-[#ff5045] font-sans">{fieldErrors.niche}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-yt-bg-overlay">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="yt-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="yt-btn-primary"
                >
                  {saving ? "Salvando..." : "Criar Canal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CHANNEL DIALOG */}
      {showDeleteModal && selectedChannelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowDeleteModal(false)}></div>
          
          <div className="bg-yt-bg-surface border border-yt-bg-overlay rounded-sm w-full max-w-sm p-6 relative z-10 shadow-2xl">
            <h3 className="text-base font-semibold text-yt-text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="material-icons text-yt-red">warning</span>
              Excluir Canal
            </h3>
            
            <p className="text-xs text-yt-text-secondary leading-relaxed mb-4">
              A exclusão do canal <strong className="text-yt-text-primary">"{selectedChannelToDelete.name}"</strong> é definitiva! Todos os vídeos, ideias, notas, roteiros e referências serão excluídos permanentemente.
            </p>

            {deleteError && (
              <div className="mb-4 bg-red-950/40 border border-yt-red/30 text-red-100 p-2.5 rounded-sm text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteChannel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-yt-text-secondary mb-1.5">
                  Confirme sua Senha do Canal
                </label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Digite sua senha de acesso"
                  className="w-full bg-yt-bg-primary border border-yt-bg-overlay text-yt-text-primary rounded-sm py-2 px-3 focus:outline-none focus:border-yt-red text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-yt-bg-overlay">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="yt-btn-secondary text-yt-text-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="px-4 py-1.5 bg-[#ff5045] hover:bg-[#e0453b] disabled:bg-[#717171] text-white font-medium text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  {deleting ? "Excluindo..." : "Excluir Definitivamente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
