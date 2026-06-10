import React, { useState, useEffect, useRef, Suspense } from "react";
import { User, Channel, VideoIdea, Reference, Note, VideoIdeaStatus, ScriptVersion, SponsorPaymentStatus } from "../types";
import { api } from "../api";
import { swal } from "../utils/swal";

// Refined components
import WorkspaceHeader from "./workspace/WorkspaceHeader";
import IdeaOverview from "./workspace/IdeaOverview";
import DescriptionBuilder from "./workspace/DescriptionBuilder";
import ThumbnailSimulator from "./workspace/ThumbnailSimulator";
import ReferenceManager from "./workspace/ReferenceManager";
import NoteManager from "./workspace/NoteManager"; 
import ScriptEditor from "./workspace/ScriptEditor"; 
import TeleprompterView from "./workspace/TeleprompterView"; 

const AudioStudio = React.lazy(() => import("./workspace/AudioStudio")); 

// Types and Utils
import {
  ScriptBlock,
  parseHtmlToBlocks,
  joinBlocksToHtml,
  blocksToMarkdown,
  markdownToBlocks,
  getYouTubeEmbedUrl
} from "./workspace/scriptUtils";

interface VideoIdeaWorkspaceProps {
  idea: VideoIdea;
  onBack: () => void;
  onIdeaUpdated?: (updated: VideoIdea) => void;
  user?: User | null;
  channel?: Channel | null;
  onGoToDashboard?: () => void;
  onLogout?: () => void;
  initialTab?: "overview" | "description" | "simulator" | "references" | "notes" | "script" | "teleprompter" | "audio";
  onTabChange?: (tab: "overview" | "description" | "simulator" | "references" | "notes" | "script" | "teleprompter" | "audio") => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const PRODUCTION_STATUSES: { value: VideoIdeaStatus; label: string; badgeClass: string }[] = [
  { value: "IDEA", label: "Ideia", badgeClass: "badge-idea" },
  { value: "RESEARCHING", label: "Pesquisando", badgeClass: "badge-progress" },
  { value: "SCRIPTING", label: "Roteirizando", badgeClass: "badge-scripted" },
  { value: "READY_TO_RECORD", label: "Pronto p/ Gravar", badgeClass: "badge-scripted" },
  { value: "RECORDED", label: "Gravado", badgeClass: "badge-recorded" },
  { value: "EDITING", label: "Editando", badgeClass: "badge-progress" },
  { value: "SCHEDULED", label: "Agendado", badgeClass: "badge-recorded" },
  { value: "PUBLISHED", label: "Publicado", badgeClass: "badge-published" },
  { value: "ARCHIVED", label: "Arquivado", badgeClass: "badge-archived" }
];

export default function VideoIdeaWorkspace({
  idea: initialIdea,
  onBack,
  onIdeaUpdated,
  user,
  channel,
  onGoToDashboard,
  onLogout,
  initialTab,
  onTabChange,
  theme,
  toggleTheme
}: VideoIdeaWorkspaceProps) {
  const [idea, setIdea] = useState<VideoIdea>(initialIdea);
  const [currentTab, setCurrentTab] = useState<"overview" | "description" | "simulator" | "references" | "notes" | "script" | "teleprompter" | "audio">(initialTab || "overview");

  useEffect(() => {
    if (initialTab) {
      setCurrentTab(initialTab);
    }
  }, [initialTab, idea.id]);

  useEffect(() => {
    if (onTabChange) {
      onTabChange(currentTab);
    }
  }, [currentTab, onTabChange]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Save feeds
  const [saveStatus, setSaveStatus] = useState<"Salvo" | "Salvando..." | "Alterações pendentes">("Salvo");
  const [saveVisualState, setSaveVisualState] = useState<"sync" | "check" | "none">("none");

  // --- TAB 1: OVERVIEW STATE ---
  const [mainTitle, setMainTitle] = useState(idea.mainTitle);
  const [description, setDescription] = useState(idea.description || "");
  const [status, setStatus] = useState<VideoIdeaStatus>(idea.status);
  const [tagInput, setTagInput] = useState(idea.tags ? idea.tags.join(", ") : "");
  const [deadline, setDeadline] = useState(idea.deadline ? idea.deadline.split("T")[0] : "");
  const [evergreen, setEvergreen] = useState(Boolean(idea.evergreen));
  const [trend, setTrend] = useState(Boolean(idea.trend));
  const [sponsored, setSponsored] = useState(Boolean(idea.sponsored));
  const [publishedUrl, setPublishedUrl] = useState(idea.publishedUrl || "");
  const [alternativeTitles, setAlternativeTitles] = useState<string[]>(idea.alternativeTitles || []);
  const [newAltTitle, setNewAltTitle] = useState("");
  const [sponsorBrand, setSponsorBrand] = useState(idea.sponsorBrand || "");
  const [sponsorDeadline, setSponsorDeadline] = useState(idea.sponsorDeadline ? idea.sponsorDeadline.slice(0, 10) : "");
  const [sponsorTrackingUrl, setSponsorTrackingUrl] = useState(idea.sponsorTrackingUrl || "");
  const [sponsorValue, setSponsorValue] = useState(idea.sponsorValue != null ? String(idea.sponsorValue) : "");
  const [sponsorPaymentStatus, setSponsorPaymentStatus] = useState<SponsorPaymentStatus>(
    (idea.sponsorPaymentStatus as SponsorPaymentStatus) || "PENDING"
  );

  // --- TAB 2: REFERENCES STATE ---
  const [references, setReferences] = useState<Reference[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [refUrl, setRefUrl] = useState("");
  const [refLabel, setRefLabel] = useState("");
  const [uploadProgress, setUploadProgress] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  // --- TAB 3: NOTES STATE ---
  const [noteContent, setNoteContent] = useState("");
  const [charCount, setCharCount] = useState(0);

  // --- TAB 4: SCRIPT STATE ---
  const [scriptContent, setScriptContent] = useState("");
  const [scriptVersions, setScriptVersions] = useState<ScriptVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Drag and Drop (Lego Mode) state variables
  const [editorMode, setEditorMode] = useState<"continuous" | "blocks">("blocks");
  const [blocks, setBlocks] = useState<ScriptBlock[]>([]);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState<number | null>(null);

  // Custom script editor toolbar states
  const [fontFamilyOpen, setFontFamilyOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightColorOpen, setHighlightColorOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);

  // --- TAB 5: TELEPROMPTER STATE ---
  const [promptFontSize, setPromptFontSize] = useState<number>(44); // range 32 -> 96
  const [promptSpeed, setPromptSpeed] = useState<number>(3); // range 1 -> 10
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [teleprompterFullscreen, setTeleprompterFullscreen] = useState<boolean>(false);
  const teleprompterFullscreenRef = useRef<HTMLDivElement>(null);
  const teleprompterScrollContainer = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<any>(null);

  // Autosave Timeouts
  const overviewTimeoutRef = useRef<any>(null);
  const notesTimeoutRef = useRef<any>(null);
  const scriptTimeoutRef = useRef<any>(null);
  const scriptContentRef = useRef<string>(scriptContent);

  useEffect(() => {
    scriptContentRef.current = scriptContent;
  }, [scriptContent]);

  const executeScriptSave = async (val: string) => {
    try {
      if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);
      triggerSaveState("Salvando...");
      const calculatedSecs = Math.ceil(calculateWords(val) / 2.6);
      await api.saveScript(idea.id, val, "RICH_TEXT", calculateWords(val), calculatedSecs);
      triggerSaveState("Salvo");
    } catch (err) {
      console.error(err);
      triggerSaveState("Alterações pendentes");
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        executeScriptSave(scriptContentRef.current);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [idea.id]);

  // Initial downloads and auto-refresh on tab changes
  useEffect(() => {
    if (currentTab === "references") {
      fetchReferences();
    } else if (currentTab === "notes") {
      fetchNotes();
    } else if (currentTab === "script" || currentTab === "teleprompter" || currentTab === "audio") {
      fetchScript();
      if (currentTab === "script") {
        fetchScriptVersions();
      }
    } else if (currentTab === "overview") {
      // Re-fetch the idea details to sync with any changes made from extension
      if (channel) {
        api.getIdeas(channel.id).then(list => {
          const updated = list.find(x => x.id === idea.id);
          if (updated) {
            setIdea(updated);
            setMainTitle(updated.mainTitle);
            setDescription(updated.description || "");
            setStatus(updated.status);
            setTagInput(updated.tags ? updated.tags.join(", ") : "");
            setDeadline(updated.deadline ? updated.deadline.split("T")[0] : "");
            setEvergreen(Boolean(updated.evergreen));
            setTrend(Boolean(updated.trend));
            setSponsored(Boolean(updated.sponsored));
            setPublishedUrl(updated.publishedUrl || "");
            setAlternativeTitles(updated.alternativeTitles || []);
            setSponsorBrand(updated.sponsorBrand || "");
            setSponsorDeadline(updated.sponsorDeadline ? updated.sponsorDeadline.slice(0, 10) : "");
            setSponsorTrackingUrl(updated.sponsorTrackingUrl || "");
            setSponsorValue(updated.sponsorValue != null ? String(updated.sponsorValue) : "");
            setSponsorPaymentStatus((updated.sponsorPaymentStatus as SponsorPaymentStatus) || "PENDING");
            if (onIdeaUpdated) onIdeaUpdated(updated);
          }
        }).catch(err => console.error(err));
      }
    }
  }, [currentTab, idea.id]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && teleprompterFullscreen) {
        setTeleprompterFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [teleprompterFullscreen]);

  useEffect(() => {
    const syncBrowserFullscreen = async () => {
      if (teleprompterFullscreen) {
        const target = teleprompterFullscreenRef.current;
        if (target && document.fullscreenElement !== target && target.requestFullscreen) {
          try {
            await target.requestFullscreen();
          } catch (error) {
            console.error("Unable to enter fullscreen", error);
          }
        }
        return;
      }

      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (error) {
          console.error("Unable to exit fullscreen", error);
        }
      }
    };

    void syncBrowserFullscreen();
  }, [teleprompterFullscreen]);

  // Sync state if initialIdea changes
  useEffect(() => {
    setIdea(initialIdea);
    setMainTitle(initialIdea.mainTitle);
    setDescription(initialIdea.description || "");
    setStatus(initialIdea.status);
    setTagInput(initialIdea.tags ? initialIdea.tags.join(", ") : "");
    setDeadline(initialIdea.deadline ? initialIdea.deadline.split("T")[0] : "");
    setEvergreen(Boolean(initialIdea.evergreen));
    setTrend(Boolean(initialIdea.trend));
    setSponsored(Boolean(initialIdea.sponsored));
    setPublishedUrl(initialIdea.publishedUrl || "");
    setAlternativeTitles(initialIdea.alternativeTitles || []);
    setSponsorBrand(initialIdea.sponsorBrand || "");
    setSponsorDeadline(initialIdea.sponsorDeadline ? initialIdea.sponsorDeadline.slice(0, 10) : "");
    setSponsorTrackingUrl(initialIdea.sponsorTrackingUrl || "");
    setSponsorValue(initialIdea.sponsorValue != null ? String(initialIdea.sponsorValue) : "");
    setSponsorPaymentStatus((initialIdea.sponsorPaymentStatus as SponsorPaymentStatus) || "PENDING");
  }, [initialIdea]);

  // Microinteraction logic for saving state:
  // "Ícone sync gira por 1s → vira check_circle_outline por 2s → desaparece"
  useEffect(() => {
    if (saveStatus === "Salvando...") {
      setSaveVisualState("sync");
    } else if (saveStatus === "Salvo") {
      setSaveVisualState("check");
      const delay = setTimeout(() => {
        setSaveVisualState("none");
      }, 2000);
      return () => clearTimeout(delay);
    } else {
      setSaveVisualState("none");
    }
  }, [saveStatus]);

  const triggerSaveState = (state: "Salvo" | "Salvando..." | "Alterações pendentes") => {
    setSaveStatus(state);
  };

  // --- AUTOSAVE FOR GENERAL INFO (OVERVIEW) ---
  const queueOverviewSave = (updatedFields: Partial<VideoIdea>) => {
    triggerSaveState("Salvando...");
    if (overviewTimeoutRef.current) clearTimeout(overviewTimeoutRef.current);

    overviewTimeoutRef.current = setTimeout(async () => {
      try {
        const merged = { ...idea, ...updatedFields };
        const saved = await api.updateIdea(idea.id, updatedFields);
        setIdea(saved);
        if (onIdeaUpdated) onIdeaUpdated(saved);
        triggerSaveState("Salvo");
      } catch (err) {
        console.error(err);
        triggerSaveState("Alterações pendentes");
      }
    }, 1200);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMainTitle(val);
    queueOverviewSave({ mainTitle: val });
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);
    queueOverviewSave({ description: val });
  };

  const handleStatusChange = (newStatus: VideoIdeaStatus) => {
    setStatus(newStatus);
    queueOverviewSave({ status: newStatus });
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTagInput(raw);
    const splitArr = raw.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    queueOverviewSave({ tags: splitArr });
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDeadline(val);
    const apiDeadline = val ? `${val}T12:00:00` : undefined;
    queueOverviewSave({ deadline: apiDeadline });
  };

  const handleFlagChange = (field: "evergreen" | "trend" | "sponsored", value: boolean) => {
    if (field === "evergreen") setEvergreen(value);
    if (field === "trend") setTrend(value);
    if (field === "sponsored") setSponsored(value);
    queueOverviewSave({ [field]: value } as Partial<VideoIdea>);
  };

  const handlePublishedUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPublishedUrl(val);
    queueOverviewSave({ publishedUrl: val });
  };

