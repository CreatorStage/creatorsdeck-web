import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { Channel, DescriptionBlock } from "../../types";

interface DescriptionBuilderProps {
  channel: Channel;
}

const DEFAULT_BLOCKS: DescriptionBlock[] = [
  {
    id: "social",
    label: "Redes Sociais",
    content: "📱 Instagram: https://instagram.com/seucanal\n🐦 Twitter/X: https://x.com/seucanal"
  },
  {
    id: "sponsor",
    label: "Patrocinador",
    content: "Este vídeo conta com o apoio de [Marca]. Confira o link especial na descrição."
  },
  {
    id: "chapters",
    label: "Capítulos",
    content: "00:00 Introdução\n01:20 Contexto\n04:10 Demonstração\n08:00 Conclusão"
  },
  {
    id: "legal",
    label: "Aviso Legal",
    content: "Alguns links podem ser afiliados. Isso não altera o preço para você."
  },
  {
    id: "hashtags",
    label: "Hashtags",
    content: "#youtube #criacao #conteudo #produtividade"
  }
];

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `block-${Math.random().toString(36).slice(2, 10)}`;
};

const parseBlocks = (raw?: string): DescriptionBlock[] => {
  if (!raw) {
    return DEFAULT_BLOCKS;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item && typeof item.label === "string" && typeof item.content === "string")
        .map((item) => ({
          id: typeof item.id === "string" && item.id.trim() ? item.id : createId(),
          label: item.label,
          content: item.content
        }));
    }
  } catch {
    // fallback abaixo
  }

  return DEFAULT_BLOCKS;
};

export default function DescriptionBuilder({ channel }: DescriptionBuilderProps) {
  const [blocks, setBlocks] = useState<DescriptionBlock[]>(() => parseBlocks(channel.descriptionBlocks));
  const [selectedIds, setSelectedIds] = useState<string[]>(() => parseBlocks(channel.descriptionBlocks).map((block) => block.id));
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editorLabel, setEditorLabel] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    const nextBlocks = parseBlocks(channel.descriptionBlocks);
    setBlocks(nextBlocks);
    setSelectedIds(nextBlocks.map((block) => block.id));
    setEditorId(null);
    setEditorLabel("");
    setEditorContent("");
  }, [channel.id, channel.descriptionBlocks]);

  const previewText = useMemo(() => {
    const selected = blocks.filter((block) => selectedIds.includes(block.id));
    if (selected.length === 0) {
      return "Selecione um ou mais blocos para gerar o preview da descrição.";
    }

    return selected
      .map((block) => `${block.label}\n${block.content}`.trim())
      .join("\n\n");
  }, [blocks, selectedIds]);

  const persistBlocks = async (nextBlocks: DescriptionBlock[]) => {
    setSaving(true);
    try {
      const updated = await api.updateChannel(channel.id, {
        descriptionBlocks: JSON.stringify(nextBlocks)
      });
      setBlocks(nextBlocks);
      setSelectedIds((current) => current.filter((id) => nextBlocks.some((block) => block.id === id)));
      return updated;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const handleEdit = (block: DescriptionBlock) => {
    setEditorId(block.id);
    setEditorLabel(block.label);
    setEditorContent(block.content);
  };

  const handleDelete = async (id: string) => {
    const nextBlocks = blocks.filter((block) => block.id !== id);
    await persistBlocks(nextBlocks);
    setSelectedIds((current) => current.filter((item) => item !== id));
    if (editorId === id) {
      setEditorId(null);
      setEditorLabel("");
      setEditorContent("");
    }
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = editorLabel.trim();
    const content = editorContent.trim();
    if (!label || !content) {
      return;
    }

    const nextBlocks = editorId
      ? blocks.map((block) => block.id === editorId ? { ...block, label, content } : block)
      : [...blocks, { id: createId(), label, content }];

    await persistBlocks(nextBlocks);
    setEditorId(null);
    setEditorLabel("");
    setEditorContent("");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewText);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch (err) {
      console.error("Falha ao copiar a descrição", err);
    }
  };

  return (
    <div className="w-full space-y-6 p-7">
      <section className="overflow-hidden">
        <div className="px-7 py-5 border-b border-yt-bg-overlay flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-icons text-yt-red text-lg">description</span>
            <h2 className="text-sm font-bold text-yt-text-primary uppercase tracking-wider">Montador de descrição</h2>
          </div>
          <button type="button" onClick={handleCopy} className="yt-btn-primary flex items-center gap-2">
            <span className="material-icons text-sm">content_copy</span>
            {copyStatus === "copied" ? "Copiado" : "Copiar Descrição Completa"}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.2fr] gap-6 p-7">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-yt-text-disabled">Blocos disponíveis</p>
                <p className="text-sm text-yt-text-secondary font-sans">Clique para selecionar o que entra na descrição final.</p>
              </div>
              <span className="studio-label text-yt-text-secondary">{blocks.length} blocos</span>
            </div>

            <div className="grid gap-3">
              {blocks.map((block) => {
                const active = selectedIds.includes(block.id);
                return (
                  <article
                    key={block.id}
                    onClick={() => handleToggleBlock(block.id)}
                    className={`rounded-[8px] border p-4 cursor-pointer transition-all ${
                      active ? "border-yt-red bg-yt-red/10" : "border-yt-bg-overlay bg-yt-bg-primary hover:border-yt-text-secondary"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-yt-text-primary truncate">{block.label}</h3>
                        <p className="text-xs text-yt-text-secondary font-sans whitespace-pre-line mt-2 leading-6">{block.content}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(block);
                          }}
                          className="p-2 rounded-full bg-transparent border-0 text-yt-text-secondary hover:text-yt-text-primary cursor-pointer"
                          title="Editar bloco"
                        >
                          <span className="material-icons text-sm">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(block.id);
                          }}
                          className="p-2 rounded-full bg-transparent border-0 text-yt-text-secondary hover:text-yt-red cursor-pointer"
                          title="Excluir bloco"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <form onSubmit={handleSaveBlock} className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-yt-text-primary">{editorId ? "Editar bloco" : "Novo bloco"}</h3>
                {editorId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditorId(null);
                      setEditorLabel("");
                      setEditorContent("");
                    }}
                    className="text-xs text-yt-text-secondary hover:text-yt-text-primary bg-transparent border-0 cursor-pointer"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <input
                value={editorLabel}
                onChange={(e) => setEditorLabel(e.target.value)}
                className="studio-input w-full p-3"
                placeholder="Título do bloco, ex.: Capítulos"
              />
              <textarea
                rows={5}
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="studio-input w-full p-3 resize-none"
                placeholder="Conteúdo do bloco"
              />

              <div className="flex items-center justify-end gap-3">
                <button type="submit" disabled={saving} className="yt-btn-primary disabled:opacity-60">
                  {saving ? "Salvando..." : editorId ? "Atualizar bloco" : "Salvar bloco"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-yt-text-disabled">Preview em tempo real</p>
              <p className="text-sm text-yt-text-secondary font-sans">O texto abaixo é exatamente o que será copiado para a descrição.</p>
            </div>

            <div className="rounded-[8px] border border-yt-bg-overlay bg-yt-bg-primary p-5 min-h-[320px] whitespace-pre-wrap text-sm leading-7 text-yt-text-primary font-sans">
              {previewText}
            </div>

            <div className="rounded-[8px] border border-yt-bg-overlay bg-white/[0.02] p-4 text-xs text-yt-text-secondary font-sans">
              Use os blocos para montar descrições reutilizáveis por canal e mantenha seus CTAs, capítulos e links sempre consistentes.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}