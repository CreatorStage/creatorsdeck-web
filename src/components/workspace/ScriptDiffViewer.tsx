import React, { useMemo } from 'react';
import * as Diff from 'diff';

interface ScriptDiffViewerProps {
  oldText: string;
  newText: string;
  versionLabel: string;
  onClose: () => void;
  onRestore: () => void;
}

const ScriptDiffViewer: React.FC<ScriptDiffViewerProps> = ({ oldText, newText, versionLabel, onClose, onRestore }) => {
  const { diffResult, addedCount, removedCount } = useMemo(() => {
    const result = Diff.diffWordsWithSpace(oldText, newText);
    
    let added = 0;
    let removed = 0;
    
    result.forEach(part => {
      const wordCount = part.value.split(/\s+/).filter(w => w.trim()).length;
      if (part.added) added += wordCount;
      if (part.removed) removed += wordCount;
    });
    
    return { diffResult: result, addedCount: added, removedCount: removed };
  }, [oldText, newText]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-yt-bg-elevated border border-yt-bg-overlay rounded-md w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-yt-bg-overlay">
          <div>
            <h3 className="text-lg font-bold text-yt-text-primary flex items-center gap-2">
              <span className="material-icons text-yt-red">compare_arrows</span>
              Comparando Versões
            </h3>
            <p className="text-xs text-yt-text-secondary mt-1">
              <strong>{versionLabel}</strong> vs <strong>Roteiro Atual</strong>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-yt-bg-overlay text-yt-text-secondary transition-colors border-0 bg-transparent cursor-pointer"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 px-4 py-3 bg-yt-bg-surface border-b border-yt-bg-overlay text-sm font-medium">
          <span className="text-green-600 dark:text-green-400">+{addedCount} palavras adicionadas no atual</span>
          <span className="text-red-600 dark:text-red-400">-{removedCount} palavras removidas do antigo</span>
        </div>

        {/* Diff Content */}
        <div className="p-6 overflow-y-auto flex-1 font-sans text-sm leading-relaxed bg-yt-bg-surface whitespace-pre-wrap">
          {diffResult.map((part, index) => {
            if (part.added) {
              return (
                <span key={index} className="bg-green-500/20 text-green-700 dark:text-green-400 rounded-sm">
                  {part.value}
                </span>
              );
            }
            if (part.removed) {
              return (
                <span key={index} className="bg-red-500/20 text-red-700 dark:text-red-400 line-through rounded-sm opacity-70">
                  {part.value}
                </span>
              );
            }
            return (
              <span key={index} className="text-yt-text-primary">
                {part.value}
              </span>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-yt-bg-overlay flex justify-end gap-3 bg-yt-bg-elevated">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-yt-text-primary hover:bg-yt-bg-overlay rounded-sm transition-colors border border-yt-bg-overlay cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Isso irá sobrescrever o roteiro atual com o texto de "${versionLabel}". Deseja continuar?`)) {
                onRestore();
                onClose();
              }
            }}
            className="px-4 py-2 text-sm font-semibold bg-yt-red text-white hover:bg-[#ff3025] rounded-sm transition-colors cursor-pointer border-0 flex items-center gap-2"
          >
            <span className="material-icons text-[18px]">restore</span>
            Restaurar esta versão
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptDiffViewer;
