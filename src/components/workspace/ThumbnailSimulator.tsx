import React, { useEffect, useMemo, useRef, useState } from "react";
import { VideoIdea } from "../../types";

interface ThumbnailSimulatorProps {
  idea: VideoIdea;
  alternativeTitles: string[];
  onAddTitle: (title: string) => void;
  onRemoveTitle: (index: number) => void;
  onSetMainTitle: (title: string) => void;
}

interface UploadedThumbnail {
  id: string;
  url: string;
  name: string;
}

const FAKE_CARDS = [
  { channel: "Code Sprint", title: "Como publicar mais em menos tempo", views: "126 mil visualizações", time: "12:48", accent: "from-red-500/80 to-orange-500/60" },
  { channel: "Studio Flow", title: "5 ajustes de roteiro que mudam tudo", views: "42 mil visualizações", time: "08:19", accent: "from-sky-500/80 to-cyan-500/60" },
  { channel: "Creator Ops", title: "O setup que acelerou meu canal", views: "311 mil visualizações", time: "15:02", accent: "from-emerald-500/80 to-lime-500/60" },
  { channel: "Niche Lab", title: "O erro que faz seu vídeo morrer cedo", views: "91 mil visualizações", time: "09:33", accent: "from-amber-500/80 to-yellow-500/60" },
  { channel: "Frame TV", title: "Miniatura limpa vende mais clique?", views: "58 mil visualizações", time: "06:27", accent: "from-fuchsia-500/80 to-pink-500/60" },
  { channel: "Launch Room", title: "Como escolher um título sem clickbait", views: "17 mil visualizações", time: "10:41", accent: "from-violet-500/80 to-indigo-500/60" }
];

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `thumb-${Math.random().toString(36).slice(2, 10)}`;
};

const truncationLimit = { desktop: 68, mobile: 42 };

