import React, { useState, useEffect } from "react";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import ChannelView from "./components/ChannelView";
import VideoIdeaWorkspace from "./components/VideoIdeaWorkspace";
import SalesPage from "./components/SalesPage";
import { User, Channel, VideoIdea } from "./types";
import { api, setUnauthorizedHandler } from "./api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<VideoIdea | null>(null);
  const [selectedIdeaTab, setSelectedIdeaTab] = useState<"overview" | "description" | "simulator" | "references" | "notes" | "script" | "teleprompter">("overview");
  const [authMode, setAuthMode] = useState<"landing" | "login" | "signup">("landing");

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("creator_theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("creator_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem("creator_auth_token");
      setUser(null);
      setSelectedChannel(null);
      setSelectedIdea(null);
      setAuthMode("landing");
    });

    checkActiveSession();
    return () => setUnauthorizedHandler(null);
  }, []);

  const checkActiveSession = async () => {
    const token = localStorage.getItem("creator_auth_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const resp = await api.getMe();
      setUser(resp);
    } catch (err) {
      console.warn("Sessão inválida, limpando credenciais...", err);
      localStorage.removeItem("creator_auth_token");
      setUser(null);
      setSelectedChannel(null);
      setSelectedIdea(null);
      setAuthMode("landing");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (token: string, signedUser: User) => {
    localStorage.setItem("creator_auth_token", token);
    setUser(signedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("creator_auth_token");
    setUser(null);
    setSelectedChannel(null);
    setSelectedIdea(null);
    setAuthMode("landing");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center gap-4 text-slate-100">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
        <p className="text-sm font-mono text-slate-400">Restaurando sua sessão segura...</p>
      </div>
    );
  }

  // Render Login flow if unauthenticated
  if (!user) {
    if (authMode === "landing") {
      return (
        <SalesPage
          onLogin={() => setAuthMode("login")}
          onSignup={() => setAuthMode("signup")}
        />
      );
    }

    return (
      <AuthScreen
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
        onBack={() => setAuthMode("landing")}
      />
    );
  }

  // Inside Workspace edit view
  if (selectedIdea) {
    return (
      <VideoIdeaWorkspace
        idea={selectedIdea}
        user={user}
        channel={selectedChannel}
        onBack={() => setSelectedIdea(null)}
        onIdeaUpdated={(updated) => setSelectedIdea(updated)}
        onGoToDashboard={() => {
          setSelectedIdea(null);
          setSelectedChannel(null);
        }}
        onLogout={handleLogout}
        initialTab={selectedIdeaTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // Inside Channel ideas list view
  if (selectedChannel) {
    return (
      <ChannelView
        channel={selectedChannel}
        user={user}
        onBack={() => setSelectedChannel(null)}
        onSelectIdea={(idea, initialTab) => {
          setSelectedIdeaTab(initialTab || "overview");
          setSelectedIdea(idea);
        }}
        onChannelUpdated={(channel) => setSelectedChannel(channel)}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // Default: Dashboard lists of channels
  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      onSelectChannel={(channel) => setSelectedChannel(channel)}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}
