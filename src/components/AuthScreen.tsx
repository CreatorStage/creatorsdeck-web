import React, { useState, useEffect } from "react";
import { api, ValidationError } from "../api";
import { User } from "../types";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./shared/LanguageSwitcher";

interface AuthScreenProps {
  onSuccess: (token: string, user: User) => void;
  initialMode?: "login" | "signup";
  onBack?: () => void;
}

export default function AuthScreen({ onSuccess, initialMode = "login", onBack }: AuthScreenProps) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("remembered_username");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    // Active client-side validations
    const errors: Record<string, string> = {};
    if (!isLogin) {
      if (!username || username.trim().length < 3) {
        errors.username = t('auth.err_user_len');
      }
      if (!password || password.length < 6) {
        errors.password = t('auth.err_pass_len');
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = t('auth.err_pass_match');
      }
    } else {
      if (!username || !username.trim()) {
        errors.username = t('auth.err_user_blank');
      }
      if (!password || !password.trim()) {
        errors.password = t('auth.err_pass_blank');
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
        if (rememberMe) {
          localStorage.setItem("remembered_username", username);
        } else {
          localStorage.removeItem("remembered_username");
        }
        onSuccess(data.token, data.user);
      } else {
        const data = await api.register(username, password);
        if (rememberMe) {
          localStorage.setItem("remembered_username", username);
        } else {
          localStorage.removeItem("remembered_username");
        }
        onSuccess(data.token, data.user);
      }
    } catch (err: any) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.errors);
      } else {
        setError(err.message || t('auth.err_unexpected'));
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#aaaaaa] hover:text-[#f1f1f1]"
          >
            <span className="material-icons text-sm">arrow_back</span>
            {t('common.back')}
          </button>
        )}

        <div className="flex justify-center items-center gap-3">
          <img src="./apple-touch-icon.png" alt="CreatorsDeck Logo" className="w-12 h-12 object-contain rounded-xl shadow-lg shadow-[#ff5045]/20" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-2xl font-bold uppercase tracking-widest text-[#f1f1f1]">
              Creators
            </span>
            <span className="text-2xl font-bold uppercase tracking-widest text-[#ff5045]">
              Deck
            </span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-xl font-semibold text-[#f1f1f1]">
          {isLogin ? t('auth.login_title') : t('auth.signup_title')}
        </h2>
        <p className="mt-2 text-center text-sm text-[#aaaaaa]">
          {isLogin ? t('auth.subtitle_login') : t('auth.subtitle_signup')}
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
                {t('auth.username')}
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
                {t('auth.password')}
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
                  {t('auth.confirm_password')}
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

            <div className="flex items-center pb-1 select-none">
              <label className="flex items-center text-xs text-[#aaaaaa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 rounded border-[#404040] bg-[#0f0f0f] text-[#ff5045] focus:ring-0 focus:ring-offset-0 focus:outline-none w-4 h-4 cursor-pointer accent-[#ff5045]"
                />
                Lembrar do meu usuário
              </label>
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
                    <span>{t('common.loading')}</span>
                  </>
                ) : isLogin ? (
                  <>
                    <span className="material-icons text-sm">login</span>
                    <span>{t('auth.btn_login')}</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons text-sm">person_add</span>
                    <span>{t('auth.btn_signup')}</span>
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
              {isLogin ? t('auth.switch_to_signup') : t('auth.switch_to_login')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
