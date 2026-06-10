import React, { useState } from "react";
import { api, ValidationError } from "../api";
import { User } from "../types";

interface AuthScreenProps {
  onSuccess: (token: string, user: User) => void;
  initialMode?: "login" | "signup";
  onBack?: () => void;
}

export default function AuthScreen({ onSuccess, initialMode = "login", onBack }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [username, setUsername] = useState("rodrigmatheus19");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    // Active client-side validations
    const errors: Record<string, string> = {};
    if (!isLogin) {
      if (!name || name.trim().length < 2) {
        errors.name = "O nome deve ter no mínimo 2 letras.";
      }
      if (!username || username.trim().length < 3) {
        errors.username = "O usuário deve ter no mínimo 3 caracteres.";
      }
      if (!password || password.length < 6) {
        errors.password = "A senha deve ter no mínimo 6 caracteres.";
      }
    } else {
      if (!username || !username.trim()) {
        errors.username = "O usuário não pode ser em branco.";
      }
      if (!password || !password.trim()) {
        errors.password = "A senha não pode ser em branco.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const data = await api.login(username, password);
        onSuccess(data.token, data.user);
      } else {
        const data = await api.register(name, username, password);
        onSuccess(data.token, data.user);
      }
    } catch (err: any) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.errors);
      } else {
        setError(err.message || "Ocorreu um erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername("rodrigmatheus19");
    setPassword("password123");
    setIsLogin(true);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#aaaaaa] hover:text-[#f1f1f1]"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Voltar para a página
          </button>
        )}

        <div className="flex justify-center items-center gap-2">
          {/* Logo YouTube Studio Style */}
          <span className="material-icons text-[#ff5045] text-4xl">subscriptions</span>
          <span className="text-xl font-bold uppercase tracking-wider text-[#f1f1f1]" style={{ fontStyle: 'normal' }}>
            Creators<span className="text-[#ff5045]">Deck</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-xl font-semibold text-[#f1f1f1]">
          {isLogin ? "Fazer login no CreatorsDeck" : "Criar sua conta de criador"}
        </h2>
        <p className="mt-2 text-center text-sm text-[#aaaaaa]">
          {isLogin ? "Gerencie seus canais e roteiros em um só lugar" : "Inicie sua jornada integrada hoje"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#1c1c1c] border border-[#404040] p-6 sm:p-10 rounded shadow-2xl">
          
          {error && (
            <div className="mb-4 bg-red-950/40 border border-[#ff5045]/30 text-red-200 p-3 rounded flex items-start gap-2 text-xs">
              <span className="material-icons text-[#ff5045] text-sm shrink-0">error_outline</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-2">
                  Qual seu Nome / Pseudônimo?
                </label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-2 text-[#717171] text-lg">person</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: "" }));
                    }}
                    placeholder="ex: Matheus Rodrigues"
                    className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 pl-10 pr-3 focus:outline-none focus:border-[#ff5045] text-sm transition-colors"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-[#ff5045] font-sans">{fieldErrors.name}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-2">
                Nome de Usuário
              </label>
              <div className="relative">
                <span className="material-icons absolute left-3 top-2 text-[#717171] text-lg">person_outline</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: "" }));
                  }}
                  placeholder="seu_usuario"
                  className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 pl-10 pr-3 focus:outline-none focus:border-[#ff5045] text-sm transition-colors"
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-xs text-[#ff5045] font-sans">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-2">
                Sua Senha
              </label>
              <div className="relative">
                <span className="material-icons absolute left-3 top-2 text-[#717171] text-lg">lock_outline</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
                  }}
                  placeholder="••••••••"
                  className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 pl-10 pr-3 focus:outline-none focus:border-[#ff5045] text-sm transition-colors"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-[#ff5045] font-sans">{fieldErrors.password}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 bg-[#ff5045] hover:bg-[#e0453b] text-white font-medium text-xs uppercase tracking-wider py-2.5 px-4 rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                {loading ? (
                  <>
                    <span className="material-icons animate-sync-spin text-sm">sync</span>
                    <span>Aguarde...</span>
                  </>
                ) : isLogin ? (
                  <>
                    <span className="material-icons text-sm">login</span>
                    <span>Acessar Painel</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons text-sm">person_add</span>
                    <span>Criar Minha Conta</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-[#404040] pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-xs text-[#ff5045] hover:underline"
            >
              {isLogin ? "Não possui conta? Cadastre-se" : "Já possui conta? Fazer login"}
            </button>
          </div>

          {/* Quick Demo Assist Box styled as standard Creator Card */}
          <div className="mt-6 bg-[#252525] border border-[#404040] p-4 rounded-sm">
            <h4 className="text-xs font-semibold text-[#f1f1f1] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <span className="material-icons text-[#ff5045] text-sm">lightbulb_outline</span>
              Acesso Demonstrativo Rápido
            </h4>
            <p className="text-xs text-[#aaaaaa] leading-relaxed">
              Clique no botão abaixo para preencher automaticamente as credenciais já configuradas de teste.
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="mt-3 w-full bg-transparent hover:bg-white/5 text-[#f1f1f1] border border-[#404040] text-xs font-medium uppercase tracking-wider py-2 rounded-sm transition-colors"
            >
              Usar Conta de Teste
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
