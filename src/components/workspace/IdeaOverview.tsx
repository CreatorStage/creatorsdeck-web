import React from "react";
import { SponsorPaymentStatus, VideoIdeaStatus } from "../../types";

interface IdeaOverviewProps {
  mainTitle: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description: string;
  onDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  status: VideoIdeaStatus;
  onStatusChange: (status: VideoIdeaStatus) => void;
  productionStatuses: { value: VideoIdeaStatus; label: string; badgeClass: string }[];
  tagInput: string;
  onTagsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  deadline: string;
  onDeadlineChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  evergreen: boolean;
  trend: boolean;
  sponsored: boolean;
  publishedUrl: string;
  onFlagChange: (field: "evergreen" | "trend" | "sponsored", value: boolean) => void;
  onPublishedUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sponsorBrand: string;
  sponsorDeadline: string;
  sponsorTrackingUrl: string;
  sponsorValue: string;
  sponsorPaymentStatus: SponsorPaymentStatus;
  onSponsorBrandChange: (value: string) => void;
  onSponsorDeadlineChange: (value: string) => void;
  onSponsorTrackingUrlChange: (value: string) => void;
  onSponsorValueChange: (value: string) => void;
  onSponsorPaymentStatusChange: (value: SponsorPaymentStatus) => void;
  alternativeTitles: string[];
  newAltTitle: string;
  onNewAltTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddAltTitle: (e: React.FormEvent) => void;
  onRemoveAltTitle: (index: number) => void;
}

export default function IdeaOverview({
  mainTitle,
  onTitleChange,
  description,
  onDescChange,
  status,
  onStatusChange,
  productionStatuses,
  tagInput,
  onTagsChange,
  deadline,
  onDeadlineChange,
  evergreen,
  trend,
  sponsored,
  publishedUrl,
  onFlagChange,
  onPublishedUrlChange,
  sponsorBrand,
  sponsorDeadline,
  sponsorTrackingUrl,
  sponsorValue,
  sponsorPaymentStatus,
  onSponsorBrandChange,
  onSponsorDeadlineChange,
  onSponsorTrackingUrlChange,
  onSponsorValueChange,
  onSponsorPaymentStatusChange,
  alternativeTitles,
  newAltTitle,
  onNewAltTitleChange,
  onAddAltTitle,
  onRemoveAltTitle
}: IdeaOverviewProps) {
  return (
    <div className="w-full space-y-6 p-7">

      {/* Section: Informações Básicas */}
      <section className="overflow-hidden">
        <div className="px-7 py-5 border-b border-yt-bg-overlay flex items-center gap-3">
          <span className="material-icons text-yt-red text-lg">info_outline</span>
          <h2 className="text-sm font-bold text-yt-text-primary uppercase tracking-wider">Informações Básicas</h2>
        </div>

        <div className="p-7 space-y-5">
          {/* Título */}
          <div>
            <label className="block text-[10px] font-bold text-yt-text-disabled uppercase tracking-widest mb-2">
              Título do Vídeo (Hook / Gancho)
            </label>
            <input
              type="text"
              value={mainTitle}
              onChange={onTitleChange}
              placeholder="Ex: Por que os programadores modernos usam Neovim como religião"
              className="studio-input w-full py-4 px-5 text-xl font-bold placeholder:text-yt-text-disabled"
            />
          </div>

          {/* Tags + Prazo lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-yt-text-disabled uppercase tracking-widest mb-2">
                Palavras-chave (separadas por vírgula)
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={onTagsChange}
                placeholder="tech, tutorial, react..."
                className="studio-input w-full py-3 px-4 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-yt-text-disabled uppercase tracking-widest mb-2">
                Prazo Estimado (Deadline)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={onDeadlineChange}
                className="studio-input w-full py-3 px-4 text-sm"
              />
            </div>
          </div>

          {/* Link publicado */}
          <div>
            <label className="block text-[10px] font-bold text-yt-text-disabled uppercase tracking-widest mb-2">
              Link do Vídeo Publicado (opcional)
            </label>
            <div className="flex items-center gap-3">
              <span className="material-icons text-yt-blue text-lg shrink-0">link</span>
              <input
                type="url"
                value={publishedUrl}
                onChange={onPublishedUrlChange}
                placeholder="https://youtube.com/watch?v=..."
                className="studio-input flex-1 py-3 px-4 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Status de Produção */}
      <section className="overflow-hidden">
        <div className="px-7 py-5 border-b border-yt-bg-overlay flex items-center gap-3">
          <span className="material-icons text-yt-red text-lg">timeline</span>
          <h2 className="text-sm font-bold text-yt-text-primary uppercase tracking-wider">Status de Produção</h2>
        </div>
        <div className="p-7">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as VideoIdeaStatus)}
            className="studio-input w-full py-3 px-4 text-sm font-semibold bg-yt-bg-primary border border-yt-bg-overlay rounded text-yt-text-primary focus:outline-none cursor-pointer font-sans"
          >
            {productionStatuses.filter((item) => item.value !== "ARCHIVED").map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}