  const handleSponsorBrandChange = (value: string) => {
    setSponsorBrand(value);
    queueOverviewSave({ sponsorBrand: value });
  };

  const handleSponsorDeadlineChange = (value: string) => {
    setSponsorDeadline(value);
    queueOverviewSave({ sponsorDeadline: value ? `${value}T12:00:00` : undefined });
  };

  const handleSponsorTrackingUrlChange = (value: string) => {
    setSponsorTrackingUrl(value);
    queueOverviewSave({ sponsorTrackingUrl: value });
  };

  const handleSponsorValueChange = (value: string) => {
    setSponsorValue(value);
    const parsed = value.trim() ? Number(value) : undefined;
    if (parsed !== undefined && Number.isNaN(parsed)) {
      return;
    }
    queueOverviewSave({ sponsorValue: parsed });
  };

  const handleSponsorPaymentStatusChange = (value: SponsorPaymentStatus) => {
    setSponsorPaymentStatus(value);
    queueOverviewSave({ sponsorPaymentStatus: value });
  };

  const openTeleprompterFullscreen = () => {
    const target = teleprompterFullscreenRef.current;
    if (target && document.fullscreenElement !== target && target.requestFullscreen) {
      void target.requestFullscreen().catch((error) => {
        console.error("Unable to enter fullscreen", error);
      });
    }

    setTeleprompterFullscreen(true);
    setMobileSidebarOpen(false);
  };

