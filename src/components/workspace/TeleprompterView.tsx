import React, { useEffect, useRef } from "react";

interface TeleprompterViewProps {
  content: string;
  fontSize: number;
  speed: number;
  isScrolling: boolean;
  theme: "dark" | "light";
  onToggleScroll: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onFontSizeChange: (size: number) => void;
  onFullscreenToggle: () => void;
  isFullscreen?: boolean;
}

export default function TeleprompterView({
  content,
  fontSize,
  speed,
  isScrolling,
  theme,
  onToggleScroll,
  onReset,
  onSpeedChange,
  onFontSizeChange,
  onFullscreenToggle,
  isFullscreen
}: TeleprompterViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isScrolling) {
      if (scrollTimerRef.current) cancelAnimationFrame(scrollTimerRef.current);
      scrollTimerRef.current = null;
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    let lastTime = performance.now();
    let exactScrollTop = container.scrollTop;

    const tick = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      // Convert speed to pixels per millisecond (speed * 0.45 per 16.6ms is roughly speed * 0.027)
      const speedPerMs = speed * 0.027;
      exactScrollTop += speedPerMs * dt;
      
      container.scrollTop = exactScrollTop;

      // Resync accumulator if user manually scrolls
      if (Math.abs(container.scrollTop - exactScrollTop) > 2) {
        exactScrollTop = container.scrollTop;
      }

      scrollTimerRef.current = requestAnimationFrame(tick);
    };

    scrollTimerRef.current = requestAnimationFrame(tick);
    return () => {
      if (scrollTimerRef.current) cancelAnimationFrame(scrollTimerRef.current);
    };
  }, [isScrolling, speed]);

  const getProcessedHtml = () => {
    if (!content) {
      return "O seu roteiro está vazio atualmente.<br/><br/>Escreva algo na aba <strong>Roteiro</strong> primeiro!";
    }

    let processed = content;

    // Break lines after end of sentences for better teleprompter readability.
    // We match a period, exclamation, or question mark, followed by spaces, followed by a Capital letter.
    // We use capturing groups to keep the punctuation and the capital letter.
    processed = processed.replace(/([.?!])\s+(?=[A-ZÀ-ÖØ-Þ])/g, "$1<br/><br/>");

    // Add more spacing between blocks for the teleprompter view
    processed = processed.replace(/margin:\s*12px\s*0/g, "margin: 32px 0");

    if (theme === "dark") return processed;

    return processed
      .replace(/color:\s*#fef2f2/g, "color: #1a0505")
      .replace(/color:\s*#eff6ff/g, "color: #04102e")
      .replace(/color:\s*#fffbeb/g, "color: #1c1000")
      .replace(/color:\s*#ecfdf5/g, "color: #01200e")
      .replace(/color:\s*#f1f1f1/g, "color: #0f172a")
      .replace(/color:\s*white/g, "color: #000000");
  };

  const isDark = theme === "dark";
  const bgColor = "bg-yt-bg-primary";
  const textColor = "text-yt-text-primary";
  const controlBg = "bg-yt-bg-surface/96";
  const controlBorder = "border-yt-bg-overlay";
  const dockWidth = isDark ? "w-[min(calc(100%-1rem),72rem)]" : "w-[min(calc(100%-1rem),66rem)]";

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-[1000]" : "relative w-full h-full"} ${bgColor} ${textColor} flex flex-col`}>
      {/* ─── CONTROLS BAR ─── */}
      <div className={`fixed bottom-3 left-1/2 z-[1002] ${dockWidth} -translate-x-1/2 rounded-2xl border ${controlBg} ${controlBorder} px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:px-6 lg:px-8 flex flex-nowrap items-center justify-center gap-4 overflow-x-auto transition-[width] duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>

         
        {/* Gravar / Pausar */}
        <button
          onClick={onToggleScroll}
          className={`px-5 py-2 rounded-[4px] font-extrabold uppercase tracking-wider text-xs flex items-center gap-2 transition-all cursor-pointer ${
            isScrolling
              ? "bg-[#ffb74d] text-[#111] hover:bg-[#ffa726]"
              : "bg-[#ff5045] text-white hover:bg-[#ff3f33]"
          }`}
        >
          <span className="material-icons text-sm">{isScrolling ? "pause" : "radio_button_unchecked"}</span>
          {isScrolling ? "Pausar" : "Gravar"}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent border-0 text-yt-text-secondary hover:text-yt-text-primary"
        >
          <span className="material-icons text-base">restart_alt</span>
          <span className="hidden sm:inline">Reiniciar</span>
        </button>

        <span className="w-px h-5 bg-yt-bg-overlay hidden sm:block" />


        {/* Speed */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-yt-text-disabled">Velocidade</span>
          <input
            type="range" min="1" max="10" step="0.5"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-32 accent-[#ff5045] cursor-pointer"
          />
          <span className="text-sm font-bold w-8 text-yt-text-primary">{speed}x</span>
        </div>

        <span className="w-px h-5 bg-yt-bg-overlay hidden sm:block" />

        {/* Font Size */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-yt-text-disabled">Tamanho</span>
          <input
            type="range" min="28" max="96"
            value={fontSize}
            onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
            className="w-32 accent-[#ff5045] cursor-pointer"
          />
          <span className="text-sm font-bold w-10 text-yt-text-primary">{fontSize}px</span>
        </div>

        <span className="w-px h-5 bg-yt-bg-overlay hidden sm:block" />
        <button
          onClick={onFullscreenToggle}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent border-0 text-yt-text-secondary hover:text-yt-text-primary"
        >
          <span className="material-icons text-base">{isFullscreen ? "close_fullscreen" : "fullscreen"}</span>
          <span className="hidden sm:inline">{isFullscreen ? "Reduzir" : "Tela Cheia"}</span>
        </button>
      </div>

      {/* ─── FOCUS LINE ─── */}
      <div className="relative flex-1 overflow-hidden pb-32 md:pb-36">
        {/* Gradient fade top */}
        <div className={`pointer-events-none absolute top-0 left-0 right-0 h-24 z-10 ${isDark ? "bg-gradient-to-b from-[#050505] to-transparent" : "bg-gradient-to-b from-white to-transparent"}`} />

        {/* Focus marker */}
        <div className={`pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] z-10 ${isDark ? "bg-[#ff5045]/20" : "bg-[#ff5045]/15"}`} />
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-between px-4">
          <span className="material-icons text-[#ff5045]/30 text-4xl">chevron_right</span>
          <span className="material-icons text-[#ff5045]/30 text-4xl">chevron_left</span>
        </div>

        {/* Text scroll area */}
        <div
          ref={scrollContainerRef}
          onClick={onToggleScroll}
          className="h-full overflow-y-auto cursor-pointer"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Spacer to push first line to the middle reading line */}
          <div className="h-[50vh]" />
          
          <div
            className="mx-auto w-[92%] max-w-[1600px] text-center font-extrabold leading-tight select-none"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.45, transform: "translateZ(0)", willChange: "transform" }}
            dangerouslySetInnerHTML={{ __html: getProcessedHtml() }}
          />
          <div className="h-[70vh]" />
        </div>

        {/* Gradient fade bottom */}
        <div className={`pointer-events-none absolute bottom-0 left-0 right-0 h-24 z-10 ${isDark ? "bg-gradient-to-t from-[#050505] to-transparent" : "bg-gradient-to-t from-white to-transparent"}`} />
      </div>
    </div>
  );
}
