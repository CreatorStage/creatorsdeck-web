import React from "react";
import { ScriptVersion } from "../../types";
import { ScriptBlock } from "./scriptUtils";
import ScriptBlockCard from "./ScriptBlockCard";

interface ScriptEditorProps {
  editorMode: "continuous" | "blocks";
  onToggleMode: (mode: "continuous" | "blocks") => void;

  // --- Blocks mode ---
  blocks: ScriptBlock[];
  onUpdateBlock: (index: number, newHtml: string) => void;
  onDeleteBlock: (index: number) => void;
  onDuplicateBlock: (index: number) => void;
  onChangeBlockType: (index: number, type: "paragraph" | "hook" | "dev" | "final" | "cta") => void;
  onInsertBlock: (index: number, type: "paragraph" | "hook" | "dev" | "final" | "cta") => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  draggedBlockIndex: number | null;
  dragOverBlockIndex: number | null;

  // --- Continuous mode ---
  editorRef: React.RefObject<HTMLDivElement | null>;
  onEditorInput: (e: React.FormEvent<HTMLDivElement>) => void;
  onInsertQuickBlock: (type: "hook" | "dev" | "final" | "cta") => void;
  ctaTemplates: string[];
  scriptVersions: ScriptVersion[];
  loadingVersions: boolean;
  onCreateVersion: () => void;
  onRestoreVersion: (versionId: string) => void;

  // --- Shared stats ---
  wordCount: number;
  estimatedDuration: number;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({
  editorMode,
  onToggleMode,
  blocks,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onChangeBlockType,
  onInsertBlock,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggedBlockIndex,
  dragOverBlockIndex,
  editorRef,
  onEditorInput,
  onInsertQuickBlock,
  ctaTemplates,
  scriptVersions,
  loadingVersions,
  onCreateVersion,
  onRestoreVersion,
  wordCount,
  estimatedDuration,
}) => {
  return (
    <div className="w-full space-y-4 p-7">

      {/* Header + Mode Toggle */}
      <div className="flex items-center justify-between border-b border-yt-bg-overlay/50 pb-3 mb-2 flex-wrap gap-3 select-none">
        <div>
          <h3 className="text-sm font-semibold text-yt-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-icons text-yt-red">article</span>
            Roteiro Inteligente e Modular
          </h3>
          <p className="text-[11px] text-yt-text-secondary">
            Organize suas falas de forma visual por blocos ou escreva texto contínuo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCreateVersion}
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1 transition-all cursor-pointer bg-yt-bg-elevated hover:bg-yt-bg-overlay text-yt-text-primary border border-yt-bg-overlay"
          >
            <span className="material-icons text-sm">history</span>
            Salvar Versão
          </button>

          <div className="flex bg-yt-bg-primary border border-yt-bg-overlay p-0.5 rounded-sm">
            <button
              type="button"
              onClick={() => onToggleMode("blocks")}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1 transition-all cursor-pointer ${
                editorMode === "blocks"
                  ? "bg-yt-red text-white"
                  : "text-yt-text-secondary hover:text-yt-text-primary"
              }`}
            >
              <span className="material-icons text-sm">dashboard</span>
              <span>Blocos de Lego 🧱</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleMode("continuous")}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1 transition-all cursor-pointer ${
                editorMode === "continuous"
                  ? "bg-yt-red text-white"
                  : "text-yt-text-secondary hover:text-yt-text-primary"
              }`}
            >
              <span className="material-icons text-sm">edit_note</span>
              <span>Texto Contínuo 📝</span>
            </button>
          </div>
        </div>
      </div>

