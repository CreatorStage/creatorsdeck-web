import React from "react";
import { SponsorPaymentStatus, VideoIdeaStatus } from "../../types";
import SponsorTracker from "./SponsorTracker";

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

const flags = [
  { key: "evergreen" as const, label: "Evergreen", icon: "all_inclusive", color: "text-[#66bb6a]", activeBg: "bg-[#66bb6a]/10 border-[#66bb6a]/50" },
  { key: "trend" as const, label: "Tendência", icon: "trending_up", color: "text-[#3ea6ff]", activeBg: "bg-[#3ea6ff]/10 border-[#3ea6ff]/50" },
  { key: "sponsored" as const, label: "Patrocinado", icon: "paid", color: "text-[#ffb74d]", activeBg: "bg-[#ffb74d]/10 border-[#ffb74d]/50" }
];

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
  const flagState = { evergreen, trend, sponsored };

  return (
    <div className="w-full space-y-6 pb-20">

      {/* Section: Informações Básicas */}
      <section className="yt-card overflow-hidden">
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

          {/* Descrição */}
          <div>
            <label className="block text-[10px] font-bold text-yt-text-disabled uppercase tracking-widest mb-2">
              Descrição / Proposta de Valor
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={onDescChange}
              placeholder="Ex: Uma comparação entre a produtividade oldschool e o foco hypermoderno..."
              className="studio-input w-full py-4 px-5 text-base leading-7 resize-none placeholder:text-yt-text-disabled"
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

          {/* Flags */}
          <div>
            <label className="block text-[10px] font-bold text-yt-text-disabled uppercase tracking-widest mb-3">
              Características do Vídeo
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {flags.map((item) => {
                const active = flagState[item.key];
                return (
                  <label
                    key={item.key}
                    className={`border rounded-[4px] px-4 py-4 cursor-pointer transition-all flex items-center justify-between ${
                      active ? `${item.activeBg}` : "bg-yt-bg-primary border-yt-bg-overlay text-yt-text-disabled hover:border-yt-text-secondary"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 text-sm font-semibold">
                      <span className={`material-icons text-base ${active ? item.color : "text-yt-text-disabled"}`}>{item.icon}</span>
                      <span className={active ? "text-yt-text-primary" : ""}>{item.label}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => onFlagChange(item.key, e.target.checked)}
                      className="accent-[#ff5045] w-4 h-4"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {sponsored && (
            <SponsorTracker
              sponsorBrand={sponsorBrand}
              sponsorDeadline={sponsorDeadline}
              sponsorTrackingUrl={sponsorTrackingUrl}
              sponsorValue={sponsorValue}
              sponsorPaymentStatus={sponsorPaymentStatus}
              onSponsorBrandChange={onSponsorBrandChange}
              onSponsorDeadlineChange={onSponsorDeadlineChange}
              onSponsorTrackingUrlChange={onSponsorTrackingUrlChange}
              onSponsorValueChange={onSponsorValueChange}
              onSponsorPaymentStatusChange={onSponsorPaymentStatusChange}
            />
          )}

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
      <section className="yt-card overflow-hidden">
        <div className="px-7 py-5 border-b border-yt-bg-overlay flex items-center gap-3">
          <span className="material-icons text-yt-red text-lg">timeline</span>
          <h2 className="text-sm font-bold text-yt-text-primary uppercase tracking-wider">Status de Produção</h2>
        </div>
        <div className="p-7">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {productionStatuses.filter((item) => item.value !== "ARCHIVED").map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onStatusChange(item.value)}
                className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border rounded-[4px] transition-all flex items-center justify-center gap-1.5 ${
                  status === item.value
                    ? "bg-yt-red border-yt-red text-white"
                    : "bg-yt-bg-primary border-yt-bg-overlay text-yt-text-secondary hover:text-yt-text-primary hover:border-yt-text-secondary"
                }`}
              >
                <span className="material-icons text-[14px]">{status === item.value ? "check_circle" : "radio_button_unchecked"}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Brainstorm de Títulos */}
      <section className="yt-card overflow-hidden">
        <div className="px-7 py-5 border-b border-yt-bg-overlay flex items-center gap-3">
          <span className="material-icons text-yt-red text-lg">title</span>
          <h2 className="text-sm font-bold text-yt-text-primary uppercase tracking-wider">Brainstorm de Títulos Alternativos</h2>
        </div>

        <div className="p-7">
          <form onSubmit={onAddAltTitle} className="flex gap-3 mb-5">
            <input
              type="text"
              value={newAltTitle}
              onChange={onNewAltTitleChange}
              placeholder="Digite uma variante de título..."
              className="studio-input flex-1 py-3 px-4 text-sm"
            />
            <button type="submit" className="yt-btn-secondary flex items-center gap-2 shrink-0">
              <span className="material-icons text-sm">add</span>
              Adicionar
            </button>
          </form>

          {alternativeTitles.length === 0 ? (
            <div className="py-10 border border-dashed border-yt-bg-overlay rounded-[4px] text-center">
              <span className="material-icons text-3xl text-yt-bg-overlay block mb-2">title</span>
              <p className="text-xs text-yt-text-disabled uppercase tracking-widest font-sans">Nenhum título alternativo ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alternativeTitles.map((title, index) => (
                <div key={`${title}-${index}`} className="bg-yt-bg-primary border border-yt-bg-overlay px-5 py-3.5 flex items-center justify-between rounded-[4px] group hover:border-yt-text-secondary transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-[10px] text-yt-text-disabled font-mono font-bold">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-sm text-yt-text-primary font-medium truncate">{title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveAltTitle(index)}
                    className="text-yt-text-disabled hover:text-yt-red transition-colors p-1 opacity-0 group-hover:opacity-100 bg-transparent border-0 cursor-pointer"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