  const closeTeleprompterFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch((error) => {
        console.error("Unable to exit fullscreen", error);
      });
    }

    setTeleprompterFullscreen(false);
  };

  const handleAddAltTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAltTitle.trim()) return;
    const updated = [...alternativeTitles, newAltTitle.trim()];
    setAlternativeTitles(updated);
    setNewAltTitle("");
    queueOverviewSave({ alternativeTitles: updated });
  };

  const handleRemoveAltTitle = (indexToRemove: number) => {
    const updated = alternativeTitles.filter((_, idx) => idx !== indexToRemove);
    setAlternativeTitles(updated);
    queueOverviewSave({ alternativeTitles: updated });
  };

  // Direct add (used by ThumbnailSimulator - no form event needed)
  const handleAddTitleDirect = (title: string) => {
    if (!title.trim()) return;
    const updated = [...alternativeTitles, title.trim()];
    setAlternativeTitles(updated);
    queueOverviewSave({ alternativeTitles: updated });
  };

  // Promote an alternative title to be the main title (old main becomes alternative)
  const handlePromoteToMainTitle = (newMain: string) => {
    const oldMain = mainTitle;
    // Set new main
    setMainTitle(newMain);
    // Remove the promoted title from alternatives and add the old main
    const updatedAlts = alternativeTitles.filter((t) => t !== newMain);
    if (oldMain.trim() && !updatedAlts.includes(oldMain)) {
      updatedAlts.unshift(oldMain);
    }
    setAlternativeTitles(updatedAlts);
    queueOverviewSave({ mainTitle: newMain, alternativeTitles: updatedAlts });
  };

  // --- TAB 2: REFERENCES ---
  const fetchReferences = async () => {
    try {
      setLoadingRefs(true);
      const data = await api.getReferences(idea.id);
      setReferences(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRefs(false);
    }
  };

  const handleAddLinkReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refUrl.trim()) return;

    // If it's a YouTube link and label is empty, use a generic video label
    // otherwise if it's not YouTube and label is empty, use 'Link Externo'
    let finalLabel = refLabel.trim();
    if (!finalLabel) {
      const isYouTube = getYouTubeEmbedUrl(refUrl) !== refUrl;
      finalLabel = isYouTube ? "Vídeo de Referência" : "Link Externo";
    }

    try {
      triggerSaveState("Salvando...");
      const added = await api.addReference(idea.id, "LINK", refUrl.trim(), finalLabel);
      setReferences([...references, added]);
      setRefUrl("");
      setRefLabel("");
      triggerSaveState("Salvo");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRef = async (refId: string) => {
    try {
      triggerSaveState("Salvando...");
      await api.deleteReference(refId);
      setReferences(references.filter((r) => r.id !== refId));
      triggerSaveState("Salvo");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processImageFile(files[0]);
    }
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      swal.error("Arquivo Inválido", "Por favor insira um arquivo de imagem válido (PNG, JPG, WEBP).");
      return;
    }

    const MAX_FILE_SIZE = 7.5 * 1024 * 1024; // 7.5MB
    if (file.size > MAX_FILE_SIZE) {
      swal.error("Arquivo Muito Grande", "O tamanho do arquivo não pode exceder 7.5MB para evitar sobrecarga no servidor.");
      return;
    }

    try {
      setUploadProgress(true);
      triggerSaveState("Salvando...");

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Content = reader.result as string;
          const uploadedUrl = await api.uploadImage(base64Content, file.name);
          const added = await api.addReference(idea.id, "IMAGE", uploadedUrl, file.name);
          setReferences((prev) => [...prev, added]);
          triggerSaveState("Salvo");
          setUploadProgress(false);
        } catch (err: any) {
          console.error(err);
          triggerSaveState("Alterações pendentes");
          setUploadProgress(false);
          const errMsg = err?.message || "Ocorreu um erro ao enviar a imagem.";
          swal.error("Erro no Upload", errMsg);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      triggerSaveState("Alterações pendentes");
      setUploadProgress(false);
      swal.error("Erro no Upload", err?.message || "Ocorreu um erro inesperado.");
    }
  };

  // --- TAB 3: NOTES (Autosave 2s) ---
  const fetchNotes = async () => {
    try {
      const resp = await api.getNotes(idea.id);
      setNoteContent(resp.content || "");
      setCharCount((resp.content || "").length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteContent(val);
    setCharCount(val.length);
    triggerSaveState("Alterações pendentes");

    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    notesTimeoutRef.current = setTimeout(async () => {
      try {
        triggerSaveState("Salvando...");
        await api.saveNotes(idea.id, val);
        triggerSaveState("Salvo");
      } catch (err) {
        console.error(err);
        triggerSaveState("Alterações pendentes");
      }
    }, 2000);
  };

  // --- TAB 4: SCRIPT INTUITIVE TEXT EDITOR ---
  const fetchScript = async () => {
    try {
      const resp = await api.getScript(idea.id);
      const content = resp.content || "";
      setScriptContent(content);
      setBlocks(parseHtmlToBlocks(content));
      const words = calculateWords(content);
      setWordCount(words);
      setEstimatedDuration(Math.ceil(words / 2.6)); // words / 2.6 = seconds
    } catch (err) {
      console.error(err);
    }
  };

  const fetchScriptVersions = async () => {
    try {
      setLoadingVersions(true);
      const data = await api.getScriptVersions(idea.id);
      setScriptVersions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleCreateScriptVersion = async (label?: string | unknown) => {
    try {
      triggerSaveState("Salvando...");
      let finalLabel = `Snapshot ${new Date().toLocaleString("pt-BR")}`;
      if (typeof label === "string" && label.trim() !== "") {
        finalLabel = label.trim();
      }
      
      const created = await api.createScriptVersion(idea.id, finalLabel);
      setScriptVersions((prev) => [created, ...prev]);
      triggerSaveState("Salvo");
    } catch (err) {
      console.error(err);
      triggerSaveState("Alterações pendentes");
    }
  };

  const handleRestoreScriptVersion = async (versionId: string) => {
    try {
      triggerSaveState("Salvando...");
      const restored = await api.restoreScriptVersion(idea.id, versionId);
      const content = restored.content || "";
      setScriptContent(content);
      setBlocks(parseHtmlToBlocks(content));
      const words = calculateWords(content);
      setWordCount(words);
      setEstimatedDuration(Math.ceil(words / 2.6));
      await fetchScriptVersions();
      triggerSaveState("Salvo");
    } catch (err) {
      console.error(err);
      triggerSaveState("Alterações pendentes");
    }
  };

  const handleDeleteScriptVersion = async (versionId: string) => {
    try {
      await api.deleteScriptVersion(idea.id, versionId);
      setScriptVersions((prev) => prev.filter((v) => v.id !== versionId));
    } catch (err) {
      console.error(err);
    }
  };

  const calculateWords = (text: string): number => {
    if (!text) return 0;
    // Strip HTML tags before counting words
    const stripHtml = text.replace(/<[^>]*>/g, " ");
    const clean = stripHtml.trim().replace(/\s+/g, " ");
    if (!clean) return 0;
    return clean.split(" ").length;
  };

  const handleEditorContentChange = (val: string) => {
    setScriptContent(val);
    const words = calculateWords(val);
    setWordCount(words);
    setEstimatedDuration(Math.ceil(words / 2.6));
    triggerScriptSave(val);
  };

  const triggerScriptSave = (val: string) => {
    triggerSaveState("Alterações pendentes");
    if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);

    scriptTimeoutRef.current = setTimeout(() => {
      executeScriptSave(val);
    }, 300000); // 5 minutos
  };

  // --- TAB 4: LEGO MODULAR BLOCKS ENGINE (DRAG & DROP) ---
  const handleUpdateBlockHtml = (index: number, newHtml: string) => {
    const updated = [...blocks];
    updated[index].html = newHtml;
    setBlocks(updated);

    const combined = joinBlocksToHtml(updated);
    setScriptContent(combined);

    // Update stats
    const words = calculateWords(combined);
    setWordCount(words);
    setEstimatedDuration(Math.ceil(words / 2.6));

    triggerScriptSave(combined);
  };

  const handleDeleteBlock = (indexToDelete: number) => {
    const updated = blocks.filter((_, idx) => idx !== indexToDelete);
    // Ensure we don't leave it completely empty
    const finalBlocks = updated.length > 0 ? updated : [{ id: "block-init", type: "paragraph" as const, html: "<p><br></p>" }];
    setBlocks(finalBlocks);

    const combined = joinBlocksToHtml(finalBlocks);
    setScriptContent(combined);

    const words = calculateWords(combined);
    setWordCount(words);
    setEstimatedDuration(Math.ceil(words / 2.6));

    triggerScriptSave(combined);
  };

  const handleDuplicateBlock = (indexToDuplicate: number) => {
    const sourceBlock = blocks[indexToDuplicate];
    const duplicatedBlock: ScriptBlock = {
      id: `block-${Math.random().toString(36).substr(2, 5)}`,
      type: sourceBlock.type,
      html: sourceBlock.html
    };

    const updated = [...blocks];
    updated.splice(indexToDuplicate + 1, 0, duplicatedBlock);
    setBlocks(updated);

    const combined = joinBlocksToHtml(updated);
    setScriptContent(combined);

    const words = calculateWords(combined);
    setWordCount(words);
    setEstimatedDuration(Math.ceil(words / 2.6));

    triggerScriptSave(combined);
  };

  const handleInsertBlockAt = (index: number, type: "paragraph" | "hook" | "dev" | "final" | "cta") => {
    const htmlBlocks: Record<string, string> = {
      paragraph: `<p style="color: #f1f1f1;">Insira seu texto aqui...</p>`,
      hook: `<div style="background-color: rgba(220, 38, 38, 0.22); border-left: 4px solid #ef4444; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #fef2f2;">
               <span contenteditable="false" style="background-color: #dc2626; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">GANCHO</span>
               <strong style="color: #fca5a5;">Insira seu gancho de atenção aqui!</strong> Desperte a curiosidade do espectador nos primeiros 5 segundos.
             </div>`,
      dev: `<div style="background-color: rgba(37, 99, 235, 0.22); border-left: 4px solid #60a5fa; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #eff6ff;">
              <span contenteditable="false" style="background-color: #2563eb; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">CONTEÚDO</span>
              <strong style="color: #93c5fd;">Desenvolva o roteiro do vídeo aqui.</strong> Use frases curtas, dinâmicas e destaque pontos-chave em negrito.
            </div>`,
      final: `<div style="background-color: rgba(217, 119, 6, 0.22); border-left: 4px solid #fbbf24; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #fffbeb;">
                <span contenteditable="false" style="background-color: #d97706; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">CONCLUSÃO</span>
                <strong style="color: #fcd34d;">Faça um resumo rápido do vídeo</strong> e prepare o espectador para a chamada de ação final.
              </div>`,
      cta: `<div style="background-color: rgba(5, 150, 105, 0.22); border-left: 4px solid #34d399; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #ecfdf5;">
              <span contenteditable="false" style="background-color: #059669; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">CTA</span>
              <span style="color: #6ee7b7;">Peça o like, inscrição, ou indique o próximo vídeo recomendado.</span>
            </div>`
    };

    const newBlock: ScriptBlock = {
      id: `block-${Math.random().toString(36).substr(2, 5)}`,
      type,
      html: htmlBlocks[type]
    };

    const updated = [...blocks];
    updated.splice(index, 0, newBlock);
    setBlocks(updated);

    const combined = joinBlocksToHtml(updated);
    setScriptContent(combined);

    const words = calculateWords(combined);
    setWordCount(words);
    setEstimatedDuration(Math.ceil(words / 2.6));

    triggerScriptSave(combined);
  };

  const handleChangeBlockType = (index: number, newType: "paragraph" | "hook" | "dev" | "final" | "cta") => {
    const updated = [...blocks];
    const currentHtml = updated[index].html;

    // Extract text content safely by parsing
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = currentHtml;

    let innerContent = tempDiv.innerHTML;
    if (tempDiv.firstChild && (tempDiv.firstChild as HTMLElement).style && (tempDiv.firstChild as HTMLElement).style.borderLeft) {
      const el = tempDiv.firstChild as HTMLElement;
      const badgeSpan = el.querySelector("span");
      if (badgeSpan) {
        badgeSpan.remove();
      }
      innerContent = el.innerHTML;
    } else if (tempDiv.firstChild && (tempDiv.firstChild as HTMLElement).tagName === "P") {
      innerContent = (tempDiv.firstChild as HTMLElement).innerHTML;
    }

    // Strip out excess linebreaks or clean content
    innerContent = innerContent.trim();
    if (innerContent === "<br>" || innerContent === "") {
      innerContent = "Insira o conteúdo deste parágrafo aqui...";
    }

    let newHtml = "";
    if (newType === 'paragraph') {
      newHtml = `<p style="color: #f1f1f1;">${innerContent}</p>`;
    } else if (newType === 'hook') {
      newHtml = `<div style="background-color: rgba(220, 38, 38, 0.22); border-left: 4px solid #ef4444; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #fef2f2;">
                  <span contenteditable="false" style="background-color: #dc2626; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">GANCHO</span>
                  ${innerContent}
                </div>`;
    } else if (newType === 'dev') {
      newHtml = `<div style="background-color: rgba(37, 99, 235, 0.22); border-left: 4px solid #60a5fa; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #eff6ff;">
                  <span contenteditable="false" style="background-color: #2563eb; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">CONTEÚDO</span>
                  ${innerContent}
                </div>`;
    } else if (newType === 'final') {
      newHtml = `<div style="background-color: rgba(217, 119, 6, 0.22); border-left: 4px solid #fbbf24; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #fffbeb;">
                  <span contenteditable="false" style="background-color: #d97706; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">CONCLUSÃO</span>
                  ${innerContent}
                </div>`;
    } else if (newType === 'cta') {
      newHtml = `<div style="background-color: rgba(5, 150, 105, 0.22); border-left: 4px solid #34d399; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #ecfdf5;">
                  <span contenteditable="false" style="background-color: #059669; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">CTA</span>
                  ${innerContent}
                </div>`;
    }

    updated[index].type = newType;
    updated[index].html = newHtml;
    setBlocks(updated);

    const combined = joinBlocksToHtml(updated);
    setScriptContent(combined);
    triggerScriptSave(combined);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBlockIndex !== null && draggedBlockIndex !== index) {
      setDragOverBlockIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === targetIndex) {
      setDraggedBlockIndex(null);
      setDragOverBlockIndex(null);
      return;
    }

    const reordered = [...blocks];
    const [moved] = reordered.splice(draggedBlockIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setBlocks(reordered);
    const combined = joinBlocksToHtml(reordered);
    setScriptContent(combined);
    triggerScriptSave(combined);

    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);
  };

  const handleToggleMode = (mode: "continuous" | "blocks") => {
    if (mode === "blocks") {
      // Assuming scriptContent is Markdown when coming from continuous mode
      // If it contains raw HTML instead (e.g. from an old save), markdownToBlocks handles basic HTML too,
      // but if it's purely old HTML, parseHtmlToBlocks would be better. Let's try parsing it as markdown first.
      if (scriptContent.includes("<div") && !scriptContent.includes("[GANCHO]")) {
         setBlocks(parseHtmlToBlocks(scriptContent));
      } else {
         setBlocks(markdownToBlocks(scriptContent));
      }
    } else {
      const combined = blocksToMarkdown(blocks);
      setScriptContent(combined);
      if (editorRef.current) {
        (editorRef.current as unknown as HTMLTextAreaElement).value = combined;
      }
    }
    setEditorMode(mode);
  };

  // --- TAB 5: TELEPROMPTER FLOW ENGINE ---
  useEffect(() => {
    if (isScrolling && currentTab === "teleprompter") {
      startAutoscroll();
    } else {
      stopAutoscroll();
    }
    return () => stopAutoscroll();
  }, [isScrolling, promptSpeed, currentTab]);

  const startAutoscroll = () => {
    stopAutoscroll();
    const container = teleprompterScrollContainer.current;
    if (!container) return;

    const tick = () => {
      if (!isScrolling) return;
      const scrollStep = promptSpeed * 0.45;
      container.scrollTop += scrollStep;
      scrollTimerRef.current = requestAnimationFrame(tick);
    };

    scrollTimerRef.current = requestAnimationFrame(tick);
  };

  const stopAutoscroll = () => {
    if (scrollTimerRef.current) {
      cancelAnimationFrame(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
  };

  const handleScreenClickToggle = () => {
    setIsScrolling(!isScrolling);
  };

  const resetAutoscrollPosition = () => {
    setIsScrolling(false);
    const container = teleprompterScrollContainer.current;
    if (container) {
      container.scrollTop = 0;
    }
  };

  useEffect(() => {
    interface LocalWakeLockSentinel {
      release(): Promise<void>;
    }
    let wakeLock: LocalWakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      if ("wakeLock" in navigator) {
        try {
          const nav = navigator as unknown as { wakeLock: { request(type: "screen"): Promise<LocalWakeLockSentinel> } };
          wakeLock = await nav.wakeLock.request("screen");
        } catch (err) {
          console.warn("Wake lock request failed", err);
        }
      }
    };

    if (currentTab === "teleprompter") {
      requestWakeLock();
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
    };
  }, [currentTab]);

  const getTeleprompterHtml = () => {
    if (!scriptContent) return "O seu roteiro está vazio atualmente. Escreva algo na aba 'Roteiro' primeiro!";

    let html = scriptContent;

    // If it contains HTML tags, process it
    if (html.includes("<") && html.includes(">")) {
      if (theme === "light") {
        // In light mode: replace light text colors with dark ones inside block divs
        // Replace block div text colors (off-white variants → near-black for readability)
        html = html
          // Replace block div color declarations (the outer colored container text)
          .replace(/color:\s*#fef2f2/g, "color: #1a0505")   // GANCHO (red tint)
          .replace(/color:\s*#eff6ff/g, "color: #04102e")   // CONTEÚDO (blue tint)
          .replace(/color:\s*#fffbeb/g, "color: #1c1000")   // CONCLUSÃO (amber tint)
          .replace(/color:\s*#ecfdf5/g, "color: #01200e")   // CTA (green tint)
          .replace(/color:\s*#fef2f2/g, "color: #1a0000")   // fallback red
          // Replace strong highlight colors inside blocks
          .replace(/color:\s*#fca5a5/g, "color: #991b1b")   // GANCHO strong
          .replace(/color:\s*#93c5fd/g, "color: #1d4ed8")   // CONTEÚDO strong
          .replace(/color:\s*#fcd34d/g, "color: #92400e")   // CONCLUSÃO strong
          .replace(/color:\s*#6ee7b7/g, "color: #065f46")   // CTA span
          // Increase block background opacity for light mode
          .replace(/rgba\(220,\s*38,\s*38,\s*0\.22\)/g, "rgba(220, 38, 38, 0.10)")
          .replace(/rgba\(37,\s*99,\s*235,\s*0\.22\)/g, "rgba(37, 99, 235, 0.10)")
          .replace(/rgba\(217,\s*119,\s*6,\s*0\.22\)/g, "rgba(217, 119, 6, 0.10)")
          .replace(/rgba\(5,\s*150,\s*105,\s*0\.22\)/g, "rgba(5, 150, 105, 0.10)")
          // Plain paragraph text color
          .replace(/color:\s*#f1f1f1/g, "color: #111111");
      }
      return html;
    }

    // Fallback: Convert plain text / markdown to HTML
    html = html
      .replace(/#+\s+(.*)/g, `<h2 style="font-size: 1.5em; font-weight: bold; margin: 1em 0; color: ${theme === "light" ? "#e0453b" : "#ff5045"};">$1</h2>`)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");

    // Replace custom badges
    html = html.replace(/\[(HOOK|GANCHO)\]/gi, `<span style="background-color: #ff5045; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-right: 4px; display: inline-block;">GANCHO</span>`);
    html = html.replace(/\[(DEV|CONTEÚDO)\]/gi, `<span style="background-color: #3ea6ff; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-right: 4px; display: inline-block;">CONTEÚDO</span>`);
    html = html.replace(/\[(FINAL|CONCLUSÃO)\]/gi, `<span style="background-color: #ff9800; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-right: 4px; display: inline-block;">CONCLUSÃO</span>`);
    html = html.replace(/\[(CTA)\]/gi, `<span style="background-color: #2ba640; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-right: 4px; display: inline-block;">CTA</span>`);

    return html;
  };

  const handleVoiceTranscript = (text: string) => {
    if (!text.trim()) return;

    if (editorMode === "continuous") {
      // In continuous mode, insert plain text transcript at cursor position in textarea
      if (editorRef.current) {
        const textarea = editorRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        const insertText = val ? ` ${text} ` : text;
        const updated = val.slice(0, start) + insertText + val.slice(end);
        
        handleEditorContentChange(updated);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
          textarea.focus();
        }, 0);
      } else {
        const updated = scriptContent + ` ${text}`;
        handleEditorContentChange(updated);
      }
    } else {
      // In blocks mode, create a new paragraph block with the transcribed text
      const newBlock = {
        id: `block-${Math.random().toString(36).substr(2, 5)}`,
        type: "paragraph" as const,
        html: `<p style="color: #f1f1f1;">${text}</p>`
      };
      const updated = [...blocks, newBlock];
      setBlocks(updated);
      const combined = joinBlocksToHtml(updated);
      setScriptContent(combined);
      const words = calculateWords(combined);
      setWordCount(words);
      setEstimatedDuration(Math.ceil(words / 2.6));
      triggerScriptSave(combined);
    }
  };


  // --- RENDER ---
  return (
    <div className={`min-h-screen ${teleprompterFullscreen ? "bg-black" : "bg-yt-bg-primary"} text-yt-text-primary font-sans selection:bg-[#ff5045]/30`}>
      {!teleprompterFullscreen && (
          <WorkspaceHeader
          mainTitle={mainTitle}
          saveStatus={saveStatus}
          saveVisualState={saveVisualState}
          currentTab={currentTab}
          onBack={onBack}
          onTabChange={setCurrentTab}
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setMobileSidebarOpen(true);
            } else {
              setSidebarCollapsed((collapsed) => !collapsed);
            }
          }}
          // --- ADD THESE MISSING PROPS BELOW ---
          status={status}
          onStatusChange={handleStatusChange}
          productionStatuses={PRODUCTION_STATUSES}
          tabs={[
            { id: "overview", label: "Visão Geral", icon: "dashboard" },
            { id: "description", label: "Descrição", icon: "description" },
            { id: "simulator", label: "Simulador", icon: "image_search" },
            { id: "references", label: "Referências", icon: "link" },
            { id: "notes", label: "Anotações", icon: "sticky_note_2" },
            { id: "script", label: "Roteiro", icon: "article" },
            { id: "teleprompter", label: "Teleprompter", icon: "video_camera_front" },
            { id: "audio", label: "Estúdio de Áudio", icon: "graphic_eq" }
          ]}
          onGoToDashboard={onGoToDashboard}
          onLogout={onLogout}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {!teleprompterFullscreen && (
        <main className={`mt-[80px] h-[calc(100vh-80px)] overflow-y-auto transition-all duration-200 w-full ${sidebarCollapsed ? "lg:ml-[72px] lg:w-[calc(100%-72px)]" : "lg:ml-[300px] lg:w-[calc(100%-300px)]"}`}>
          {currentTab === "overview" && (
            <IdeaOverview
              mainTitle={mainTitle}
              onTitleChange={handleTitleChange}
              description={description}
              onDescChange={handleDescChange}
              status={status}
              onStatusChange={handleStatusChange}
              productionStatuses={PRODUCTION_STATUSES}
              tagInput={tagInput}
              onTagsChange={handleTagsChange}
              deadline={deadline}
              onDeadlineChange={handleDeadlineChange}
              evergreen={evergreen}
              trend={trend}
              sponsored={sponsored}
              publishedUrl={publishedUrl}
              onFlagChange={handleFlagChange}
              onPublishedUrlChange={handlePublishedUrlChange}
              sponsorBrand={sponsorBrand}
              sponsorDeadline={sponsorDeadline}
              sponsorTrackingUrl={sponsorTrackingUrl}
              sponsorValue={sponsorValue}
              sponsorPaymentStatus={sponsorPaymentStatus}
              onSponsorBrandChange={handleSponsorBrandChange}
              onSponsorDeadlineChange={handleSponsorDeadlineChange}
              onSponsorTrackingUrlChange={handleSponsorTrackingUrlChange}
              onSponsorValueChange={handleSponsorValueChange}
              onSponsorPaymentStatusChange={handleSponsorPaymentStatusChange}
              alternativeTitles={alternativeTitles}
              newAltTitle={newAltTitle}
              onNewAltTitleChange={(e) => setNewAltTitle(e.target.value)}
              onAddAltTitle={handleAddAltTitle}
              onRemoveAltTitle={handleRemoveAltTitle}
            />
          )}

          {currentTab === "description" && channel && <DescriptionBuilder channel={channel} />}

          {currentTab === "description" && !channel && (
            <section className="yt-card p-8 text-center text-yt-text-secondary">Nenhum canal carregado para editar a descrição.</section>
          )}

          {currentTab === "simulator" && (
            <ThumbnailSimulator
              idea={idea}
              alternativeTitles={alternativeTitles}
              onAddTitle={handleAddTitleDirect}
              onRemoveTitle={handleRemoveAltTitle}
              onSetMainTitle={handlePromoteToMainTitle}
            />
          )}

          {currentTab === "audio" && (
            <Suspense fallback={
              <div className="p-8 text-center text-yt-text-secondary font-sans flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-yt-red border-t-transparent animate-spin"></div>
                <p className="text-xs font-semibold tracking-wider uppercase">Carregando Estúdio de Áudio...</p>
              </div>
            }>
              <AudioStudio />
            </Suspense>
          )}

          {currentTab === "references" && (
            <ReferenceManager
              references={references}
              loadingRefs={loadingRefs}
              refUrl={refUrl}
              onRefUrlChange={(e) => setRefUrl(e.target.value)}
              refLabel={refLabel}
              onRefLabelChange={(e) => setRefLabel(e.target.value)}
              onAddLink={handleAddLinkReference}
              onDeleteRef={handleDeleteRef}
              uploadProgress={uploadProgress}
              onSelectImage={handleSelectImageFile}
            />
          )}

          {currentTab === "notes" && (
            <NoteManager
              notes={noteContent ? [{
                id: "current-note",
                videoIdeaId: idea.id,
                content: noteContent,
                createdAt: idea.createdAt,
                updatedAt: new Date().toISOString()
              }] : []}
              loadingNotes={false}
              newNoteText={noteContent}
              onNewNoteChange={(e) => handleNotesChange(e)}
              onAddNote={(e) => { e.preventDefault(); }}
              onDeleteNote={() => { }}
            />
          )}

          {currentTab === "script" && (
            <ScriptEditor
              editorMode={editorMode}
              onToggleMode={handleToggleMode}
              blocks={blocks}
              onUpdateBlock={handleUpdateBlockHtml}
              onDeleteBlock={handleDeleteBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onChangeBlockType={handleChangeBlockType}
              onInsertBlock={handleInsertBlockAt}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              draggedBlockIndex={draggedBlockIndex}
              dragOverBlockIndex={dragOverBlockIndex}
              editorRef={editorRef}
              onEditorContentChange={handleEditorContentChange}
              wordCount={wordCount}
              estimatedDuration={estimatedDuration}
              ctaTemplates={channel?.ctaTemplates || []}
              scriptVersions={scriptVersions}
              loadingVersions={loadingVersions}
              onCreateVersion={handleCreateScriptVersion}
              onRestoreVersion={handleRestoreScriptVersion}
              onDeleteVersion={handleDeleteScriptVersion}
              onVoiceTranscript={handleVoiceTranscript}
              scriptContent={scriptContent}
            />
          )}

          {currentTab === "teleprompter" && (
            <TeleprompterView
              content={editorMode === "continuous" ? joinBlocksToHtml(markdownToBlocks(scriptContent)) : scriptContent}
              fontSize={promptFontSize}
              speed={promptSpeed}
              isScrolling={isScrolling}
              theme={theme}

              onToggleScroll={handleScreenClickToggle}
              onReset={resetAutoscrollPosition}
              onSpeedChange={setPromptSpeed}
              onFontSizeChange={setPromptFontSize}
              onFullscreenToggle={openTeleprompterFullscreen}
            />
          )}
        </main>
      )}

      {/* Mobile sidebar overlay for workspace (opened by hamburger) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-yt-bg-surface border-r border-yt-bg-overlay p-3 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-icons text-yt-red text-3xl">subscriptions</span>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-widest text-yt-text-primary">CreatorStage</div>
                  <div className="text-[10px] text-yt-text-secondary">Workspace</div>
                </div>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-yt-text-primary p-1 rounded-md hover:bg-white/5 cursor-pointer bg-transparent border-0">
                <span className="material-icons">close</span>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-2">
              <button onClick={() => { setCurrentTab('overview'); setMobileSidebarOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-3 ${currentTab === 'overview' ? 'bg-yt-bg-elevated text-yt-text-primary' : 'text-yt-text-secondary'} border-0 cursor-pointer bg-transparent`}>
                <span className="material-icons text-sm">dashboard</span>
                <span>Todas as Ideias</span>
              </button>

              <button onClick={() => { setCurrentTab('references'); setMobileSidebarOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-3 ${currentTab === 'references' ? 'bg-yt-bg-elevated text-yt-text-primary' : 'text-yt-text-secondary'} border-0 cursor-pointer bg-transparent`}>
                <span className="material-icons text-sm">link</span>
                <span>Referências</span>
              </button>

              <button onClick={() => { setCurrentTab('notes'); setMobileSidebarOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-3 ${currentTab === 'notes' ? 'bg-yt-bg-elevated text-yt-text-primary' : 'text-yt-text-secondary'} border-0 cursor-pointer bg-transparent`}>
                <span className="material-icons text-sm">sticky_note_2</span>
                <span>Anotações</span>
              </button>

              <button onClick={() => { setCurrentTab('script'); setMobileSidebarOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-3 ${currentTab === 'script' ? 'bg-yt-bg-elevated text-yt-text-primary' : 'text-yt-text-secondary'} border-0 cursor-pointer bg-transparent`}>
                <span className="material-icons text-sm">article</span>
                <span>Roteiro</span>
              </button>

              <button onClick={() => { setCurrentTab('teleprompter'); setMobileSidebarOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-3 ${currentTab === 'teleprompter' ? 'bg-yt-bg-elevated text-yt-text-primary' : 'text-yt-text-secondary'} border-0 cursor-pointer bg-transparent`}>
                <span className="material-icons text-sm">video_camera_front</span>
                <span>Teleprompter</span>
              </button>
            </nav>

            <div className="pt-4 border-t border-yt-bg-overlay">
              <button onClick={() => { setTeleprompterFullscreen(true); setMobileSidebarOpen(false); }} className="w-full py-2 px-3 bg-yt-red hover:bg-yt-red-hover text-white rounded-sm text-sm font-semibold border-0 cursor-pointer">Abrir Teleprompter</button>
            </div>
          </aside>
        </div>
      )}

      {/* Fullscreen Teleprompter Overlay */}
      {teleprompterFullscreen && (
        <div ref={teleprompterFullscreenRef} className="fixed inset-0 z-[999] flex flex-col bg-yt-bg-primary">
          <TeleprompterView
            content={scriptContent}
            fontSize={promptFontSize}
            speed={promptSpeed}
            isScrolling={isScrolling}
            theme={theme}
            onToggleScroll={handleScreenClickToggle}
            onReset={resetAutoscrollPosition}
            onSpeedChange={setPromptSpeed}
            onFontSizeChange={setPromptFontSize}
            onFullscreenToggle={closeTeleprompterFullscreen}
            isFullscreen={true}
          />
        </div>
      )}
    </div>
  );
}