      {ctaTemplates.length > 0 && (
        <div className="p-3 bg-yt-bg-primary/50 border border-yt-bg-overlay rounded-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-icons text-[#66bb6a] text-base">campaign</span>
            <span className="text-[10px] font-mono text-yt-text-secondary uppercase tracking-wider">Banco de CTAs do canal</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ctaTemplates.map((cta, index) => (
              <button
                key={`${cta}-${index}`}
                type="button"
                onClick={() => {
                  if (editorMode === "continuous" && editorRef.current) {
                    const html = `<div style="background-color: rgba(5, 150, 105, 0.22); border-left: 4px solid #34d399; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #ecfdf5;"><span contenteditable="false" style="background-color: #059669; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">CTA</span>${cta}</div>`;
                    editorRef.current.focus();
                    document.execCommand("insertHTML", false, html);
                    onEditorInput({ currentTarget: editorRef.current } as any);
                  } else {
                    onInsertBlock(blocks.length, "cta");
                  }
                }}
                className="max-w-full truncate px-3 py-1.5 bg-[#064e3b]/40 hover:bg-[#065f46]/60 text-[#6ee7b7] border border-[#065f46] text-[10px] font-mono rounded-sm uppercase tracking-wider"
                title={cta}
              >
                {cta}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- BLOCKS MODE ---- */}
      {editorMode === "blocks" && (
        <div className="space-y-4">
          {/* Block type insert toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-yt-bg-primary/50 border border-yt-bg-overlay rounded-sm select-none">
            <span className="text-[10px] font-mono text-yt-text-secondary uppercase tracking-wider">Criar Bloco:</span>
            <button
              type="button"
              onClick={() => onInsertBlock(blocks.length, "hook")}
              className="px-2.5 py-1 bg-[#ff3b30]/15 hover:bg-[#ff3b30]/25 text-[#ff3b30] text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider cursor-pointer"
            >
              + Gancho
            </button>
            <button
              type="button"
              onClick={() => onInsertBlock(blocks.length, "dev")}
              className="px-2.5 py-1 bg-[#3ea6ff]/15 hover:bg-[#3ea6ff]/25 text-[#3ea6ff] text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider cursor-pointer"
            >
              + Conteúdo
            </button>
            <button
              type="button"
              onClick={() => onInsertBlock(blocks.length, "final")}
              className="px-2.5 py-1 bg-[#ff9500]/15 hover:bg-[#ff9500]/25 text-[#ff9500] text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider cursor-pointer"
            >
              + Conclusão
            </button>
            <button
              type="button"
              onClick={() => onInsertBlock(blocks.length, "cta")}
              className="px-2.5 py-1 bg-[#4cd964]/15 hover:bg-[#4cd964]/25 text-[#4cd964] text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider cursor-pointer"
            >
              + CTA
            </button>
            <button
              type="button"
              onClick={() => onInsertBlock(blocks.length, "paragraph")}
              className="px-2.5 py-1 bg-yt-bg-elevated hover:bg-yt-bg-overlay text-yt-text-secondary text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider cursor-pointer"
            >
              + Texto Comum
            </button>
          </div>

          {/* Draggable block list */}
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {blocks.map((block, idx) => (
              <React.Fragment key={block.id}>
                {/* Drop zone before each block */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedBlockIndex !== null) {
                      onDrop(e, idx);
                    }
                  }}
                  className="h-2 hover:h-4 bg-transparent hover:bg-yt-red/20 rounded transition-all cursor-pointer relative group/line flex items-center justify-center"
                >
                  <div className="w-full h-[2px] bg-transparent group-hover/line:bg-yt-red/35" />
                  <div className="absolute opacity-0 group-hover/line:opacity-100 transition-opacity pointer-events-none">
                    <span className="bg-yt-red text-[7px] font-mono font-bold text-white px-2 py-0.5 rounded uppercase tracking-widest leading-none">
                      Mover para cá 🧱
                    </span>
                  </div>
                </div>

                <ScriptBlockCard
                  block={block}
                  index={idx}
                  onUpdate={onUpdateBlock}
                  onDelete={onDeleteBlock}
                  onDuplicate={onDuplicateBlock}
                  onChangeType={onChangeBlockType}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  isDragging={draggedBlockIndex === idx}
                  isDragOver={dragOverBlockIndex === idx}
                />
              </React.Fragment>
            ))}

            {/* Drop zone at the end */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedBlockIndex !== null) {
                  onDrop(e, blocks.length);
                }
              }}
              className="h-3 hover:h-5 bg-transparent hover:bg-yt-red/20 rounded transition-all cursor-pointer relative group/lastline flex items-center justify-center mt-1"
            >
              <div className="w-full h-[2px] bg-transparent group-hover/lastline:bg-yt-red/35" />
              <div className="absolute opacity-0 group-hover/lastline:opacity-100 transition-opacity pointer-events-none">
                <span className="bg-yt-red text-[7px] font-mono font-bold text-white px-2 py-0.5 rounded uppercase tracking-widest leading-none">
                  Mover para o fim 🧱
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- CONTINUOUS MODE ---- */}
      {editorMode === "continuous" && (
        <div className="space-y-4">
          {/* Quick-insert toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-yt-bg-primary/50 border border-yt-bg-overlay rounded-sm select-none">
            <span className="text-[10px] font-mono text-yt-text-secondary uppercase tracking-wider">Inserir Bloco:</span>
            <button
              type="button"
              onClick={() => onInsertQuickBlock("hook")}
              className="px-2.5 py-1 bg-[#ff3b30]/15 hover:bg-[#ff3b30]/25 text-[#ff3b30] text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider cursor-pointer"
            >
              + Gancho
            </button>
            <button
              type="button"
              onClick={() => onInsertQuickBlock("dev")}
              className="px-2.5 py-1 bg-[#3ea6ff]/15 hover:bg-[#3ea6ff]/25 text-[#3ea6ff] text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider cursor-pointer"
            >
              + Conteúdo
            </button>
            <button
              type="button"
              onClick={() => onInsertQuickBlock("final")}
              className="px-2.5 py-1 bg-[#ff9500]/15 hover:bg-[#ff9500]/25 text-[#ff9500] text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider cursor-pointer"
            >
              + Conclusão
            </button>
            <button
              type="button"
              onClick={() => onInsertQuickBlock("cta")}
              className="px-2.5 py-1 bg-[#4cd964]/15 hover:bg-[#4cd964]/25 text-[#4cd964] text-[10px] font-mono font-semibold rounded-full uppercase tracking-wider cursor-pointer"
            >
              + CTA
            </button>
          </div>

          {/* ContentEditable rich text area */}
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable={true}
              onInput={onEditorInput}
              className="w-full min-h-[400px] max-h-[600px] overflow-y-auto p-5 bg-yt-bg-primary border border-yt-bg-overlay text-yt-text-primary rounded-sm text-lg focus:outline-none focus:border-yt-red leading-relaxed font-sans"
              style={{ outline: "none" }}
            />
            {/* Placeholder — rendered only when editor is empty via CSS :empty trick isn't reliable so we use data attr */}
            <div className="absolute top-5 left-5 text-yt-text-disabled pointer-events-none select-none text-base empty-placeholder">
              Escreva o roteiro oficial do seu vídeo aqui. Destaque palavras importantes, adicione ganchos ou altere as cores de fundo para leitura dinâmica...
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 p-3 bg-yt-bg-primary border border-yt-bg-overlay rounded-sm gap-2 text-xs font-mono text-yt-text-secondary">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="material-icons text-base text-yt-red">article</span>
            <strong>{wordCount}</strong> palavras
          </span>
          <span className="h-4 w-[1px] bg-yt-bg-overlay hidden sm:inline" />
          <span className="flex items-center gap-1.5 text-yt-text-primary">
            <span className="material-icons text-base text-[#66bb6a]">schedule</span>
            Locução prevista:{" "}
            <strong>≈ {estimatedDuration} segundos</strong>
            <span className="text-[10px] text-yt-text-secondary">
              ({Math.floor(estimatedDuration / 60)}m {estimatedDuration % 60}s)
            </span>
          </span>
        </div>
        <div className="text-[10px] text-yt-text-disabled uppercase tracking-wider">
          Parâmetro: 155 palavras por minuto (fala padrão)
        </div>
      </div>

      <section className="mt-4 bg-yt-bg-primary border border-yt-bg-overlay rounded-sm p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-yt-text-primary flex items-center gap-2">
              <span className="material-icons text-yt-red text-base">manage_history</span>
              Histórico de Versões
            </h4>
            <p className="text-[11px] text-yt-text-secondary mt-1">Restaure snapshots antigos do roteiro quando precisar comparar ou voltar uma versão.</p>
          </div>
          <span className="text-[10px] bg-yt-bg-surface border border-yt-bg-overlay text-yt-text-secondary px-2 py-1 rounded-sm font-mono">
            {scriptVersions.length} versões
          </span>
        </div>

        {loadingVersions ? (
          <div className="py-8 text-center text-yt-text-secondary text-xs uppercase tracking-wider">
            Carregando histórico...
          </div>
        ) : scriptVersions.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-yt-bg-overlay text-yt-text-disabled text-xs uppercase tracking-wider">
            Nenhuma versão salva ainda.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {scriptVersions.map((version) => (
              <div key={version.id} className="flex items-center justify-between gap-3 bg-yt-bg-surface border border-yt-bg-overlay p-3 rounded-sm">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-yt-text-primary truncate">{version.label}</p>
                  <p className="text-[10px] text-yt-text-secondary font-mono uppercase tracking-wider">
                    {new Date(version.createdAt).toLocaleString("pt-BR")} - {version.wordCount} palavras
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRestoreVersion(version.id)}
                  className="shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-yt-red hover:bg-yt-red/10 border border-yt-red/30 rounded-sm"
                >
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ScriptEditor;
