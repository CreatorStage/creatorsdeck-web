import React from "react";
import { Reference } from "../../types";
import { getYouTubeEmbedUrl } from "./scriptUtils";

interface ReferenceManagerProps {
  references: Reference[];
  loadingRefs: boolean;
  refUrl: string;
  onRefUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  refLabel: string;
  onRefLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddLink: (e: React.FormEvent) => void;
  onDeleteRef: (id: string) => void;
  uploadProgress: boolean;
  onSelectImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ReferenceManager: React.FC<ReferenceManagerProps> = ({
  references,
  loadingRefs,
  refUrl,
  onRefUrlChange,
  refLabel,
  onRefLabelChange,
  onAddLink,
  onDeleteRef,
  uploadProgress,
  onSelectImage
}) => {
  const linkRefs = references.filter(r => r.type === 'LINK');
  const imageRefs = references.filter(r => r.type === 'IMAGE');

  return (
    <div className="w-full pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

        {/* ─── ADD PANEL ─── */}
        <aside className="space-y-5">
          <section className="yt-card overflow-hidden sticky top-[100px]">
            {/* Add Link */}
            <div className="px-6 py-4 border-b border-yt-bg-overlay flex items-center gap-2">
              <span className="material-icons text-yt-red text-base">add_link</span>
              <h3 className="text-xs font-bold text-yt-text-primary uppercase tracking-wider">Nova Referência</h3>
            </div>

            <form onSubmit={onAddLink} className="p-6 space-y-4 border-b border-yt-bg-overlay">
              <div>
                <label className="block text-[10px] font-bold text-yt-text-disabled uppercase tracking-widest mb-1.5">
                  Link (YouTube ou Site)
                </label>
                <input
                  type="url"
                  required
                  value={refUrl}
                  onChange={onRefUrlChange}
                  placeholder="https://youtube.com/..."
                  className="studio-input w-full py-2.5 px-3 text-sm"
                />
              </div>

              {getYouTubeEmbedUrl(refUrl) === refUrl && (
                <div>
                  <label className="block text-[10px] font-bold text-yt-text-disabled uppercase tracking-widest mb-1.5">
                    Título Opcional
                  </label>
                  <input
                    type="text"
                    value={refLabel}
                    onChange={onRefLabelChange}
                    placeholder="ex: Canal concorrente"
                    className="studio-input w-full py-2.5 px-3 text-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                className="yt-btn-primary w-full py-3 text-xs"
              >
                Adicionar Link
              </button>
            </form>

            {/* Preview YouTube */}
            {getYouTubeEmbedUrl(refUrl) !== refUrl && (
              <div className="p-4 border-b border-yt-bg-overlay">
                <p className="text-[10px] text-yt-red uppercase tracking-widest mb-2 font-bold flex items-center gap-1">
                  <span className="material-icons text-xs">visibility</span> Preview Detectado
                </p>
                <div className="aspect-video bg-black rounded-[3px] overflow-hidden border border-yt-bg-overlay">
                  <iframe
                    src={getYouTubeEmbedUrl(refUrl)}
                    className="w-full h-full border-0"
                    title="YouTube Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div className="p-6">
              <label className="block text-[10px] font-bold text-yt-text-disabled uppercase tracking-widest mb-3">
                Upload de Imagem (Moodboard)
              </label>
              <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-yt-bg-overlay rounded-[4px] p-8 hover:bg-yt-bg-elevated hover:border-yt-text-secondary transition-all cursor-pointer ${uploadProgress ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="material-icons text-3xl text-yt-text-disabled mb-2">cloud_upload</span>
                <span className="text-[11px] font-bold text-yt-text-disabled tracking-widest">
                  {uploadProgress ? 'Enviando...' : 'Selecionar Arquivo'}
                </span>
                <span className="text-[10px] text-yt-text-disabled mt-1 font-sans">PNG, JPG, WEBP</span>
                <input type="file" className="hidden" accept="image/*" onChange={onSelectImage} />
              </label>
            </div>
          </section>
        </aside>

        {/* ─── GALLERY ─── */}
        <div className="space-y-6">

          {/* Links Section */}
          <section className="yt-card overflow-hidden">
            <div className="px-6 py-4 border-b border-yt-bg-overlay flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-icons text-yt-red text-base">smart_display</span>
                <h3 className="text-xs font-bold text-yt-text-primary uppercase tracking-wider">Vídeos e Links</h3>
              </div>
              <span className="text-[10px] bg-yt-bg-elevated border border-yt-bg-overlay text-yt-text-disabled px-2 py-0.5 rounded font-mono">
                {linkRefs.length}
              </span>
            </div>

            <div className="p-5">
              {loadingRefs ? (
                <div className="py-16 text-center">
                  <span className="material-icons animate-spin text-yt-red text-4xl">sync</span>
                </div>
              ) : linkRefs.length === 0 ? (
                <div className="py-16 border border-dashed border-yt-bg-overlay rounded-[4px] text-center">
                  <span className="material-icons text-4xl text-yt-bg-overlay block mb-2">link_off</span>
                  <p className="text-xs text-yt-text-disabled uppercase tracking-widest font-sans">Nenhum link adicionado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {linkRefs.map(ref => {
                    const embedUrl = getYouTubeEmbedUrl(ref.url);
                    const isYouTube = embedUrl !== ref.url;

                    return (
                      <div key={ref.id} className="bg-yt-bg-primary border border-yt-bg-overlay rounded-[4px] overflow-hidden group hover:border-yt-text-secondary transition-all">
                        {/* Card header */}
                        <div className="px-4 py-3 bg-yt-bg-elevated flex items-center justify-between border-b border-yt-bg-overlay">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-icons text-sm text-yt-red">{isYouTube ? 'play_circle' : 'link'}</span>
                            <span className="text-xs font-semibold text-yt-text-primary truncate">{ref.label}</span>
                          </div>
                          <button
                            onClick={() => onDeleteRef(ref.id)}
                            className="text-yt-text-disabled hover:text-yt-red p-1 bg-transparent border-0 cursor-pointer transition-colors"
                          >
                            <span className="material-icons text-sm">close</span>
                          </button>
                        </div>

                        {isYouTube ? (
                          <div className="aspect-video bg-black">
                            <iframe src={embedUrl} className="w-full h-full border-0" allowFullScreen />
                          </div>
                        ) : (
                          <div className="p-6 text-center space-y-3">
                            <span className="material-icons text-3xl text-yt-blue">public</span>
                            <p className="text-[11px] text-yt-text-disabled font-mono break-all line-clamp-2 px-4">{ref.url}</p>
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-yt-blue uppercase tracking-widest hover:underline"
                            >
                              Abrir Link <span className="material-icons text-xs">open_in_new</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Moodboard Section */}
          <section className="yt-card overflow-hidden">
            <div className="px-6 py-4 border-b border-yt-bg-overlay flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-icons text-yt-red text-base">collections</span>
                <h3 className="text-xs font-bold text-yt-text-primary uppercase tracking-wider">Moodboard / Imagens</h3>
              </div>
              <span className="text-[10px] bg-yt-bg-elevated border border-yt-bg-overlay text-yt-text-disabled px-2 py-0.5 rounded font-mono">
                {imageRefs.length}
              </span>
            </div>

            <div className="p-5">
              {imageRefs.length === 0 ? (
                <div className="py-16 border border-dashed border-yt-bg-overlay rounded-[4px] text-center">
                  <span className="material-icons text-4xl text-yt-bg-overlay block mb-2">image_not_supported</span>
                  <p className="text-xs text-yt-text-disabled uppercase tracking-widest font-sans">Nenhuma imagem enviada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {imageRefs.map(ref => (
                    <div key={ref.id} className="aspect-square bg-yt-bg-primary border border-yt-bg-overlay rounded-[4px] relative group overflow-hidden hover:border-yt-text-secondary transition-all">
                      <img src={ref.url} alt={ref.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                        <p className="text-[10px] text-white truncate font-sans">{ref.label}</p>
                        <button
                          onClick={() => onDeleteRef(ref.id)}
                          className="self-end bg-yt-red text-white p-1.5 rounded-sm cursor-pointer border-0"
                        >
                          <span className="material-icons text-xs">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReferenceManager;
