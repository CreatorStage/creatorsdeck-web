import React, { useState, useEffect } from "react";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import ChannelView from "./components/ChannelView";
import VideoIdeaWorkspace from "./components/VideoIdeaWorkspace";
import LandingPage from "./components/LandingPage";
import { User, Channel, VideoIdea, WorkspaceTab } from "./types";
import { api, setUnauthorizedHandler } from "./api";

import { useTranslation } from "react-i18next";

export default function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(() => {
    const saved = localStorage.getItem("creator_selected_channel");
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedIdea, setSelectedIdea] = useState<VideoIdea | null>(() => {
    const saved = localStorage.getItem("creator_selected_idea");
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedIdeaTab, setSelectedIdeaTab] = useState<WorkspaceTab>(() => {
    return (localStorage.getItem("creator_selected_idea_tab") as WorkspaceTab) || "overview";
  });
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
    if (selectedChannel) localStorage.setItem("creator_selected_channel", JSON.stringify(selectedChannel));
    else localStorage.removeItem("creator_selected_channel");
  }, [selectedChannel]);

  useEffect(() => {
    if (selectedIdea) localStorage.setItem("creator_selected_idea", JSON.stringify(selectedIdea));
    else localStorage.removeItem("creator_selected_idea");
  }, [selectedIdea]);

  useEffect(() => {
    if (selectedIdeaTab) localStorage.setItem("creator_selected_idea_tab", selectedIdeaTab);
    else localStorage.removeItem("creator_selected_idea_tab");
  }, [selectedIdeaTab]);

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
        <p className="text-sm font-mono text-slate-400">{t('app.restoring_session')}</p>
      </div>
    );
  }

  // Render Login flow if unauthenticated
  if (!user) {
    if (authMode === "landing") {
      return (
        <LandingPage
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
        onTabChange={(tab) => setSelectedIdeaTab(tab)}
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
      onSelectIdeaDirectly={(channel, idea) => {
        setSelectedChannel(channel);
        setSelectedIdea(idea);
      }}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}