function MockCard({ title, channel, views, time, accent, thumbnail }: { title: string; channel: string; views: string; time: string; accent: string; thumbnail?: UploadedThumbnail; }) {
  return (
    <article className="flex gap-3 rounded-[10px] p-2 hover:bg-white/5 transition-colors">
      <div className={`w-40 h-24 rounded-[10px] ${thumbnail ? '' : `bg-gradient-to-br ${accent}`} relative overflow-hidden shrink-0`}>
        {thumbnail && <img src={thumbnail.url} alt={thumbnail.name} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 bg-black/80 text-[10px] font-bold text-white">{time}</div>
      </div>
      <div className="min-w-0 pt-0.5">
        <h4 className="text-sm font-bold text-yt-text-primary line-clamp-2 leading-5">{title}</h4>
        <p className="mt-1 text-xs text-yt-text-secondary font-sans truncate">{channel}</p>
        <p className="text-xs text-yt-text-disabled font-sans truncate">{views}</p>
      </div>
    </article>
  );
}

function LiveCard({
  title,
  thumbnail,
  layout
}: {
  title: string;
  thumbnail?: UploadedThumbnail;
  layout: "desktop" | "mobile";
}) {
  const limit = layout === "desktop" ? truncationLimit.desktop : truncationLimit.mobile;
  const truncated = title.length > limit;

  return (
    <article className={`rounded-[14px] border border-yt-bg-overlay bg-yt-bg-primary overflow-hidden ${layout === "mobile" ? "shadow-none" : "shadow-[0_12px_40px_rgba(0,0,0,0.18)]"}`}>
      <div className={`relative ${layout === "desktop" ? "aspect-[16/9]" : "aspect-[16/9]"} bg-black/20`}>
        {thumbnail ? (
          <img src={thumbnail.url} alt={thumbnail.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff5045] via-[#5b2cff] to-[#00c2ff] flex items-center justify-center text-white">
            <div className="text-center px-6">
              <span className="material-icons text-4xl mb-2">image_search</span>
              <p className="text-sm font-bold uppercase tracking-widest">Envie uma thumbnail</p>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-extrabold leading-6 text-sm md:text-base line-clamp-2">{title || "Digite um título para ver o corte de feed"}</p>
        </div>
        {truncated && (
          <div className="absolute top-3 right-3 rounded-full bg-black/70 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
            Título truncado
          </div>
        )}
      </div>
      <div className="p-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-yt-bg-elevated border border-yt-bg-overlay flex items-center justify-center text-xs font-bold text-yt-text-primary shrink-0">CS</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-yt-text-primary line-clamp-2">{title || "Título do vídeo"}</p>
          <p className="mt-1 text-xs text-yt-text-secondary font-sans">CreatorsDeck • 128 mil visualizações • há 2 dias</p>
        </div>
      </div>
    </article>
  );
}

export default function ThumbnailSimulator({ idea, alternativeTitles, onAddTitle, onRemoveTitle, onSetMainTitle }: ThumbnailSimulatorProps) {
  const [layout, setLayout] = useState<"desktop" | "mobile">("desktop");
  const [thumbnails, setThumbnails] = useState<UploadedThumbnail[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTitle, setSelectedTitle] = useState(idea.mainTitle || "");
  const thumbnailsRef = useRef<UploadedThumbnail[]>([]);

  // All titles: main + alternatives (deduplicated)
  const allTitles = useMemo(() => {
    const base = [idea.mainTitle, ...alternativeTitles].filter(Boolean);
    return Array.from(new Set(base));
  }, [idea.mainTitle, alternativeTitles]);

  useEffect(() => {
    setSelectedTitle(idea.mainTitle || alternativeTitles?.[0] || "");
  }, [idea.id, idea.mainTitle]);

  useEffect(() => {
    thumbnailsRef.current = thumbnails;
  }, [thumbnails]);

  useEffect(() => {
    return () => {
      thumbnailsRef.current.forEach((thumbnail) => URL.revokeObjectURL(thumbnail.url));
    };
  }, []);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const remainingSlots = Math.max(0, 3 - thumbnails.length);
    const accepted = files.slice(0, remainingSlots).filter((file) => file.type.startsWith("image/"));
    const nextThumbs = accepted.map((file) => ({ id: createId(), url: URL.createObjectURL(file), name: file.name }));
    setThumbnails((current) => [...current, ...nextThumbs]);
    event.target.value = "";
  };

  const handleRemoveThumbnail = (id: string) => {
    setThumbnails((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const handleAddNewTitle = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    // Don't add duplicate
    if (allTitles.includes(trimmed)) {
      setSelectedTitle(trimmed);
      setNewTitle("");
      return;
    }
    onAddTitle(trimmed);
    setSelectedTitle(trimmed);
    setNewTitle("");
  };

  const handleRemoveTitle = (title: string) => {
    // Find the index in alternativeTitles (not allTitles since main title can't be removed)
    const altIndex = alternativeTitles.indexOf(title);
    if (altIndex >= 0) {
      onRemoveTitle(altIndex);
      // If we removed the selected title, switch to main
      if (selectedTitle === title) {
        setSelectedTitle(idea.mainTitle);
      }
    }
  };

  const handlePromoteToMain = (title: string) => {
    if (title === idea.mainTitle) return;
    onSetMainTitle(title);
    setSelectedTitle(title);
  };

  const currentLimit = layout === "desktop" ? truncationLimit.desktop : truncationLimit.mobile;
  const isTruncated = selectedTitle.length > currentLimit;

  const heroThumbnail = thumbnails[0];
  const secondaryThumbnails = thumbnails.slice(1);

  return (
    <div className="w-full space-y-6 p-7">
      <section className="overflow-hidden">
        <div className="px-7 py-5 border-b border-yt-bg-overlay flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-yt-text-disabled">Simulador client-side</p>
            <h2 className="text-2xl font-extrabold text-yt-text-primary">Thumbnail + título como no feed do YouTube</h2>
            <p className="text-sm text-yt-text-secondary font-sans">Faça upload de até 3 thumbnails temporárias e teste variantes de título em layouts mobile e desktop.</p>
          </div>

          <div className="flex items-center gap-2 rounded-[8px] border border-yt-bg-overlay bg-yt-bg-primary p-1 self-start lg:self-auto">
            {(["desktop", "mobile"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLayout(item)}
                className={`px-4 py-2 rounded-[6px] text-sm font-bold uppercase tracking-wider border-0 cursor-pointer ${layout === item ? "bg-yt-red text-white" : "bg-transparent text-yt-text-secondary hover:text-yt-text-primary"}`}
              >
                {item === "desktop" ? "Desktop" : "Mobile"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-10 p-7 min-w-0">
          {/* TOP AREA: Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            {/* Thumbnails section */}
            <div className="p-5 space-y-4 border border-yt-bg-overlay rounded-xl bg-yt-bg-primary/30">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-yt-text-disabled flex items-center gap-1.5 mb-1">
                  <span className="material-icons text-sm text-yt-red">science</span>
                  Teste A/B de Thumbnails
                </p>
                <p className="text-sm text-yt-text-secondary font-sans">
                  Faça o upload de até 3 miniaturas para comparar como elas performam.
                </p>
              </div>

              <input
                id="thumb-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
              />

              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((index) => {
                  const thumbnail = thumbnails[index];
                  const label = index === 0 ? "A" : index === 1 ? "B" : "C";
                  return (
                    <div
                      key={thumbnail?.id || `empty-${index}`}
                      onClick={() => !thumbnail && document.getElementById("thumb-upload")?.click()}
                      className={`relative group aspect-[16/9] rounded-lg border-2 overflow-hidden flex flex-col items-center justify-center transition-all ${
                        thumbnail
                          ? "border-transparent bg-yt-bg-elevated cursor-default"
                          : "border-dashed border-yt-bg-overlay bg-yt-bg-primary hover:border-yt-text-secondary hover:bg-yt-bg-elevated cursor-pointer"
                      }`}
                    >
                      {thumbnail ? (
                        <>
                          <img
                            src={thumbnail.url}
                            alt={thumbnail.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveThumbnail(thumbnail.id);
                              }}
                              className="w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-500 hover:scale-110 transition-transform cursor-pointer border-0"
                            >
                              <span className="material-icons text-sm">delete</span>
                            </button>
                          </div>
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white uppercase backdrop-blur-sm shadow-sm">
                            Miniatura {label}
                          </div>
                        </>
                      ) : (
                        <div className="text-yt-text-disabled flex flex-col items-center">
                          <span className="material-icons text-xl mb-1 group-hover:text-yt-text-primary transition-colors">add_circle</span>
                          <span className="text-[10px] font-bold uppercase tracking-wide group-hover:text-yt-text-primary transition-colors">Variante {label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {thumbnails.length < 3 && (
                <button 
                  onClick={() => document.getElementById("thumb-upload")?.click()}
                  className="w-full py-2.5 rounded-md border border-yt-bg-overlay bg-yt-bg-elevated text-xs font-bold uppercase tracking-wider text-yt-text-secondary hover:text-yt-text-primary hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-icons text-[16px]">upload_file</span>
                  Enviar miniaturas
                </button>
              )}
            </div>

            {/* ====== TITLES SECTION - ENHANCED ====== */}
            <div className="p-5 space-y-4 border border-yt-bg-overlay rounded-xl bg-yt-bg-primary/30">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-icons text-yt-red text-base">title</span>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-yt-text-disabled">Laboratório de Títulos</p>
                </div>
                <p className="text-sm text-yt-text-secondary font-sans">
                  Teste variantes de título e veja como ficam no feed. Todos os títulos são <strong className="text-yt-text-primary">salvos automaticamente</strong>.
                </p>
              </div>

              {/* Add new title form */}
              <form onSubmit={handleAddNewTitle} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="studio-input w-full py-3 px-4 pr-16 text-sm"
                    placeholder="Escreva uma variante de título..."
                    maxLength={120}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${newTitle.length > 70 ? "text-amber-400" : "text-yt-text-disabled"}`}>
                    {newTitle.length}/120
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="yt-btn-secondary shrink-0 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-icons text-sm">add</span>
                  Salvar
                </button>
              </form>

              {/* Title list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {allTitles.map((title, idx) => {
                  const isMain = title === idea.mainTitle;
                  const isSelected = title === selectedTitle;
                  const charCount = title.length;
                  const willTruncateDesktop = charCount > truncationLimit.desktop;
                  const willTruncateMobile = charCount > truncationLimit.mobile;

                  return (
                    <div
                      key={`${title}-${idx}`}
                      onClick={() => setSelectedTitle(title)}
                      className={`
                        group relative rounded-[8px] border p-3 cursor-pointer transition-all duration-200
                        ${isSelected
                          ? "border-yt-red bg-yt-red/[0.06] shadow-[0_0_0_1px_rgba(255,80,69,0.2)]"
                          : "border-yt-bg-overlay bg-yt-bg-primary hover:border-yt-text-secondary hover:bg-yt-bg-elevated"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Selection indicator */}
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-yt-red bg-yt-red" : "border-yt-bg-overlay"}`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title text */}
                          <p className={`text-sm font-semibold leading-5 ${isSelected ? "text-yt-text-primary" : "text-yt-text-secondary"}`}>
                            {title}
                          </p>

                          {/* Meta info row */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {isMain && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yt-red/15 text-yt-red text-[9px] font-bold uppercase tracking-widest rounded-full">
                                <span className="material-icons text-[10px]">star</span>
                                Principal
                              </span>
                            )}
                            <span className={`text-[10px] font-mono ${charCount > 70 ? "text-amber-400" : "text-yt-text-disabled"}`}>
                              {charCount} chars
                            </span>
                            {willTruncateDesktop && (
                              <span className="text-[9px] font-mono text-amber-400/80 flex items-center gap-0.5">
                                <span className="material-icons text-[10px]">warning</span>
                                Trunca no desktop
                              </span>
                            )}
                            {willTruncateMobile && !willTruncateDesktop && (
                              <span className="text-[9px] font-mono text-amber-400/60 flex items-center gap-0.5">
                                <span className="material-icons text-[10px]">phone_iphone</span>
                                Trunca no mobile
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {!isMain && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handlePromoteToMain(title); }}
                              className="p-1.5 rounded-md bg-transparent border-0 text-yt-text-disabled hover:text-amber-400 hover:bg-amber-400/10 cursor-pointer transition-colors"
                              title="Definir como título principal"
                            >
                              <span className="material-icons text-sm">star_outline</span>
                            </button>
                          )}
                          {!isMain && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRemoveTitle(title); }}
                              className="p-1.5 rounded-md bg-transparent border-0 text-yt-text-disabled hover:text-yt-red hover:bg-yt-red/10 cursor-pointer transition-colors"
                              title="Remover título"
                            >
                              <span className="material-icons text-sm">close</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {allTitles.length <= 1 && (
                  <div className="rounded-[8px] border border-dashed border-yt-bg-overlay px-4 py-6 text-center">
                    <span className="material-icons text-2xl text-yt-bg-overlay block mb-2">lightbulb</span>
                    <p className="text-[11px] text-yt-text-disabled font-sans">
                      Adicione variantes de título acima para comparar como cada uma aparece no feed do YouTube.
                    </p>
                  </div>
                )}
              </div>

              {/* Stats summary */}
              {allTitles.length > 1 && (
                <div className="flex items-center gap-3 p-3 bg-yt-bg-primary/50 border border-yt-bg-overlay rounded-[6px]">
                  <span className="material-icons text-sm text-yt-blue">analytics</span>
                  <span className="text-[10px] text-yt-text-secondary font-mono uppercase tracking-wider">
                    {allTitles.length} títulos salvos • Selecionado: <strong className="text-yt-text-primary">{selectedTitle.length} caracteres</strong>
                    {isTruncated && <span className="text-amber-400 ml-1">• Será truncado no {layout}</span>}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM AREA: Feed Mockup Area */}
          <div className="space-y-4 pt-8 border-t border-yt-bg-overlay">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-yt-text-disabled">Mockup do feed</p>
                <p className="text-sm text-yt-text-secondary font-sans">
                  {layout === "desktop" ? "Visualização desktop com cards ao redor." : "Visualização mobile com cards menores e lista vertical."}
                </p>
              </div>
              <span className={`studio-label ${isTruncated ? "text-amber-400" : "text-[#66bb6a]"}`}>
                {isTruncated ? "Título truncado" : "Título completo"}
              </span>
            </div>

            {layout === "desktop" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
                <div className="space-y-3 min-w-0">
                  {FAKE_CARDS.slice(0, 3).map((card, index) => (
  <MockCard key={card.title} {...card} thumbnail={thumbnails[index % thumbnails.length]} />
))}
                </div>

                <div className="space-y-3 sticky top-6">
                  <LiveCard title={selectedTitle} thumbnail={heroThumbnail} layout="desktop" />
                  <div className="rounded-[12px] border border-yt-bg-overlay bg-white/[0.02] p-4 text-xs text-yt-text-secondary font-sans leading-6">
                    <strong className="text-yt-text-primary">Truncamento visual:</strong> se o título passar do espaço do feed, a miniatura mostra o corte com fade e badge.
                  </div>
                </div>

                <div className="space-y-3">
                  {FAKE_CARDS.slice(3).map((card, index) => (
  <MockCard key={card.title} {...card} thumbnail={thumbnails[(index + 3) % thumbnails.length]} />
))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-xl mx-auto">
                <LiveCard title={selectedTitle} thumbnail={heroThumbnail} layout="mobile" />
                {secondaryThumbnails.map((thumbnail, index) => (
                  <article key={thumbnail.id} className="rounded-[14px] border border-yt-bg-overlay bg-yt-bg-primary overflow-hidden">
                    <div className="aspect-[16/9] bg-black/20 relative">
                      <img src={thumbnail.url} alt={thumbnail.name} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="p-3 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yt-bg-elevated border border-yt-bg-overlay flex items-center justify-center text-[10px] font-bold text-yt-text-primary shrink-0">{index + 2}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-yt-text-primary line-clamp-2">{selectedTitle}</p>
                        <p className="mt-1 text-xs text-yt-text-secondary font-sans">Feed mobile simulado</p>
                      </div>
                    </div>
                  </article>
                ))}
                <div className="grid grid-cols-1 gap-3">
                  {FAKE_CARDS.slice(0, 3).map((card) => (
                    <MockCard key={card.title} {...card} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}