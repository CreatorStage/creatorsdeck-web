import React, { useEffect, useMemo, useState } from "react";
import { Channel, ChannelReferenceLink, ChecklistState, ChecklistStateEntry, VideoIdea, VideoIdeaStatus, User, SuggestedVideo, WorkspaceTab } from "../types";
import { api, ValidationError } from "../api";
import ChannelGoals from "./ChannelGoals";
import StudioSidebar from "./shared/StudioSidebar";
import ChecklistDialog from "./channel/ChecklistDialog";

interface ChannelViewProps {
  channel: Channel;
  onBack: () => void;
  onSelectIdea: (idea: VideoIdea, initialTab?: WorkspaceTab) => void;
  onChannelUpdated?: (channel: Channel) => void;
  user?: User | null;
  onLogout?: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const STATUS_LABELS: Record<VideoIdeaStatus, { label: string; badgeClass: string }> = {
  IDEA: { label: "Ideia", badgeClass: "badge-idea" },
  RESEARCHING: { label: "Pesquisando", badgeClass: "badge-progress" },
  SCRIPTING: { label: "Roteirizando", badgeClass: "badge-scripted" },
  READY_TO_RECORD: { label: "Pronto p/ Gravar", badgeClass: "badge-scripted" },
  RECORDED: { label: "Gravado", badgeClass: "badge-recorded" },
  EDITING: { label: "Editando", badgeClass: "badge-progress" },
  SCHEDULED: { label: "Agendado", badgeClass: "badge-recorded" },
  PUBLISHED: { label: "Publicado", badgeClass: "badge-published" },
  ARCHIVED: { label: "Arquivado", badgeClass: "badge-archived" }
};

const KANBAN_COLUMNS: { key: VideoIdeaStatus; label: string; icon: string }[] = [
  { key: "IDEA", label: "Ideias", icon: "lightbulb_outline" },
  { key: "RESEARCHING", label: "Pesquisando", icon: "search" },
  { key: "SCRIPTING", label: "Roteirizando", icon: "format_list_bulleted" },
  { key: "READY_TO_RECORD", label: "Pronto p/ Gravar", icon: "radio_button_unchecked" },
  { key: "RECORDED", label: "Gravado", icon: "smart_display" },
  { key: "EDITING", label: "Editando", icon: "movie_edit" },
  { key: "SCHEDULED", label: "Agendado", icon: "calendar_today" },
  { key: "PUBLISHED", label: "Publicado", icon: "check_circle_outline" }
];

const SIDEBAR_NAV_ITEMS: { key: "list" | "kanban" | "goals" | "references" | "thumbnails" | "titles" | "settings" | "suggestions"; label: string; icon: string }[] = [
  { key: "list", label: "Lista", icon: "view_list" },
  { key: "kanban", label: "Kanban", icon: "view_kanban" },
  { key: "goals", label: "Metas", icon: "flag" },
  { key: "suggestions", label: "Sugestões", icon: "auto_awesome" },
  { key: "references", label: "Canais", icon: "link" },
  { key: "thumbnails", label: "Thumbnails", icon: "image" },
  { key: "titles", label: "Títulos", icon: "title" },
  { key: "settings", label: "Configurações", icon: "settings" }
];

const parseChecklistTemplates = (raw?: string): Record<VideoIdeaStatus, string[]> => {
  if (!raw) {
    return {} as Record<VideoIdeaStatus, string[]>;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce((accumulator, [status, items]) => {
        if (Array.isArray(items)) {
          accumulator[status as VideoIdeaStatus] = items.map((item) => String(item)).filter(Boolean);
        }
        return accumulator;
      }, {} as Record<VideoIdeaStatus, string[]>);
    }
  } catch {
    // fallback vazio
  }

  return {} as Record<VideoIdeaStatus, string[]>;
};

const parseChecklistState = (raw?: string): ChecklistState => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ChecklistState;
    }
  } catch {
    // fallback vazio
  }

  return {};
};

