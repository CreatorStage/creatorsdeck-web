import React, { useState, useEffect } from "react";
import { User, UserSettings } from "../types";
import { api, ValidationError } from "../api";

interface SettingsDialogProps {
  user: User;
  onClose: () => void;
}

export default function SettingsDialog({ user, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Local services states
  const [services, setServices] = useState<{ name: string; port: string; details: string; status: 'running' | 'stopped' | 'error' }[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Form states
  const [theme, setTheme] = useState("dark");
  const [preferredLanguage, setPreferredLanguage] = useState("pt-BR");
  const [profileBio, setProfileBio] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setServicesLoading(true);
      
      const [settingsData, servicesData] = await Promise.all([
        api.getSettings(user.id),
        api.getServicesStatus().catch((err) => {
          console.error("Falha ao obter status dos serviços:", err);
          return [
            { name: "Banco de Dados (SQLite)", port: "N/A", details: "Sem conexão com o backend local", status: "error" as const },
            { name: "RabbitMQ Message Broker", port: "5672", details: "Sem conexão com o backend local", status: "error" as const },
            { name: "YouTube Scraper Worker", port: "N/A", details: "Sem conexão com o backend local", status: "error" as const }
          ];
        })
      ]);

      setSettings(settingsData);
      setTheme(settingsData.theme);
      setPreferredLanguage(settingsData.preferredLanguage);
      setProfileBio(settingsData.profileBio || "");
      setServices(servicesData);
    } catch (err) {
      console.error(err);
      setError("Falha ao carregar configurações");
    } finally {
      setLoading(false);
      setServicesLoading(false);
    }
  };

  const handleRefreshServices = async () => {
    try {
      setServicesLoading(true);
      const data = await api.getServicesStatus();
      setServices(data);
    } catch (err) {
      console.error("Falha ao atualizar status dos serviços:", err);
      setServices([
        { name: "Banco de Dados (SQLite)", port: "N/A", details: "Sem conexão com o backend local", status: "error" },
        { name: "RabbitMQ Message Broker", port: "5672", details: "Sem conexão com o backend local", status: "error" },
        { name: "YouTube Scraper Worker", port: "N/A", details: "Sem conexão com o backend local", status: "error" }
      ]);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!theme) {
      errors.theme = "O tema da interface é obrigatório.";
    }
    if (!preferredLanguage) {
      errors.preferredLanguage = "O idioma preferido é obrigatório.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaving(false);
      return;
    }

    try {
      await api.updateSettings(user.id, {
        theme,
        preferredLanguage,
        profileBio
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.errors);
      } else {
        setError(err.message || "Erro ao salvar configurações");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-[#1c1c1c] rounded-sm w-full max-w-6xl h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] p-6 relative z-10 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-[#404040] pb-4 shrink-0">
          <h3 className="text-base font-semibold text-[#f1f1f1] uppercase tracking-wider flex items-center gap-2">
            <span className="material-icons text-[#aaaaaa]">settings</span>
            Configurações da Conta
          </h3>
          <button onClick={onClose} className="text-[#aaaaaa] hover:text-[#f1f1f1] transition-colors">
            <span className="material-icons">close</span>
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center flex-1 flex items-center justify-center">
            <span className="material-icons animate-sync-spin text-[#ff5045]">sync</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#aaaaaa] mb-1.5">
                  Tema da Interface
                </label>
                <select
                  value={theme}
                  onChange={(e) => {
                    setTheme(e.target.value);
                    if (fieldErrors.theme) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.theme;
                        return next;
                      });
                    }
                  }}
                  className={`w-full bg-[#0f0f0f] border text-[#f1f1f1] rounded-sm py-2 px-3 focus:outline-none focus:border-[#ff5045] text-sm ${
                    fieldErrors.theme ? "border-[#ff5045]" : "border-[#404040]"
                  }`}
                >
                  <option value="dark">Escuro (YouTube)</option>
                  <option value="light">Claro (Estudo)</option>
                </select>
                {fieldErrors.theme && (
                  <p className="mt-1 text-[#ff5045] text-[11px] font-sans font-medium">{fieldErrors.theme}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#aaaaaa] mb-1.5">
                  Idioma Preferido
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => {
                    setPreferredLanguage(e.target.value);
                    if (fieldErrors.preferredLanguage) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.preferredLanguage;
                        return next;
                      });
                    }
                  }}
                  className={`w-full bg-[#0f0f0f] border text-[#f1f1f1] rounded-sm py-2 px-3 focus:outline-none focus:border-[#ff5045] text-sm ${
                    fieldErrors.preferredLanguage ? "border-[#ff5045]" : "border-[#404040]"
                  }`}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (USA)</option>
                </select>
                {fieldErrors.preferredLanguage && (
                  <p className="mt-1 text-[#ff5045] text-[11px] font-sans font-medium">{fieldErrors.preferredLanguage}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#aaaaaa] mb-1.5">
                Bio do Criador (Perfil)
              </label>
              <textarea
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                rows={3}
                placeholder="Conte um pouco sobre sua jornada como criador..."
                className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 px-3 focus:outline-none focus:border-[#ff5045] text-sm resize-none"
              />
            </div>

            {/* Local Services Status Section */}
            <div className="border-t border-[#404040] pt-5 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#f1f1f1] flex items-center gap-2">
                  <span className="material-icons text-sm text-[#aaaaaa]">dns</span>
                  Status dos Serviços Locais (Nativos)
                </h4>
                <button
                  type="button"
                  onClick={handleRefreshServices}
                  disabled={servicesLoading}
                  className="bg-[#272727] hover:bg-[#3f3f3f] disabled:opacity-50 text-[#f1f1f1] border-0 text-[10px] uppercase font-bold tracking-widest py-1.5 px-3 rounded-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className={`material-icons text-[12px] ${servicesLoading ? "animate-spin" : ""}`}>refresh</span>
                  Atualizar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {services.map((svc, idx) => {
                  let statusBg = "bg-red-500/10 border-red-500/20 text-red-400";
                  let statusLabel = "Parado";
                  let statusDot = "bg-red-500 animate-pulse";
                  
                  if (svc.status === "running") {
                    statusBg = "bg-green-500/10 border-green-500/20 text-green-400";
                    statusLabel = "Rodando";
                    statusDot = "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]";
                  } else if (svc.status === "error") {
                    statusBg = "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
                    statusLabel = "Erro";
                    statusDot = "bg-yellow-500 animate-bounce";
                  }

                  return (
                    <div key={idx} className="bg-[#0f0f0f] border border-[#272727] p-4 rounded-sm flex flex-col justify-between h-[120px] transition-all hover:border-[#404040]">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-[#f1f1f1]">{svc.name}</div>
                          <div className="text-[10px] text-[#888] mt-0.5">Porta: <span className="font-mono text-[#aaa]">{svc.port}</span></div>
                        </div>
                        <div className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm border ${statusBg} flex items-center gap-1.5`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`}></span>
                          {statusLabel}
                        </div>
                      </div>
                      <div className="text-[11px] text-[#aaaaaa] truncate mt-3 border-t border-[#1c1c1c] pt-2" title={svc.details}>
                        {svc.details}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-red-500 text-[10px] uppercase font-bold tracking-wider">{error}</p>}
            {success && <p className="text-green-500 text-[10px] uppercase font-bold tracking-wider">Configurações salvas!</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#404040] sticky bottom-0 bg-[#1c1c1c] pb-1">
              <button
                type="button"
                onClick={onClose}
                className="yt-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="yt-btn-primary flex items-center gap-2"
              >
                {saving && <span className="material-icons text-sm animate-spin">refresh</span>}
                Salvar Alterações
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
