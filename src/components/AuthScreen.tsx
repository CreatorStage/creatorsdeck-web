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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      if (!username || username.trim().length < 3) {
        errors.username = "O usuário deve ter no mínimo 3 caracteres.";
      }
      if (!password || password.length < 6) {
        errors.password = "A senha deve ter no mínimo 6 caracteres.";
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = "As senhas não coincidem.";
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
        const data = await api.register(username, password);
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
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
                  }}
                  placeholder="••••••••"
                  className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 pl-10 pr-10 focus:outline-none focus:border-[#ff5045] text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-[#717171] hover:text-[#f1f1f1] transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  <span className="material-icons text-lg">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-[#ff5045] font-sans">{fieldErrors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-2 text-[#717171] text-lg">lock_outline</span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                    }}
                    placeholder="••••••••"
                    className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 pl-10 pr-10 focus:outline-none focus:border-[#ff5045] text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2 text-[#717171] hover:text-[#f1f1f1] transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    <span className="material-icons text-lg">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-[#ff5045] font-sans">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}

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



        </div>
      </div>
    </div>
  );
}
