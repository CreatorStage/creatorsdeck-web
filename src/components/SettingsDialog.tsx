import React, { useState, useEffect } from "react";
import { User, UserSettings } from "../types";
import { api } from "../api";

interface SettingsDialogProps {
  user: User;
  onClose: () => void;
}

export default function SettingsDialog({ user, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      const data = await api.getSettings(user.id);
      setSettings(data);
      setTheme(data.theme);
      setPreferredLanguage(data.preferredLanguage);
      setProfileBio(data.profileBio || "");
    } catch (err) {
      console.error(err);
      setError("Falha ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await api.updateSettings(user.id, {
        theme,
        preferredLanguage,
        profileBio
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-[#1c1c1c] border border-[#404040] rounded-sm w-full max-w-lg p-6 relative z-10 shadow-2xl">
        <div className="flex items-center justify-between mb-6 border-b border-[#404040] pb-4">
          <h3 className="text-base font-semibold text-[#f1f1f1] uppercase tracking-wider flex items-center gap-2">
            <span className="material-icons text-[#aaaaaa]">settings</span>
            Configurações da Conta
          </h3>
          <button onClick={onClose} className="text-[#aaaaaa] hover:text-[#f1f1f1] transition-colors">
            <span className="material-icons">close</span>
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <span className="material-icons animate-sync-spin text-[#ff5045]">sync</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#aaaaaa] mb-1.5">
                  Tema da Interface
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 px-3 focus:outline-none focus:border-[#ff5045] text-sm"
                >
                  <option value="dark">Escuro (YouTube)</option>
                  <option value="light">Claro (Estudo)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#aaaaaa] mb-1.5">
                  Idioma Preferido
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 px-3 focus:outline-none focus:border-[#ff5045] text-sm"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (USA)</option>
                </select>
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

            {error && <p className="text-red-500 text-[10px] uppercase font-bold tracking-wider">{error}</p>}
            {success && <p className="text-green-500 text-[10px] uppercase font-bold tracking-wider">Configurações salvas!</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#404040]">
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
