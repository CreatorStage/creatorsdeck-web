import React from "react";
import { Note } from "../../types";

interface NoteManagerProps {
  notes: Note[];
  loadingNotes: boolean;
  newNoteText: string;
  onNewNoteChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAddNote: (e: React.FormEvent) => void;
  onDeleteNote: (id: string) => void;
}

const NoteManager: React.FC<NoteManagerProps> = ({
  notes,
  loadingNotes,
  newNoteText,
  onNewNoteChange,
  onAddNote,
  onDeleteNote
}) => {
  const charCount = newNoteText.length;

  return (
    <div className="w-full space-y-6 p-7">

      {/* Editor de Notas */}
      <section className="overflow-hidden">
        <div className="px-6 py-4 border-b border-yt-bg-overlay flex items-center gap-2">
          <span className="material-icons text-yt-red text-base">edit_note</span>
          <h3 className="text-xs font-bold text-yt-text-primary uppercase tracking-wider">Anotações Rápidas</h3>
        </div>

        <form onSubmit={onAddNote} className="p-6">
          <div className="bg-yt-bg-primary border border-yt-bg-overlay rounded-[4px] focus-within:border-yt-red transition-colors">
            <textarea
              rows={6}
              value={newNoteText}
              onChange={onNewNoteChange}
              placeholder="Ideias aleatórias, lembretes de edição, sugestões de patrocinadores, links para pesquisas..."
              className="w-full bg-transparent text-yt-text-primary text-sm leading-relaxed resize-none focus:outline-none placeholder:text-yt-text-disabled p-4"
            />
            <div className="flex justify-between items-center px-4 py-3 border-t border-yt-bg-overlay">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-yt-text-disabled font-mono uppercase tracking-widest flex items-center gap-1">
                  <span className="material-icons text-xs">auto_awesome</span>
                  Markdown Suportado
                </span>
                <span className="text-[10px] text-yt-text-disabled font-mono">{charCount} caracteres</span>
              </div>
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="bg-yt-bg-elevated hover:bg-yt-bg-overlay disabled:opacity-30 disabled:cursor-not-allowed text-yt-text-primary px-5 py-2 rounded-[3px] text-[11px] font-bold uppercase tracking-wider border border-yt-bg-overlay transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-icons text-sm">save</span>
                Salvar Nota
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Lista de Notas */}
      <section className="overflow-hidden">
        <div className="px-6 py-4 border-b border-yt-bg-overlay flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-yt-red text-base">history</span>
            <h3 className="text-xs font-bold text-yt-text-primary uppercase tracking-wider">Histórico de Notas</h3>
          </div>
          <span className="text-[10px] bg-yt-bg-elevated border border-yt-bg-overlay text-yt-text-disabled px-2.5 py-1 rounded font-mono">
            {notes.length} {notes.length === 1 ? 'NOTA' : 'NOTAS'}
          </span>
        </div>

        <div className="p-5">
          {loadingNotes ? (
            <div className="py-20 text-center">
              <span className="material-icons animate-spin text-yt-red text-4xl">sync</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="py-16 border border-dashed border-yt-bg-overlay rounded-[4px] text-center">
              <span className="material-icons text-4xl text-yt-bg-overlay block mb-2">description</span>
              <p className="text-xs text-yt-text-disabled uppercase tracking-widest font-sans">Nenhuma nota salva ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-yt-bg-primary border border-yt-bg-overlay rounded-[4px] p-5 group hover:border-yt-text-secondary transition-all relative"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yt-red shrink-0"></span>
                      <span className="text-[10px] text-yt-text-disabled font-mono uppercase tracking-widest">
                        {note.createdAt
                          ? new Date(note.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Recentemente'}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="text-yt-text-disabled hover:text-yt-red transition-colors p-1 opacity-0 group-hover:opacity-100 bg-transparent border-0 cursor-pointer"
                    >
                      <span className="material-icons text-sm">delete</span>
                    </button>
                  </div>
                  <p className="text-sm text-yt-text-secondary leading-relaxed whitespace-pre-wrap font-sans">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default NoteManager;
