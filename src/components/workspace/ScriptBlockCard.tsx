import React, { useState, useEffect, useRef } from "react";
import { ScriptBlock } from "./scriptUtils";

interface ScriptBlockCardProps {
  block: ScriptBlock;
  index: number;
  onUpdate: (index: number, html: string) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onChangeType: (index: number, type: "paragraph" | "hook" | "dev" | "final" | "cta") => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

const ScriptBlockCard: React.FC<ScriptBlockCardProps> = ({
  block,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onChangeType,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const [blockFontSizeOpen, setBlockFontSizeOpen] = useState(false);
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    if (localRef.current && document.activeElement !== localRef.current) {
      localRef.current.innerHTML = block.html;
    }
  }, [block.html]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onUpdate(index, e.currentTarget.innerHTML);
  };

  const handleBlur = () => {
    if (localRef.current) {
      onUpdate(index, localRef.current.innerHTML);
    }
  };

  const saveCurrentSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const applyBlockFontSize = (sizePx: number) => {
    if (!localRef.current) return;

    const sel = window.getSelection();
    let range: Range | null = null;

    if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
      range = sel.getRangeAt(0);
    } else if (savedRangeRef.current && !savedRangeRef.current.collapsed) {
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
      range = savedRangeRef.current;
    }

    if (!range || range.collapsed) {
      const currentHTML = localRef.current.innerHTML;
      localRef.current.innerHTML = `<span style="font-size: ${sizePx}px">${currentHTML}</span>`;
      onUpdate(index, localRef.current.innerHTML);
      savedRangeRef.current = null;
      return;
    }

    try {
      const fragment = range.extractContents();
      const span = document.createElement('span');
      span.style.fontSize = `${sizePx}px`;
      span.appendChild(fragment);
      range.insertNode(span);
      if (sel) sel.removeAllRanges();
    } catch {
      const currentHTML = localRef.current.innerHTML;
      localRef.current.innerHTML = `<span style="font-size: ${sizePx}px">${currentHTML}</span>`;
    }