export default function ChannelView({ channel, onBack, onSelectIdea, onChannelUpdated, user, onLogout, theme, toggleTheme }: ChannelViewProps) {
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(true);
  type ChannelViewTab = "list" | "kanban" | "goals" | "references" | "thumbnails" | "titles" | "settings" | "suggestions";
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | VideoIdeaStatus>("ALL");
  const [viewMode, setViewMode] = useState<ChannelViewTab>(() => {
    const saved = localStorage.getItem("creator_selected_channel_tab");
    return (saved as ChannelViewTab) || "list";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [mainTitle, setMainTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [channelDraft, setChannelDraft] = useState(channel);
  const [savingChannel, setSavingChannel] = useState(false);
  const [channelReferences, setChannelReferences] = useState<ChannelReferenceLink[]>([]);
  const [referenceTitle, setReferenceTitle] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [checklistDraft, setChecklistDraft] = useState<Record<VideoIdeaStatus, string[]>>(() => parseChecklistTemplates(channel.checklistTemplates));
  const [checklistInputs, setChecklistInputs] = useState<Partial<Record<VideoIdeaStatus, string>>>({});
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [pendingChecklistIdeaId, setPendingChecklistIdeaId] = useState<string | null>(null);
  const [pendingChecklistStatus, setPendingChecklistStatus] = useState<VideoIdeaStatus | null>(null);

  const [suggestions, setSuggestions] = useState<SuggestedVideo[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [channelStatus, setChannelStatus] = useState<{ referenceId: string; title: string; url: string; thumbnailUrl?: string; scraped: boolean }[]>([]);
  const [showChannelStatusPanel, setShowChannelStatusPanel] = useState(false);
  const [suggestionFilterChannel, setSuggestionFilterChannel] = useState("");
  const [suggestionMinViews, setSuggestionMinViews] = useState("");
  const [suggestionSort, setSuggestionSort] = useState<"views" | "default">("views");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Converte string de views (ex: "269K", "2.3 mi") para número para comparação
  const parseViewCount = (views?: string): number => {
    if (!views) return 0;
    const v = views.toLowerCase().replace(/[\s.]/g, "").replace(",", ".");
    if (v.includes("bi") || v.includes("b")) return parseFloat(v) * 1_000_000_000;
    if (v.includes("mi") || v.includes("m")) return parseFloat(v) * 1_000_000;
    if (v.includes("k")) return parseFloat(v) * 1_000;
    return parseFloat(v) || 0;
  };

  const filteredSuggestions = useMemo(() => {
    let result = [...suggestions];
    if (suggestionFilterChannel) {
      result = result.filter(v => v.sourceChannelName === suggestionFilterChannel);
    }
    if (suggestionMinViews) {
      const min = parseInt(suggestionMinViews, 10);
      result = result.filter(v => parseViewCount(v.views) >= min);
    }
    if (suggestionSort === "views") {
      result.sort((a, b) => parseViewCount(b.views) - parseViewCount(a.views));
    }
    return result;
  }, [suggestions, suggestionFilterChannel, suggestionMinViews, suggestionSort]);

  // Salva viewMode no localStorage ao mudar
  useEffect(() => {
    localStorage.setItem("creator_selected_channel_tab", viewMode);
  }, [viewMode]);

  // Busca detalhes atualizados do canal no mount
  useEffect(() => {
    const fetchLatestChannelDetails = async () => {
      try {
        const latestChannel = await api.getChannel(channel.id);
        setChannelDraft(latestChannel);
        onChannelUpdated?.(latestChannel);
      } catch (err) {
        console.error("Erro ao buscar dados atualizados do canal", err);
      }
    };
    fetchLatestChannelDetails();
  }, [channel.id]);

  // Busca dados dinamicamente ao trocar de aba (página)
  useEffect(() => {
    if (viewMode === "list" || viewMode === "kanban") {
      fetchIdeas();
    } else if (viewMode === "references" || viewMode === "thumbnails" || viewMode === "titles") {
      fetchChannelReferences();
    } else if (viewMode === "suggestions") {
      fetchSuggestions();
      fetchStatus();
    }
  }, [viewMode, channel.id]);

  const fetchStatus = async () => {
    try {
      const data = await api.getChannelSuggestionsStatus(channel.id);
      setChannelStatus(data);
    } catch (err) {
      console.error("Erro ao buscar status dos canais", err);
    }
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await api.getChannelSuggestions(channel.id);
      const cleaned = data.map(v => ({
        ...v,
        sourceChannelName: v.sourceChannelName ? v.sourceChannelName.replace(/^\[Canal\]\s*/i, '') : ''
      }));
      setSuggestions(cleaned);
    } catch (err) {
      console.error("Erro ao buscar sugestões", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const syncAndFetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const result = await api.syncChannelSuggestions(channel.id);
      console.log(`Sync iniciado: ${result.queued} canais enfileirados`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      const data = await api.getChannelSuggestions(channel.id);
      const cleaned = data.map(v => ({
        ...v,
        sourceChannelName: v.sourceChannelName ? v.sourceChannelName.replace(/^\[Canal\]\s*/i, '') : ''
      }));
      setSuggestions(cleaned);
      const status = await api.getChannelSuggestionsStatus(channel.id);
      setChannelStatus(status);
    } catch (err) {
      console.error("Erro ao sincronizar sugestões", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleCreateIdeaFromSuggestion = async (suggestion: SuggestedVideo) => {
    try {
      const created = await api.createIdea(
        channel.id, 
        suggestion.title, 
        `Inspiração do canal: ${suggestion.sourceChannelName}\nURL: ${suggestion.url}\nVisualizações: ${suggestion.views}`, 
        ["sugestão"]
      );
      setIdeas([created, ...ideas]);
      setViewMode("list");
    } catch (err) {
      console.error("Erro ao criar ideia a partir de sugestão", err);
      alert("Erro ao criar ideia");
    }
  };

  const handleDeleteSuggestion = async (videoId: string) => {
    try {
      await api.deleteChannelSuggestion(channel.id, videoId);
      setSuggestions(prev => prev.filter(v => v.id !== videoId));
    } catch (err) {
      console.error("Erro ao deletar sugestão", err);
    }
  };

  useEffect(() => {
    setChannelDraft(channel);
    setChecklistDraft(parseChecklistTemplates(channel.checklistTemplates));
  }, [channel]);

  const fetchChannelReferences = async () => {
    try {
      setChannelReferences(await api.getChannelReferenceLinks(channel.id));
    } catch (err) {
      console.error("Erro ao buscar referências do canal", err);
      setChannelReferences([]);
    }
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setIdeas(await api.getIdeas(channel.id));
    } catch (err) {
      console.error("Erro ao buscar ideias", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredIdeas = useMemo(() => {
    const filtered = ideas.filter((idea) => {
      const matchesFilter = selectedFilter === "ALL" || idea.status === selectedFilter;
      return matchesFilter;
    });
    return [...filtered].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [ideas, selectedFilter]);

  const metrics = {
    total: ideas.length,
    scripted: ideas.filter((idea) => ["SCRIPTING", "READY_TO_RECORD", "RECORDED", "EDITING", "SCHEDULED", "PUBLISHED"].includes(idea.status)).length,
    publishedThisMonth: ideas.filter((idea) => {
      if (idea.status !== "PUBLISHED") return false;
      const dt = new Date(idea.updatedAt || idea.createdAt);
      const now = new Date();
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length
  };

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const errors: Record<string, string> = {};
    if (!mainTitle || !mainTitle.trim()) {
      errors.mainTitle = "O título principal é obrigatório.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const tags = tagInput.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    setSaving(true);

    try {
      const created = await api.createIdea(channel.id, mainTitle.trim(), description.trim(), tags, deadline || undefined);
      setIdeas([created, ...ideas]);
      setShowModal(false);
      setMainTitle("");
      setDescription("");
      setTagInput("");
      setDeadline("");
    } catch (err: any) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.errors);
      } else {
        setError(err.message || "Erro ao criar ideia");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveIdea = async (ideaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.updateIdea(ideaId, { status: "ARCHIVED" });
    setIdeas((current) => current.map((idea) => idea.id === ideaId ? { ...idea, status: "ARCHIVED" } : idea));
  };

  const handleSaveChannelSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingChannel(true);
    try {
      const updated = await api.updateChannel(channel.id, {
        ...channelDraft,
        checklistTemplates: JSON.stringify(checklistDraft)
      });
      setChannelDraft(updated);
      setChecklistDraft(parseChecklistTemplates(updated.checklistTemplates));
      onChannelUpdated?.(updated);
    } finally {
      setSavingChannel(false);
    }
  };

  const getChecklistItemsForStatus = (status: VideoIdeaStatus) => checklistDraft[status] || [];

  const updateChecklistItems = (status: VideoIdeaStatus, items: string[]) => {
    setChecklistDraft((current) => ({
      ...current,
      [status]: items
    }));
  };

  const handleChecklistItemAdd = (status: VideoIdeaStatus) => {
    const input = (checklistInputs[status] || "").trim();
    if (!input) {
      return;
    }

    const currentItems = getChecklistItemsForStatus(status);
    if (!currentItems.includes(input)) {
      updateChecklistItems(status, [...currentItems, input]);
    }
    setChecklistInputs((current) => ({ ...current, [status]: "" }));
  };

  const handleChecklistItemRemove = (status: VideoIdeaStatus, itemToRemove: string) => {
    updateChecklistItems(status, getChecklistItemsForStatus(status).filter((item) => item !== itemToRemove));
  };

  const commitIdeaMove = async (ideaId: string, status: VideoIdeaStatus, checklistStateEntry?: ChecklistStateEntry) => {
    const previous = ideas;
    const existingIdea = ideas.find((item) => item.id === ideaId);
    const existingChecklistState = parseChecklistState(existingIdea?.checklistState);
    const nextChecklistState = checklistStateEntry
      ? { ...existingChecklistState, [status]: checklistStateEntry }
      : existingChecklistState;

    setIdeas((current) => current.map((idea) => idea.id === ideaId ? { ...idea, status, checklistState: checklistStateEntry ? JSON.stringify(nextChecklistState) : idea.checklistState } : idea));

    try {
      const updated = await api.updateIdea(ideaId, {
        status,
        ...(checklistStateEntry ? { checklistState: JSON.stringify(nextChecklistState) } : {})
      });
      setIdeas((current) => current.map((idea) => idea.id === ideaId ? updated : idea));
    } catch (err) {
      console.error(err);
      setIdeas(previous);
    } finally {
      setChecklistDialogOpen(false);
      setPendingChecklistIdeaId(null);
      setPendingChecklistStatus(null);
    }
  };

  const handleAddChannelReference = async (e: React.FormEvent) => {
    e.preventDefault();
    setReferenceError(null);

    if (!referenceTitle.trim() || !referenceUrl.trim()) {
      setReferenceError("Informe um título e um link válido.");
      return;
    }

    let normalizedUrl = referenceUrl.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      // valida URL
      new URL(normalizedUrl);
    } catch {
      setReferenceError("O link informado não é válido.");
      return;
    }

    const ytMatch = normalizedUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
    const videoId = ytMatch ? ytMatch[1] : null;
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined;

    const nextReference: ChannelReferenceLink = {
      title: referenceTitle.trim(),
      url: normalizedUrl,
      note: referenceNote.trim(),
      id: "",
      channelId: channel.id,
      thumbnailUrl: thumbnail,
      createdAt: new Date().toISOString(),
    };

    try {
      const added = await api.addChannelReferenceLink(channel.id, nextReference.title, nextReference.url, nextReference.note || "", nextReference.thumbnailUrl);
      setChannelReferences((current) => [added, ...current]);
      setReferenceTitle("");
      setReferenceUrl("");
      setReferenceNote("");
    } catch (err: any) {
      setReferenceError(err.message || "Erro ao salvar referência.");
    }
  };

  const handleRemoveChannelReference = async (referenceId: string) => {
    try {
      await api.deleteChannelReferenceLink(referenceId);
      setChannelReferences((current) => current.filter((reference) => reference.id !== referenceId));
    } catch (err) {
      console.error("Erro ao remover referência", err);
    }
  };

  const handleDragStart = (e: React.DragEvent, ideaId: string) => {
    e.dataTransfer.setData("ideaId", ideaId);
  };

  const handleDrop = async (e: React.DragEvent, status: VideoIdeaStatus) => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData("ideaId");
    const items = getChecklistItemsForStatus(status);

    if (items.length > 0) {
      setPendingChecklistIdeaId(ideaId);
      setPendingChecklistStatus(status);
      setChecklistDialogOpen(true);
      return;
    }

    await commitIdeaMove(ideaId, status);
  };

  const renderIdeaCard = (idea: VideoIdea) => {
    const statusMeta = STATUS_LABELS[idea.status] || STATUS_LABELS.IDEA;
    return (
      <article
        key={idea.id}
        onClick={() => onSelectIdea(idea)}
        draggable
        onDragStart={(e) => handleDragStart(e, idea.id)}
        className="yt-card p-5 cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`badge ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
              {idea.evergreen && <span className="studio-label text-[#66bb6a]">Evergreen</span>}
              {idea.trend && <span className="studio-label text-[#3ea6ff]">Tendência</span>}
              {idea.sponsored && <span className="studio-label text-[#ffb74d]">Patrocinado</span>}
            </div>
            <h3 className="text-xl font-bold text-yt-text-primary truncate group-hover:text-yt-red transition-colors">{idea.mainTitle}</h3>
            <p className="text-sm text-yt-text-secondary leading-6 mt-2 line-clamp-2">{idea.description || "Sem descrição configurada."}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {idea.status !== "ARCHIVED" && (
              <button onClick={(e) => handleArchiveIdea(idea.id, e)} className="p-2 text-yt-text-disabled hover:text-yt-text-primary bg-transparent border-0 cursor-pointer" title="Arquivar">
                <span className="material-icons">archive</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-yt-bg-overlay flex flex-wrap items-center gap-2">
          {(idea.tags || []).slice(0, 4).map((tag) => (
            <span key={tag} className="studio-label bg-yt-bg-primary border border-yt-bg-overlay px-2 py-1 text-yt-text-secondary">#{tag}</span>
          ))}
          {idea.publishedUrl && (
            <a href={idea.publishedUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="studio-label text-yt-red ml-auto">
              Link Publicado
            </a>
          )}
        </div>
      </article>
    );
  };

  const renderIdeaListItem = (idea: VideoIdea) => {
    const statusMeta = STATUS_LABELS[idea.status] || STATUS_LABELS.IDEA;
    const formattedDate = idea.createdAt
      ? new Date(idea.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "--/--/----";
    return (
      <article
        key={idea.id}
        onClick={() => onSelectIdea(idea)}
        draggable
        onDragStart={(e) => handleDragStart(e, idea.id)}
        className="yt-card p-4 md:py-3.5 md:px-6 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-yt-bg-elevated"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="hidden sm:flex w-10 h-10 rounded-sm bg-yt-bg-primary border border-yt-bg-overlay items-center justify-center text-yt-red shrink-0 font-sans">
            <span className="material-icons text-base">lightbulb_outline</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className={`badge ${statusMeta.badgeClass} text-[10px] px-2 py-0.5`}>{statusMeta.label}</span>
              {idea.evergreen && <span className="studio-label text-[#66bb6a] text-[10px] px-1 py-0">Evergreen</span>}
              {idea.trend && <span className="studio-label text-[#3ea6ff] text-[10px] px-1 py-0">Tendência</span>}
              {idea.sponsored && <span className="studio-label text-[#ffb74d] text-[10px] px-1 py-0">Patrocinado</span>}
              {(idea.tags || []).slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] text-yt-text-secondary bg-yt-bg-primary border border-yt-bg-overlay px-1.5 py-0 rounded-sm">#{tag}</span>
              ))}
            </div>
            <div className="flex flex-col xl:flex-row xl:items-baseline gap-1 xl:gap-3">
              <h3 className="text-base font-extrabold text-yt-text-primary group-hover:text-yt-red transition-colors">{idea.mainTitle}</h3>
              <p className="text-xs text-yt-text-secondary truncate max-w-xl font-sans">{idea.description || "Sem descrição configurada."}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 border-t border-yt-bg-overlay/30 md:border-0 pt-3 md:pt-0">
          <div className="flex flex-col items-start md:items-end font-sans">
            <span className="text-[10px] text-yt-text-disabled uppercase tracking-wider font-bold">Criado em</span>
            <span className="text-xs font-semibold text-yt-text-primary mt-0.5">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            {idea.publishedUrl && (
              <a href={idea.publishedUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 text-yt-red hover:text-yt-red-hover transition-colors flex items-center justify-center bg-transparent border-0 cursor-pointer" title="Ver Link Publicado">
                <span className="material-icons text-lg">open_in_new</span>
              </a>
            )}
            {idea.status !== "ARCHIVED" && (
              <button onClick={(e) => handleArchiveIdea(idea.id, e)} className="p-2 text-yt-text-disabled hover:text-yt-text-primary transition-colors flex items-center justify-center bg-transparent border-0 cursor-pointer" title="Arquivar">
                <span className="material-icons text-lg">archive</span>
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };


  return (
    <div className="studio-shell flex">
      {/* ─── SIDEBAR ─── */}
      <StudioSidebar
        className={`hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-[300px] bg-yt-bg-surface border-r border-yt-bg-overlay ${sidebarCollapsed ? "!w-[72px]" : ""}`}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        brandTitle="CreatorsDeck"
        brandSubtitle="Studio"
        brandCollapsedLabel="CS"
        topSection={
          sidebarCollapsed ? (
            <button
              onClick={() => setShowModal(true)}
              title="Nova Ideia"
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
              Nova Ideia
            </button>
          )
        }
        footerSection={
          <div className="space-y-2">
            <button
              onClick={onBack}
              className={`w-full text-left text-yt-text-secondary hover:text-yt-text-primary flex items-center gap-3 text-sm transition-colors bg-transparent border-0 cursor-pointer ${sidebarCollapsed ? "justify-center" : ""}`}
            >
              <span className="material-icons text-[18px]">arrow_back</span>
              {!sidebarCollapsed && <span className="font-medium">Voltar ao Início</span>}
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
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const isActive = viewMode === item.key;
          return (
            <button
              key={item.key}
              title={item.label}
              onClick={() => {
                setViewMode(item.key);
                if (item.key === "list" || item.key === "kanban") {
                  setSelectedFilter("ALL");
                }
              }}
              className={`w-full h-[50px] flex items-center gap-3.5 border-l-[3px] text-left transition-colors ${isActive
                  ? "bg-yt-bg-elevated border-yt-red text-yt-red"
                  : "border-transparent text-yt-text-secondary hover:bg-yt-bg-elevated hover:text-yt-text-primary"
                } ${sidebarCollapsed ? "justify-center px-0" : "px-7"}`}
            >
              <span className="material-icons text-[20px] shrink-0">{item.icon}</span>
              {!sidebarCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
            </button>
          );
        })}
      </StudioSidebar>

      <div className={`flex-1 min-w-0 transition-[margin] duration-200 ${sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[300px]"}`}>
        <header className="studio-topbar sticky top-0 z-30 flex items-center justify-between px-6 lg:px-12 bg-yt-bg-surface border-b border-yt-bg-overlay">
          <nav className="hidden md:flex items-center gap-8 text-xl text-yt-text-secondary">
            <button onClick={onBack} className="hover:text-yt-text-primary pb-3 bg-transparent border-0 cursor-pointer text-xl font-sans">Painel</button>
            <button className="text-yt-text-primary border-b-2 border-yt-red pb-3 bg-transparent border-0 text-xl font-sans">Banco de Ideias</button>
            <button className="opacity-50 cursor-not-allowed pb-3 bg-transparent border-0 text-xl font-sans" title="Selecione uma ideia para acessar a área de trabalho" disabled>Área de Trabalho</button>
          </nav>

          <div className="flex items-center gap-5 ml-auto">
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

        <main className="p-6 lg:p-12">
          {viewMode === "list" ? (
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-extrabold text-yt-text-primary">Ideias do canal</h3>
                  <span className="studio-label text-yt-text-secondary">{filteredIdeas.length} itens</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-yt-text-secondary font-sans">Filtrar por:</label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as "ALL" | VideoIdeaStatus)}
                    className="studio-input py-1.5 px-3 text-xs bg-yt-bg-surface border border-yt-bg-overlay rounded text-yt-text-primary focus:outline-none cursor-pointer font-sans"
                  >
                    <option value="ALL">Todas as etapas</option>
                    {Object.entries(STATUS_LABELS).map(([status, meta]) => (
                      <option key={status} value={status}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredIdeas.length === 0 ? (
                  <div className="yt-card p-8 text-center text-[#8a8a8a] font-sans">
                    Nenhuma ideia encontrada neste canal.
                  </div>
                ) : (
                  filteredIdeas.map((idea) => renderIdeaListItem(idea))
                )}
              </div>
            </section>
          ) : viewMode === "settings" ? (
            <section className="w-full min-h-[calc(100vh-220px)] p-7 lg:p-8 flex flex-col">
              <div className="flex flex-col gap-2 mb-8">
                <p className="studio-label text-yt-red">Configurações do canal</p>
                <h3 className="text-3xl font-extrabold text-yt-text-primary">Ajuste o posicionamento do seu canal</h3>
                <p className="text-sm text-yt-text-secondary max-w-2xl font-sans">
                  Edite o nicho e os blocos reutilizáveis sem sair da ChannelView.
                </p>
              </div>

              <form onSubmit={handleSaveChannelSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
                <div className="space-y-5 lg:col-span-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">Nome do canal</label>
                    <input value={channelDraft.name || ""} onChange={(e) => setChannelDraft({ ...channelDraft, name: e.target.value })} className="studio-input w-full p-3" placeholder="Nome do canal" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">Nicho</label>
                    <input value={channelDraft.niche || ""} onChange={(e) => setChannelDraft({ ...channelDraft, niche: e.target.value })} className="studio-input w-full p-3" placeholder="Ex.: tecnologia, educação, finanças" />
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">CTAs reutilizáveis</label>
                  <textarea rows={5} value={(channelDraft.ctaTemplates || []).join("\n")} onChange={(e) => setChannelDraft({ ...channelDraft, ctaTemplates: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })} className="studio-input w-full p-3" placeholder="Um CTA por linha" />
                </div>

                <div className="lg:col-span-2 space-y-5 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="material-icons text-yt-red text-lg">checklist</span>
                    <div>
                      <h4 className="text-lg font-bold text-yt-text-primary">Checklists de Produção</h4>
                      <p className="text-sm text-yt-text-secondary font-sans">Configure os itens obrigatórios por status. O popup aparece quando uma ideia é movida no Kanban.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {KANBAN_COLUMNS.map((column) => {
                      const items = getChecklistItemsForStatus(column.key);
                      const currentInput = checklistInputs[column.key] || "";

                      return (
                        <article key={column.key} className="rounded-[8px] border border-yt-bg-overlay bg-yt-bg-primary p-4 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-icons text-yt-red text-[18px]">{column.icon}</span>
                              <h5 className="text-sm font-extrabold uppercase tracking-wider text-yt-text-primary truncate">{column.label}</h5>
                            </div>
                            <span className="studio-label text-yt-text-secondary">{items.length}</span>
                          </div>

                          <div className="space-y-2">
                            {items.length === 0 ? (
                              <div className="rounded-[6px] border border-dashed border-yt-bg-overlay bg-white/[0.02] px-4 py-5 text-center text-xs text-yt-text-disabled font-sans">
                                Nenhum item configurado.
                              </div>
                            ) : (
                              items.map((item) => (
                                <div key={item} className="flex items-start justify-between gap-3 rounded-[6px] border border-yt-bg-overlay bg-yt-bg-surface px-3 py-2">
                                  <span className="text-sm text-yt-text-primary leading-6">{item}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleChecklistItemRemove(column.key, item)}
                                    className="p-1 bg-transparent border-0 text-yt-text-secondary hover:text-yt-red cursor-pointer shrink-0"
                                    title="Remover item"
                                  >
                                    <span className="material-icons text-sm">delete</span>
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              value={currentInput}
                              onChange={(e) => setChecklistInputs((current) => ({ ...current, [column.key]: e.target.value }))}
                              className="studio-input flex-1 p-3 text-sm"
                              placeholder="Novo item"
                            />
                            <button type="button" onClick={() => handleChecklistItemAdd(column.key)} className="yt-btn-secondary shrink-0">
                              <span className="material-icons text-sm">add</span>
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-2 flex justify-end gap-3 pt-2">
                  <button type="submit" disabled={savingChannel} className="yt-btn-primary">{savingChannel ? "Salvando..." : "Salvar alterações"}</button>
                </div>
              </form>
            </section>
          ) : viewMode === "references" ? (
            <section className="w-full min-h-[calc(100vh-220px)] p-7 lg:p-8 space-y-8 flex flex-col">
              <div className="flex flex-col gap-2">
                <p className="studio-label text-yt-red">Canais de referência</p>
                <h3 className="text-3xl font-extrabold text-yt-text-primary">Salve links para buscar ideias</h3>
                <p className="text-sm text-yt-text-secondary max-w-2xl font-sans">Guarde canais, playlists, vídeos ou páginas que sirvam de inspiração para este canal.</p>
              </div>

              <form onSubmit={handleAddChannelReference} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.6fr] gap-4 flex-none">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">Nome da referência</label>
                  <input value={referenceTitle} onChange={(e) => setReferenceTitle(e.target.value)} className="studio-input w-full p-3" placeholder="Ex.: Canal Tech Vision" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">Link</label>
                  <input value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} className="studio-input w-full p-3" placeholder="https://www.youtube.com/@..." />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">Observação opcional</label>
                  <textarea rows={3} value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} className="studio-input w-full p-3" placeholder="O que observar neste canal?" />
                </div>

                {referenceError && (
                  <div className="lg:col-span-2 border border-yt-red/40 bg-yt-red/10 text-yt-text-primary p-3 text-sm">{referenceError}</div>
                )}

                <div className="lg:col-span-2 flex justify-end">
                  <button type="submit" className="yt-btn-primary flex items-center gap-2"><span className="material-icons text-sm">add_link</span>Salvar referência</button>
                </div>
              </form>

              <div className="space-y-3 flex-1">
                {channelReferences.filter(r => !r.type || r.type === 'LINK').length === 0 ? (
                  <div className="border border-dashed border-yt-bg-overlay/60 rounded-[12px] bg-white/[0.01] px-6 py-10 text-center">
                    <span className="material-icons text-4xl text-yt-text-disabled mb-4">link</span>
                    <h4 className="text-lg font-bold text-yt-text-primary mb-2">Nenhuma referência salva</h4>
                    <p className="text-sm text-yt-text-secondary font-sans">Adicione canais ou links para consultar quando estiver buscando ideias.</p>
                  </div>
                ) : (
                  channelReferences.filter(r => !r.type || r.type === 'LINK').map((reference) => {
                    const isChannel = reference.url.includes('youtube.com/@') || reference.url.includes('youtube.com/channel/') || reference.title.startsWith('[Canal]');

                    if (isChannel) {
                      let channelName = reference.title.replace(/^\[Canal\]\s*/i, '');
                      let handle = '';
                      const match = channelName.match(/(.*)\s+\((@.*?)\)$/);
                      if (match) {
                        channelName = match[1].trim();
                        handle = match[2].trim();
                      }

                      let subscribers = '';
                      let description = reference.note || '';
                      const lines = description.split('\n');
                      if (lines.length > 0 && lines[0].startsWith('Inscritos:')) {
                        subscribers = lines[0].replace('Inscritos:', '').trim();
                        description = lines.slice(1).join('\n').replace(/^Descrição:\s*/, '').trim();
                      }

                      return (
                        <article key={reference.id} className="flex items-center gap-4 py-5 border-b border-yt-bg-overlay/60 hover:bg-white/[0.02] transition-colors -mx-4 px-4 rounded-lg">
                          {reference.thumbnailUrl ? (
                            <a href={reference.url} target="_blank" rel="noreferrer" className="shrink-0">
                              <img
                                src={reference.thumbnailUrl}
                                alt={channelName}
                                className="w-[120px] h-[120px] sm:w-[136px] sm:h-[136px] rounded-full object-cover border border-yt-bg-overlay bg-black"
                              />
                            </a>
                          ) : (
                            <a href={reference.url} target="_blank" rel="noreferrer" className="shrink-0">
                              <div className="w-[120px] h-[120px] sm:w-[136px] sm:h-[136px] rounded-full bg-yt-bg-elevated border border-yt-bg-overlay flex items-center justify-center text-5xl font-bold text-yt-text-primary">
                                {channelName.charAt(0).toUpperCase()}
                              </div>
                            </a>
                          )}
                          <div className="flex-1 min-w-0 py-2">
                            <a href={reference.url} target="_blank" rel="noreferrer" className="text-yt-text-primary hover:text-yt-text-primary text-xl font-medium block truncate font-sans">
                              {channelName}
                              {handle && <span className="material-icons text-sm text-yt-text-secondary ml-1" title="Canal Verificado">check_circle</span>}
                            </a>
                            <div className="text-yt-text-secondary text-sm flex items-center gap-1 mt-1 truncate font-sans">
                              {handle && <span>{handle}</span>}
                              {handle && subscribers && <span>•</span>}
                              {subscribers && <span>{subscribers}</span>}
                            </div>
                            {description && (
                              <p className="text-yt-text-secondary text-sm mt-2 line-clamp-2 font-sans leading-relaxed">
                                {description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-3 shrink-0 ml-2 sm:ml-4">
                            <button type="button" onClick={() => handleRemoveChannelReference(reference.id)} className="text-yt-text-disabled hover:text-yt-red p-2 bg-transparent border-0 cursor-pointer transition-colors flex items-center gap-1" title="Remover dos salvos">
                              <span className="material-icons text-[18px]">bookmark_remove</span>
                              <span className="text-[10px] uppercase tracking-wider hidden sm:inline-block">Remover</span>
                            </button>
                          </div>
                        </article>
                      );
                    }

                    return (
                      <article key={reference.id} className="yt-card p-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-4 min-w-0 flex-1">
                          {reference.thumbnailUrl && (
                            <div className="w-28 h-16 bg-black rounded-[4px] overflow-hidden border border-yt-bg-overlay shrink-0 relative">
                              <img
                                src={reference.thumbnailUrl.includes('hqdefault.jpg') ? reference.thumbnailUrl.replace('hqdefault.jpg', 'maxresdefault.jpg') : reference.thumbnailUrl}
                                alt={reference.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const currentSrc = e.currentTarget.src;
                                  if (currentSrc.includes('maxresdefault.jpg')) {
                                    e.currentTarget.src = currentSrc.replace('maxresdefault.jpg', 'mqdefault.jpg');
                                  }
                                }}
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="studio-label text-yt-red">Referência</span>
                              <span className="text-[10px] uppercase tracking-wider text-yt-text-disabled">{new Date(reference.createdAt).toLocaleDateString("pt-BR")}</span>
                            </div>
                            <h4 className="text-lg font-bold text-yt-text-primary truncate">{reference.title}</h4>
                            <a href={reference.url} target="_blank" rel="noreferrer" className="text-sm text-yt-blue break-all hover:text-yt-blue transition-colors">{reference.url}</a>
                            {reference.note && <p className="text-sm text-yt-text-secondary mt-2 whitespace-pre-line">{reference.note}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a href={reference.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-[3px] border border-yt-bg-overlay text-yt-text-primary hover:bg-yt-bg-elevated transition-colors">Abrir</a>
                          <button type="button" onClick={() => handleRemoveChannelReference(reference.id)} className="px-3 py-2 rounded-[3px] border border-yt-bg-overlay text-yt-red hover:bg-yt-red/10 transition-colors cursor-pointer bg-transparent">Remover</button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          ) : viewMode === "suggestions" ? (
            <section className="w-full min-h-[calc(100vh-220px)] p-7 lg:p-8 space-y-5 flex flex-col">

              {/* ─── Cabeçalho ─── */}
              <div className="flex flex-col gap-2">
                <p className="studio-label text-yt-red">Inteligência Competitiva</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-3xl font-extrabold text-yt-text-primary">Vídeos em Alta</h3>
                  <button onClick={syncAndFetchSuggestions} disabled={loadingSuggestions} className="yt-btn-primary py-1.5 px-4 flex items-center gap-2 text-sm">
                    <span className="material-icons text-sm">{loadingSuggestions ? "hourglass_empty" : "sync"}</span>
                    {loadingSuggestions ? "Processando..." : "Sincronizar Canais"}
                  </button>
                  <button onClick={fetchSuggestions} disabled={loadingSuggestions} className="yt-btn-secondary py-1.5 px-3 flex items-center gap-2 text-sm">
                    <span className="material-icons text-sm">refresh</span>
                    Atualizar
                  </button>
                </div>
                <p className="text-sm text-yt-text-secondary max-w-2xl font-sans">
                  Aqui estão os vídeos mais populares extraídos dos seus canais de referência em background.
                </p>
              </div>

              {/* ─── Painel de Status dos Canais (colapsável) ─── */}
              {channelStatus.length > 0 && (
                <div className="rounded-[10px] border border-yt-bg-overlay bg-yt-bg-surface overflow-hidden">
                  <button
                    onClick={() => setShowChannelStatusPanel(p => !p)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors bg-transparent border-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-yt-text-secondary text-[18px]">info</span>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-yt-text-secondary">Status dos Canais de Referência</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 text-xs font-bold font-sans">
                        <span className="flex items-center gap-1.5 text-[#66bb6a]">
                          <span className="w-2 h-2 rounded-full bg-[#66bb6a] inline-block"></span>
                          {channelStatus.filter(c => c.scraped).length} concluídos
                        </span>
                        <span className="flex items-center gap-1.5 text-yt-text-disabled">
                          <span className="w-2 h-2 rounded-full bg-yt-text-disabled inline-block"></span>
                          {channelStatus.filter(c => !c.scraped).length} pendentes
                        </span>
                      </div>
                      <span className="material-icons text-yt-text-secondary text-lg transition-transform duration-200" style={{ transform: showChannelStatusPanel ? "rotate(180deg)" : "rotate(0deg)" }}>
                        expand_more
                      </span>
                    </div>
                  </button>
                  {showChannelStatusPanel && (
                    <div className="px-5 pb-5 pt-1 border-t border-yt-bg-overlay">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {channelStatus.map(ch => (
                          <div key={ch.referenceId} className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] border ${ch.scraped ? "border-[#66bb6a]/30 bg-[#66bb6a]/5" : "border-yt-bg-overlay bg-white/[0.02]"}`}>
                            {ch.thumbnailUrl ? (
                              <img src={ch.thumbnailUrl} alt={ch.title} className="w-8 h-8 rounded-full object-cover shrink-0 border border-yt-bg-overlay" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-yt-bg-elevated border border-yt-bg-overlay flex items-center justify-center shrink-0 text-xs font-bold text-yt-text-primary">
                                {ch.title.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <p className="text-sm font-semibold text-yt-text-primary truncate flex-1">{ch.title.replace(/^\[Canal\]\s*/i, '')}</p>
                            <span className={`material-icons text-lg shrink-0 ${ch.scraped ? "text-[#66bb6a]" : "text-yt-text-disabled"}`}>
                              {ch.scraped ? "check_circle" : "hourglass_empty"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Filtros ─── */}
              {suggestions.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap p-4 rounded-[8px] bg-yt-bg-surface border border-yt-bg-overlay">
                  <span className="material-icons text-yt-text-secondary text-[18px]">filter_list</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-yt-text-secondary mr-1">Filtros:</span>

                  {/* Filtro por canal */}
                  <select
                    value={suggestionFilterChannel}
                    onChange={e => setSuggestionFilterChannel(e.target.value)}
                    className="studio-input py-1.5 px-3 text-xs bg-yt-bg-elevated border border-yt-bg-overlay rounded text-yt-text-primary focus:outline-none cursor-pointer font-sans"
                  >
                    <option value="">Todos os canais</option>
                    {[...new Set(suggestions.map(v => v.sourceChannelName).filter(Boolean))].sort().map(name => (
                      <option key={name} value={name!}>{name}</option>
                    ))}
                  </select>

                  {/* Filtro por views mínimas */}
                  <select
                    value={suggestionMinViews}
                    onChange={e => setSuggestionMinViews(e.target.value)}
                    className="studio-input py-1.5 px-3 text-xs bg-yt-bg-elevated border border-yt-bg-overlay rounded text-yt-text-primary focus:outline-none cursor-pointer font-sans"
                  >
                    <option value="">Qualquer número de views</option>
                    <option value="100000">+ 100 mil views</option>
                    <option value="500000">+ 500 mil views</option>
                    <option value="1000000">+ 1 milhão de views</option>
                    <option value="5000000">+ 5 milhões de views</option>
                    <option value="10000000">+ 10 milhões de views</option>
                  </select>

                  {/* Ordenação */}
                  <select
                    value={suggestionSort}
                    onChange={e => setSuggestionSort(e.target.value as "views" | "default")}
                    className="studio-input py-1.5 px-3 text-xs bg-yt-bg-elevated border border-yt-bg-overlay rounded text-yt-text-primary focus:outline-none cursor-pointer font-sans"
                  >
                    <option value="default">Ordem padrão</option>
                    <option value="views">Maior número de views</option>
                  </select>

                  {/* Contador de resultados */}
                  <span className="ml-auto text-xs text-yt-text-disabled font-sans">
                    {filteredSuggestions.length} vídeo{filteredSuggestions.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* ─── Grid de Vídeos ─── */}
              {loadingSuggestions && suggestions.length === 0 ? (
                <div className="text-center py-10 text-yt-text-disabled">Carregando sugestões...</div>
              ) : suggestions.length === 0 ? (
                <div className="border border-dashed border-yt-bg-overlay/60 rounded-[12px] bg-white/[0.01] px-6 py-10 text-center">
                  <span className="material-icons text-4xl text-yt-text-disabled mb-4">auto_awesome</span>
                  <h4 className="text-lg font-bold text-yt-text-primary mb-2">Nenhuma sugestão ainda</h4>
                  <p className="text-sm text-yt-text-secondary font-sans">
                    Adicione canais (links) na aba "Canais" e o sistema raspará automaticamente os vídeos em alta em background.
                  </p>
                </div>
              ) : filteredSuggestions.length === 0 ? (
                <div className="border border-dashed border-yt-bg-overlay/60 rounded-[12px] bg-white/[0.01] px-6 py-8 text-center">
                  <span className="material-icons text-3xl text-yt-text-disabled mb-3">search_off</span>
                  <p className="text-sm text-yt-text-secondary font-sans">Nenhum vídeo encontrado com os filtros selecionados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
                  {filteredSuggestions.map(video => (
                    <article key={video.id} className="flex flex-col w-full group relative bg-transparent border-0 shadow-none">
                      {/* Thumbnail Container */}
                      <div className="aspect-video w-full rounded-[12px] overflow-hidden bg-black relative cursor-pointer">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-yt-text-disabled">
                            <span className="material-icons text-4xl">movie</span>
                          </div>
                        )}
                        
                        {/* Hover Overlay containing quick action buttons (Premium YouTube Curation Experience) */}
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 p-4 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleCreateIdeaFromSuggestion(video);
                            }}
                            className="w-11/12 max-w-[150px] bg-yt-red hover:bg-yt-red-hover text-white py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md transform translate-y-2 group-hover:translate-y-0 duration-200 cursor-pointer border-0"
                          >
                            <span className="material-icons text-sm">lightbulb_outline</span>
                            Usar Ideia
                          </button>
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-11/12 max-w-[150px] bg-white/15 backdrop-blur-md hover:bg-white/25 text-white py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md transform translate-y-2 group-hover:translate-y-0 duration-200 text-center"
                          >
                            <span className="material-icons text-sm">play_arrow</span>
                            Assistir
                          </a>
                        </div>
                      </div>

                      {/* Video Info / Metadata row */}
                      <div className="flex gap-3 pt-3 flex-1">
                        {/* Channel circular letter badge (looks like YouTube Channel Avatar) */}
                        <a
                          href={video.sourceChannelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-9 h-9 rounded-full bg-yt-bg-overlay/50 border border-yt-bg-overlay/40 flex items-center justify-center text-sm font-bold text-yt-text-primary flex-shrink-0 transition-opacity hover:opacity-80"
                          title={video.sourceChannelName}
                        >
                          {video.sourceChannelName?.charAt(0).toUpperCase() || "Y"}
                        </a>

                        {/* Text Details */}
                        <div className="flex-1 min-w-0 relative">
                          <div className="flex items-start justify-between gap-1">
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-bold text-yt-text-primary line-clamp-2 leading-tight pr-6 hover:text-yt-blue transition-colors font-sans block"
                              title={video.title}
                            >
                              {video.title}
                            </a>
                            
                            {/* Three dots menu button (Action triggers dropdown) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setActiveMenuId(activeMenuId === video.id ? null : video.id);
                              }}
                              className="absolute right-0 top-0 w-7 h-7 rounded-full flex items-center justify-center text-yt-text-secondary hover:text-yt-text-primary hover:bg-yt-bg-overlay/40 cursor-pointer transition-all border-0 bg-transparent"
                            >
                              <span className="material-icons text-base">more_vert</span>
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === video.id && (
                              <div 
                                className="absolute right-0 top-7 z-20 bg-yt-bg-surface border border-yt-bg-overlay rounded-lg shadow-xl py-1 w-44 text-left font-sans"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    handleCreateIdeaFromSuggestion(video);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2.5 hover:bg-yt-bg-overlay/30 text-xs font-bold text-yt-text-primary flex items-center gap-2 border-0 bg-transparent text-left cursor-pointer transition-colors"
                                >
                                  <span className="material-icons text-sm text-yt-red">lightbulb_outline</span>
                                  Usar como Ideia
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteSuggestion(video.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2.5 hover:bg-yt-bg-overlay/30 text-xs font-bold text-yt-red flex items-center gap-2 border-0 bg-transparent text-left cursor-pointer transition-colors"
                                >
                                  <span className="material-icons text-sm">delete</span>
                                  Remover
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Source Channel Name link */}
                          <a
                            href={video.sourceChannelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-yt-text-secondary font-sans hover:text-yt-text-primary transition-colors mt-1 block font-medium truncate"
                          >
                            {video.sourceChannelName}
                          </a>

                          {/* Views Count / Age */}
                          <span className="text-xs text-yt-text-secondary mt-0.5 block font-sans">
                            {video.views}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

            </section>
          ) : viewMode === "thumbnails" ? (
            <section className="w-full min-h-[calc(100vh-220px)] p-7 lg:p-8 space-y-8 flex flex-col">
              <div className="flex flex-col gap-2">
                <p className="studio-label text-yt-red">Moodboard</p>
                <h3 className="text-3xl font-extrabold text-yt-text-primary">Thumbnails de Inspiração</h3>
                <p className="text-sm text-yt-text-secondary max-w-2xl font-sans">Galeria visual com as capas de vídeos que chamaram sua atenção via extensão.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {channelReferences.filter(r => r.type === 'THUMBNAIL').length === 0 ? (
                  <div className="col-span-full border border-dashed border-yt-bg-overlay/60 rounded-[12px] bg-white/[0.01] px-6 py-10 text-center">
                    <span className="material-icons text-4xl text-yt-text-disabled mb-4">image</span>
                    <h4 className="text-lg font-bold text-yt-text-primary mb-2">Nenhuma thumbnail salva</h4>
                    <p className="text-sm text-yt-text-secondary font-sans">Use a extensão do Chrome para salvar capas de vídeos do YouTube.</p>
                  </div>
                ) : (
                  channelReferences.filter(r => r.type === 'THUMBNAIL').map((reference) => (
                    <article key={reference.id} className="flex flex-col w-full group relative bg-transparent border-0 shadow-none">
                      <div className="aspect-video bg-black relative rounded-[12px] overflow-hidden">
                        <img
                          src={reference.thumbnailUrl?.includes('hqdefault.jpg') ? reference.thumbnailUrl.replace('hqdefault.jpg', 'maxresdefault.jpg') : reference.thumbnailUrl}
                          alt={reference.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          onError={(e) => {
                            const currentSrc = e.currentTarget.src;
                            if (currentSrc.includes('maxresdefault.jpg')) {
                              e.currentTarget.src = currentSrc.replace('maxresdefault.jpg', 'mqdefault.jpg');
                            }
                          }}
                        />
                        <button 
                          onClick={() => handleRemoveChannelReference(reference.id)} 
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-yt-red text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border-0 cursor-pointer z-10"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                      </div>
                      <div className="pt-3 flex-1 flex flex-col">
                        <h4 className="text-sm font-bold text-yt-text-primary line-clamp-2 mb-1 leading-tight font-sans" title={reference.title}>
                          {reference.title}
                        </h4>
                        {reference.note && (
                          <p className="text-xs text-yt-text-secondary mt-1 font-sans line-clamp-2">
                            {reference.note}
                          </p>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : viewMode === "titles" ? (
            <section className="w-full min-h-[calc(100vh-220px)] p-7 lg:p-8 space-y-8 flex flex-col">
              <div className="flex flex-col gap-2">
                <p className="studio-label text-yt-red">Swipe File</p>
                <h3 className="text-3xl font-extrabold text-yt-text-primary">Títulos de Inspiração</h3>
                <p className="text-sm text-yt-text-secondary max-w-2xl font-sans">Coleção de títulos que geraram cliques. Adapte os formatos para o seu nicho.</p>
              </div>

              <div className="flex flex-col gap-3">
                {channelReferences.filter(r => r.type === 'TITLE').length === 0 ? (
                  <div className="border border-dashed border-yt-bg-overlay/60 rounded-[12px] bg-white/[0.01] px-6 py-10 text-center">
                    <span className="material-icons text-4xl text-yt-text-disabled mb-4">title</span>
                    <h4 className="text-lg font-bold text-yt-text-primary mb-2">Nenhum título salvo</h4>
                    <p className="text-sm text-yt-text-secondary font-sans">Use a extensão do Chrome para salvar títulos interessantes do YouTube.</p>
                  </div>
                ) : (
                  channelReferences.filter(r => r.type === 'TITLE').map((reference) => (
                    <article key={reference.id} className="py-5 flex items-start justify-between gap-4 group border-b border-yt-bg-overlay/40 last:border-b-0 bg-transparent shadow-none">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xl font-extrabold text-yt-text-primary break-words leading-tight">"{reference.title}"</h4>
                        {reference.note && <p className="text-sm text-yt-text-secondary mt-2 border-l-2 border-yt-bg-overlay pl-3 font-sans italic">{reference.note}</p>}
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-[10px] uppercase tracking-wider text-yt-text-disabled">Salvo em {new Date(reference.createdAt).toLocaleDateString("pt-BR")}</span>
                          <a href={reference.url} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-wider text-yt-blue hover:underline">Ver Original</a>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveChannelReference(reference.id)} className="p-2 text-yt-text-disabled hover:text-yt-red bg-transparent border-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" title="Remover">
                        <span className="material-icons">delete</span>
                      </button>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : viewMode === "kanban" ? (
            <section className="space-y-6">
              <div className="flex flex-col gap-2 max-w-3xl">
                <p className="studio-label text-yt-red">Kanban</p>
                <h3 className="text-3xl font-extrabold text-yt-text-primary">Arraste as ideias entre as etapas</h3>
                <p className="text-sm text-yt-text-secondary font-sans">
                  {selectedFilter === "ALL"
                    ? "Todas as etapas do pipeline ficam visíveis e as ideias podem ser movidas por drag and drop."
                    : `Mostrando apenas a etapa ${STATUS_LABELS[selectedFilter]?.label || selectedFilter}.`}
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 overflow-x-auto pb-2">
                {KANBAN_COLUMNS
                  .filter((column) => selectedFilter === "ALL" || column.key === selectedFilter)
                  .map((column) => {
                    const columnIdeas = filteredIdeas.filter((idea) => idea.status === column.key);
                    const columnCount = columnIdeas.length;

                    return (
                      <div
                        key={column.key}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, column.key)}
                        className="yt-card p-4 min-w-[280px] bg-yt-bg-surface border border-yt-bg-overlay rounded-[8px] flex flex-col gap-4"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-yt-bg-overlay pb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-icons text-yt-red text-[18px]">{column.icon}</span>
                            <h4 className="text-sm font-extrabold uppercase tracking-wider text-yt-text-primary truncate">{column.label}</h4>
                          </div>
                          <span className="studio-label text-yt-text-secondary shrink-0">{columnCount}</span>
                        </div>

                        <div className="space-y-3 min-h-[180px]">
                          {columnIdeas.length === 0 ? (
                            <div className="rounded-[6px] border border-dashed border-yt-bg-overlay bg-white/[0.02] px-4 py-8 text-center text-sm text-yt-text-disabled font-sans">
                              Arraste uma ideia para esta etapa
                            </div>
                          ) : (
                            columnIdeas.map((idea) => {
                              return (
                                <article
                                  key={idea.id}
                                  onClick={() => onSelectIdea(idea)}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, idea.id)}
                                  className="rounded-[6px] border border-yt-bg-overlay bg-yt-bg-primary p-4 cursor-pointer hover:border-yt-red transition-colors group"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <h5 className="mt-3 text-sm font-bold text-yt-text-primary truncate group-hover:text-yt-red transition-colors">{idea.mainTitle}</h5>
                                      <p className="mt-2 text-xs text-yt-text-secondary line-clamp-3 font-sans">
                                        {idea.description || "Sem descrição configurada."}
                                      </p>
                                    </div>

                                    {idea.status !== "ARCHIVED" && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleArchiveIdea(idea.id, e)}
                                        className="shrink-0 p-1.5 text-yt-text-disabled hover:text-yt-text-primary transition-colors bg-transparent border-0 cursor-pointer"
                                        title="Arquivar"
                                      >
                                        <span className="material-icons text-sm">archive</span>
                                      </button>
                                    )}
                                  </div>
                                </article>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          ) : viewMode === "goals" ? (
            <section className="w-full min-h-[calc(100vh-220px)] p-7 lg:p-8 flex flex-col overflow-y-auto">
              <div className="flex flex-col gap-6 flex-1">
                <div className="flex flex-col gap-2">
                  <p className="studio-label text-yt-red">Metas</p>
                  <h3 className="text-3xl font-extrabold text-yt-text-primary">Metas de Crescimento</h3>
                  <p className="text-sm text-yt-text-secondary max-w-2xl font-sans">Defina e acompanhe as metas de crescimento do seu canal.</p>
                </div>
                <ChannelGoals channel={channel} />
              </div>
            </section>
          ) : null}
        </main>
        <ChecklistDialog
          open={checklistDialogOpen}
          status={pendingChecklistStatus || "IDEA"}
          statusLabel={pendingChecklistStatus ? STATUS_LABELS[pendingChecklistStatus]?.label || pendingChecklistStatus : "Checklist"}
          templateItems={pendingChecklistStatus ? getChecklistItemsForStatus(pendingChecklistStatus) : []}
          onClose={() => {
            setChecklistDialogOpen(false);
            setPendingChecklistIdeaId(null);
            setPendingChecklistStatus(null);
          }}
          onConfirm={(completedItems, skippedItems) => {
            if (!pendingChecklistIdeaId || !pendingChecklistStatus) {
              return;
            }
            void commitIdeaMove(pendingChecklistIdeaId, pendingChecklistStatus, { completed: completedItems, skipped: skippedItems });
          }}
          onSkip={() => {
            if (!pendingChecklistIdeaId || !pendingChecklistStatus) {
              return;
            }
            const items = getChecklistItemsForStatus(pendingChecklistStatus);
            void commitIdeaMove(pendingChecklistIdeaId, pendingChecklistStatus, { completed: [], skipped: items });
          }}
        />
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowModal(false)} />
            <form onSubmit={handleCreateIdea} className="yt-card w-full max-w-lg p-7 relative z-10 space-y-5">
              <h3 className="text-2xl font-extrabold text-yt-text-primary">Nova Ideia</h3>
              {error && <div className="border border-yt-red/40 bg-yt-red/10 text-yt-text-primary p-3 text-sm">{error}</div>}
              <div>
                <input
                  value={mainTitle}
                  onChange={(e) => {
                    setMainTitle(e.target.value);
                    if (fieldErrors.mainTitle) setFieldErrors(prev => ({ ...prev, mainTitle: "" }));
                  }}
                  className="studio-input w-full p-3"
                  placeholder="Título principal"
                  required
                />
                {fieldErrors.mainTitle && (
                  <p className="mt-1 text-xs text-[#ff5045] font-sans">{fieldErrors.mainTitle}</p>
                )}
              </div>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="studio-input w-full p-3" placeholder="Descrição / proposta" />
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} className="studio-input w-full p-3" placeholder="tags, separadas, por vírgula" />
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="studio-input w-full p-3" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="yt-btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="yt-btn-primary">{saving ? "Salvando..." : "Criar Ideia"}</button>
              </div>
            </form>
          </div>
        )}

        {recordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setRecordModalOpen(false)} />
            <div className="yt-card w-full max-w-lg p-7 relative z-10 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-4 border-b border-yt-bg-overlay pb-3">
                <h3 className="text-2xl font-extrabold text-yt-text-primary flex items-center gap-2">
                  <span className="material-icons text-yt-red">video_camera_front</span>
                  Iniciar Gravação
                </h3>
                <button onClick={() => setRecordModalOpen(false)} className="text-yt-text-secondary hover:text-yt-text-primary bg-transparent border-0 cursor-pointer">
                  <span className="material-icons">close</span>
                </button>
              </div>

              <p className="text-yt-text-secondary text-sm mb-5 font-sans text-left">
                Selecione um roteiro/ideia abaixo para abrir diretamente na área de gravação do Teleprompter:
              </p>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[45vh]">
                {ideas.length === 0 ? (
                  <div className="py-8 text-center text-yt-text-disabled font-sans">
                    Nenhuma ideia disponível neste canal.
                  </div>
                ) : (
                  ideas
                    .filter((idea) => idea.status !== "ARCHIVED" && idea.status !== "PUBLISHED")
                    .map((idea) => (
                      <button
                        key={idea.id}
                        onClick={() => {
                          setRecordModalOpen(false);
                          onSelectIdea(idea, "teleprompter");
                        }}
                        className="w-full text-left p-4 bg-yt-bg-surface border border-yt-bg-overlay hover:border-yt-red rounded-[6px] transition-all flex justify-between items-center gap-4 group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-yt-text-primary group-hover:text-yt-red truncate transition-colors">{idea.mainTitle}</h4>
                          <span className="text-[11px] text-yt-text-secondary uppercase tracking-wider font-semibold font-sans">
                            {STATUS_LABELS[idea.status]?.label || idea.status}
                          </span>
                        </div>
                        <span className="material-icons text-yt-red opacity-0 group-hover:opacity-100 transition-opacity">play_circle_filled</span>
                      </button>
                    ))
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-yt-bg-overlay">
                <button onClick={() => setRecordModalOpen(false)} className="yt-btn-secondary">Cancelar</button>
                <button onClick={() => { setRecordModalOpen(false); setShowModal(true); }} className="yt-btn-primary flex items-center gap-2">
                  <span className="material-icons text-sm">add</span>
                  Criar Nova Ideia
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
