import React, { useEffect, useMemo, useState } from "react";
import { ChecklistStateEntry, VideoIdeaStatus } from "../../types";

interface ChecklistDialogProps {
  open: boolean;
  status: VideoIdeaStatus;
  statusLabel: string;
  templateItems: string[];
  initialState?: ChecklistStateEntry | null;
  onClose: () => void;
  onConfirm: (completedItems: string[], skippedItems: string[]) => void;
  onSkip: () => void;
}

export default function ChecklistDialog({
  open,
  status,
  statusLabel,
  templateItems,
  initialState,
  onClose,
  onConfirm,
  onSkip
}: ChecklistDialogProps) {
  const initialCompleted = useMemo(() => new Set(initialState?.completed || templateItems), [initialState, templateItems]);
  const [completed, setCompleted] = useState<Set<string>>(initialCompleted);

  useEffect(() => {
    if (open) {
      setCompleted(new Set(initialState?.completed || templateItems));
    }
  }, [open, initialState, templateItems, status]);

  if (!open) {
    return null;
  }

  const allChecked = templateItems.length === 0 || templateItems.every((item) => completed.has(item));

  const handleToggle = (item: string) => {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  const confirmedItems = templateItems.filter((item) => completed.has(item));
  const skippedItems = templateItems.filter((item) => !completed.has(item));

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-[10px] border border-yt-bg-overlay bg-yt-bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-yt-text-disabled font-bold">Checklist de produção</p>
            <h3 className="text-2xl font-extrabold text-yt-text-primary">{statusLabel}</h3>
            <p className="text-sm text-yt-text-secondary font-sans">Marque os itens obrigatórios antes de mover a ideia para esta etapa.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full bg-transparent border-0 text-yt-text-secondary hover:text-yt-text-primary cursor-pointer">
            <span className="material-icons">close</span>
          </button>
        </div>

        {templateItems.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-yt-bg-overlay bg-white/[0.02] px-4 py-8 text-center text-sm text-yt-text-disabled font-sans">
            Nenhum item configurado para esta etapa.
          </div>
        ) : (
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {templateItems.map((item) => (
              <label key={item} className="flex items-start gap-3 rounded-[8px] border border-yt-bg-overlay bg-yt-bg-primary px-4 py-3 cursor-pointer hover:border-yt-red/40 transition-colors">
                <input
                  type="checkbox"
                  checked={completed.has(item)}
                  onChange={() => handleToggle(item)}
                  className="mt-1 accent-[#ff5045]"
                />
                <span className="text-sm text-yt-text-primary leading-6">{item}</span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button type="button" onClick={onSkip} className="yt-btn-secondary">
            Pular
          </button>
          <button
            type="button"
            onClick={() => onConfirm(confirmedItems, skippedItems)}
            disabled={!allChecked}
            className="yt-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar e Mover
          </button>
        </div>
      </div>
    </div>
  );
}