    onUpdate(index, localRef.current.innerHTML);
    savedRangeRef.current = null;
  };

  const typeConfigs = {
    paragraph: {
      borderClass: "border border-yt-bg-overlay border-l-4 border-l-yt-text-secondary",
      bgClass: "bg-yt-bg-surface hover:bg-yt-bg-elevated text-yt-text-primary",
      badgeColor: "bg-yt-bg-overlay text-yt-text-secondary border border-yt-bg-overlay",
      badgeLabel: "PARÁGRAFO",
      icon: "notes"
    },
    hook: {
      borderClass: "border border-yt-bg-overlay border-l-4 border-l-red-500",
      bgClass: "bg-yt-bg-surface hover:bg-yt-bg-elevated text-yt-text-primary",
      badgeColor: "bg-red-600/70 text-red-100 border border-red-500/50",
      badgeLabel: "GANCHO",
      icon: "anchor"
    },
    dev: {
      borderClass: "border border-yt-bg-overlay border-l-4 border-l-blue-400",
      bgClass: "bg-yt-bg-surface hover:bg-yt-bg-elevated text-yt-text-primary",
      badgeColor: "bg-blue-600/70 text-blue-100 border border-blue-500/50",
      badgeLabel: "CONTEÚDO",
      icon: "article"
    },
    final: {
      borderClass: "border border-yt-bg-overlay border-l-4 border-l-amber-400",
      bgClass: "bg-yt-bg-surface hover:bg-yt-bg-elevated text-yt-text-primary",
      badgeColor: "bg-amber-600/70 text-amber-100 border border-amber-500/50",
      badgeLabel: "CONCLUSÃO",
      icon: "check_circle"
    },
    cta: {
      borderClass: "border border-yt-bg-overlay border-l-4 border-l-emerald-400",
      bgClass: "bg-yt-bg-surface hover:bg-yt-bg-elevated text-yt-text-primary",
      badgeColor: "bg-emerald-600/70 text-emerald-100 border border-emerald-500/50",
      badgeLabel: "CTA",
      icon: "campaign"
    }
  };

  const config = typeConfigs[block.type] || typeConfigs.paragraph;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative flex items-start gap-3 p-4 rounded-sm border transition-all duration-200 ${config.borderClass} ${config.bgClass} ${
        isDragging ? "opacity-30 scale-[0.98] border-dashed border-yt-red" : ""
      } ${isDragOver ? "border-t-2 border-t-yt-red pt-6 scale-[1.01]" : ""}`}
    >
      <div 
        className="cursor-grab active:cursor-grabbing text-yt-text-disabled hover:text-yt-text-secondary transition-colors p-1 flex items-center justify-center select-none"
        title="Arraste para mover"
      >
        <span className="material-icons text-lg">drag_indicator</span>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2 select-none border-b border-yt-bg-overlay/20 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="material-icons text-base text-yt-text-disabled">{config.icon}</span>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full tracking-wider ${config.badgeColor}`}>
              {config.badgeLabel}
            </span>
            <span className="text-[10px] text-yt-text-disabled font-mono">Bloco #{index + 1}</span>
          </div>

          <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] font-mono text-yt-text-disabled mr-1">Tipo:</span>
            <select
              value={block.type}
              onChange={(e) => onChangeType(index, e.target.value as any)}
              className="bg-yt-bg-primary border border-yt-bg-overlay text-[10px] font-semibold text-yt-text-secondary rounded px-1.5 py-0.5 focus:outline-none focus:border-yt-red cursor-pointer uppercase tracking-wider"
            >
              <option value="paragraph">Parágrafo</option>
              <option value="hook">Gancho</option>
              <option value="dev">Conteúdo</option>
              <option value="final">Conclusão</option>
              <option value="cta">CTA</option>
            </select>

            <span className="h-3 w-[1px] bg-yt-bg-overlay mx-1"></span>

            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveCurrentSelection();
                  setBlockFontSizeOpen(!blockFontSizeOpen);
                }}
                className="p-1 hover:bg-yt-bg-elevated rounded text-yt-text-secondary hover:text-yt-text-primary transition-colors cursor-pointer flex items-center gap-0.5"
                title="Tamanho da fonte"
              >
                <span className="material-icons text-sm">format_size</span>
                <span className="material-icons text-[10px]">arrow_drop_down</span>
              </button>
              {blockFontSizeOpen && (
                <div className="absolute right-0 mt-1 bg-yt-bg-surface border border-yt-bg-overlay rounded shadow-xl p-1 z-50 flex flex-col min-w-[120px]">
                  {[
                    { label: "Pequeno — 12px", size: 12 },
                    { label: "Normal — 16px",  size: 16 },
                    { label: "Médio — 20px",   size: 20 },
                    { label: "Grande — 24px",  size: 24 },
                    { label: "Título — 32px",  size: 32 },
                    { label: "Display — 40px", size: 40 },
                    { label: "Banner — 48px",  size: 48 },
                  ].map((opt) => (
                    <button
                      key={opt.size}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyBlockFontSize(opt.size);
                        setBlockFontSizeOpen(false);
                      }}
                      className="px-3 py-1 text-left hover:bg-yt-red/10 text-yt-text-primary transition-colors cursor-pointer rounded-sm"
                      style={{ fontSize: `${Math.min(opt.size, 13)}px` }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="h-3 w-[1px] bg-yt-bg-overlay mx-1"></span>

            <button
              type="button"
              onClick={() => onDuplicate(index)}
              className="p-1 hover:bg-yt-bg-elevated rounded text-yt-text-secondary hover:text-yt-text-primary transition-colors cursor-pointer flex items-center justify-center"
              title="Duplicar bloco"
            >
              <span className="material-icons text-sm">content_copy</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(index)}
              className="p-1 hover:bg-red-950/30 rounded text-yt-text-secondary hover:text-red-400 transition-colors cursor-pointer flex items-center justify-center"
              title="Excluir bloco"
            >
              <span className="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>

        <div
          ref={localRef}
          contentEditable={true}
          onInput={handleInput}
          onBlur={handleBlur}
          className="w-full text-base leading-relaxed text-yt-text-primary focus:outline-none"
          style={{ outline: "none", wordBreak: "break-word" }}
        />
      </div>
    </div>
  );
};

export default ScriptBlockCard;
