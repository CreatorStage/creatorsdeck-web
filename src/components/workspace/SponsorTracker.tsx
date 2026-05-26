import React from "react";
import { SponsorPaymentStatus } from "../../types";

interface SponsorTrackerProps {
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
}

const PAYMENT_STATUS_OPTIONS: { value: SponsorPaymentStatus; label: string }[] = [
  { value: "PENDING", label: "Pendente" },
  { value: "INVOICED", label: "Faturado" },
  { value: "PAID", label: "Pago" }
];

export default function SponsorTracker({
  sponsorBrand,
  sponsorDeadline,
  sponsorTrackingUrl,
  sponsorValue,
  sponsorPaymentStatus,
  onSponsorBrandChange,
  onSponsorDeadlineChange,
  onSponsorTrackingUrlChange,
  onSponsorValueChange,
  onSponsorPaymentStatusChange
}: SponsorTrackerProps) {
  return (
    <section className="mt-6 rounded-[6px] border border-amber-400/30 bg-gradient-to-br from-amber-400/12 via-yellow-400/8 to-transparent p-5 lg:p-6 shadow-[0_0_0_1px_rgba(245,158,11,0.05)]">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
          <span className="material-icons text-lg">payments</span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-amber-300">Sponsor Tracker</p>
          <h3 className="text-lg font-extrabold text-yt-text-primary">Controle o patrocínio deste vídeo</h3>
          <p className="text-sm text-yt-text-secondary font-sans">Campos opcionais para acompanhar negociação, prazo e recebimento.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">Marca</label>
          <input
            value={sponsorBrand}
            onChange={(e) => onSponsorBrandChange(e.target.value)}
            className="studio-input w-full p-3"
            placeholder="Ex.: ACME, NordVPN, Notion..."
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">Prazo de aprovação</label>
          <input
            type="datetime-local"
            value={sponsorDeadline}
            onChange={(e) => onSponsorDeadlineChange(e.target.value)}
            className="studio-input w-full p-3"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">Link rastreável</label>
          <input
            value={sponsorTrackingUrl}
            onChange={(e) => onSponsorTrackingUrlChange(e.target.value)}
            className="studio-input w-full p-3"
            placeholder="https://...utm_source=..."
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">Valor (R$)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={sponsorValue}
            onChange={(e) => onSponsorValueChange(e.target.value)}
            className="studio-input w-full p-3"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-yt-text-secondary mb-2">Status de pagamento</label>
          <select
            value={sponsorPaymentStatus}
            onChange={(e) => onSponsorPaymentStatusChange(e.target.value as SponsorPaymentStatus)}
            className="studio-input w-full p-3"
          >
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-yt-bg-surface text-yt-text-primary">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}