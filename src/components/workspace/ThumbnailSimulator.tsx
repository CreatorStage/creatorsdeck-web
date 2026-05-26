import React, { useEffect, useMemo, useRef, useState } from "react";
import { VideoIdea } from "../../types";

interface ThumbnailSimulatorProps {
  idea: VideoIdea;
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

function MockCard({ title, channel, views, time, accent }: { title: string; channel: string; views: string; time: string; accent: string; }) {
  return (
    <article className="flex gap-3 rounded-[10px] p-2 hover:bg-white/5 transition-colors">
      <div className={`w-40 h-24 rounded-[10px] bg-gradient-to-br ${accent} relative overflow-hidden shrink-0`}>
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
          <p className="mt-1 text-xs text-yt-text-secondary font-sans">CreatorStage • 128 mil visualizações • há 2 dias</p>
        </div>
      </div>
    </article>
  );
}

export default function ThumbnailSimulator({ idea }: ThumbnailSimulatorProps) {
  const [layout, setLayout] = useState<"desktop" | "mobile">("desktop");
  const [thumbnails, setThumbnails] = useState<UploadedThumbnail[]>([]);
  const [customTitle, setCustomTitle] = useState("");
  const [selectedTitle, setSelectedTitle] = useState(idea.mainTitle || "");
  const thumbnailsRef = useRef<UploadedThumbnail[]>([]);

  const titles = useMemo(() => {
    const base = [idea.mainTitle, ...(idea.alternativeTitles || [])].filter(Boolean);
    if (customTitle.trim()) {
      base.push(customTitle.trim());
    }
    return Array.from(new Set(base));
  }, [idea.mainTitle, idea.alternativeTitles, customTitle]);

  useEffect(() => {
    setSelectedTitle(idea.mainTitle || idea.alternativeTitles?.[0] || "");
  }, [idea.id, idea.mainTitle, idea.alternativeTitles]);

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

  const heroThumbnail = thumbnails[0];
  const secondaryThumbnails = thumbnails.slice(1);

  return (
    <div className="space-y-6 pb-20">
      <section className="yt-card overflow-hidden">
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

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.35fr] gap-6 p-7">
          <div className="space-y-5">
            <div className="yt-card p-5 border border-yt-bg-overlay bg-yt-bg-primary/70 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-yt-text-disabled">Thumbnails</p>
                <p className="text-sm text-yt-text-secondary font-sans">Envie até 3 imagens. Elas ficam só no navegador até você recarregar a página.</p>
              </div>

              <input type="file" accept="image/*" multiple onChange={handleUpload} className="studio-input w-full p-3" />

              <div className="space-y-3">
                {thumbnails.length === 0 ? (
                  <div className="rounded-[10px] border border-dashed border-yt-bg-overlay px-4 py-8 text-center text-sm text-yt-text-disabled font-sans">Nenhuma thumbnail carregada ainda.</div>
                ) : (
                  thumbnails.map((thumbnail, index) => (
                    <div key={thumbnail.id} className="flex items-center gap-3 rounded-[10px] border border-yt-bg-overlay bg-yt-bg-primary p-3">
                      <div className="w-16 h-10 rounded overflow-hidden shrink-0 bg-yt-bg-elevated">
                        <img src={thumbnail.url} alt={thumbnail.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-yt-text-primary truncate">Thumbnail {index + 1}</p>
                        <p className="text-xs text-yt-text-secondary truncate font-sans">{thumbnail.name}</p>
                      </div>
                      <button type="button" onClick={() => handleRemoveThumbnail(thumbnail.id)} className="p-2 rounded-full bg-transparent border-0 text-yt-text-secondary hover:text-yt-red cursor-pointer">
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="yt-card p-5 border border-yt-bg-overlay bg-yt-bg-primary/70 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-yt-text-disabled">Títulos</p>
                <p className="text-sm text-yt-text-secondary font-sans">Clique em uma opção existente ou adicione uma nova variante para comparar o corte no feed.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const nextTitle = customTitle.trim();
                  if (!nextTitle) {
                    return;
                  }
                  setSelectedTitle(nextTitle);
                  setCustomTitle("");
                }}
                className="flex gap-3"
              >
                <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="studio-input flex-1 p-3" placeholder="Adicionar título extra" />
                <button type="submit" className="yt-btn-secondary shrink-0">Adicionar</button>
              </form>

              <div className="flex flex-wrap gap-2">
                {titles.map((title) => {
                  const active = selectedTitle === title;
                  return (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setSelectedTitle(title)}
                      className={`px-3 py-2 rounded-full text-sm border transition-colors ${active ? "border-yt-red bg-yt-red/15 text-yt-text-primary" : "border-yt-bg-overlay bg-transparent text-yt-text-secondary hover:text-yt-text-primary"}`}
                    >
                      {title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-yt-text-disabled">Mockup do feed</p>
                <p className="text-sm text-yt-text-secondary font-sans">
                  {layout === "desktop" ? "Visualização desktop com cards ao redor." : "Visualização mobile com cards menores e lista vertical."}
                </p>
              </div>
              <span className="studio-label text-yt-text-secondary">{selectedTitle.length > (layout === "desktop" ? truncationLimit.desktop : truncationLimit.mobile) ? "Título truncado" : "Título completo"}</span>
            </div>

            {layout === "desktop" ? (
              <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.25fr_0.85fr] gap-4 items-start">
                <div className="space-y-3">
                  {FAKE_CARDS.slice(0, 3).map((card) => (
                    <MockCard key={card.title} {...card} />
                  ))}
                </div>

                <div className="space-y-3 sticky top-6">
                  <LiveCard title={selectedTitle} thumbnail={heroThumbnail} layout="desktop" />
                  <div className="rounded-[12px] border border-yt-bg-overlay bg-white/[0.02] p-4 text-sm text-yt-text-secondary font-sans leading-7">
                    <strong className="text-yt-text-primary">Truncamento visual:</strong> se o título passar do espaço do feed, a miniatura mostra o corte com fade e badge.
                  </div>
                </div>

                <div className="space-y-3">
                  {FAKE_CARDS.slice(3).map((card) => (
                    <MockCard key={card.title} {...card} />
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