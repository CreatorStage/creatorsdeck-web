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
  onThemeToggle: () => void;
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
  onThemeToggle,
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

    const tick = () => {
      container.scrollTop += speed * 0.45;
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

    if (theme === "dark") return content;

    return content
      .replace(/color:\s*#fef2f2/g, "color: #1a0505")
      .replace(/color:\s*#eff6ff/g, "color: #04102e")
      .replace(/color:\s*#fffbeb/g, "color: #1c1000")
      .replace(/color:\s*#ecfdf5/g, "color: #01200e")
      .replace(/color:\s*#f1f1f1/g, "color: #0f172a")
      .replace(/color:\s*white/g, "color: #000000");
  };

  const isDark = theme === "dark";
  const bgColor = isDark ? "bg-[#050505]" : "bg-white";
  const textColor = isDark ? "text-[#f1f1f1]" : "text-[#111]";
  const borderColor = isDark ? "border-[#1c1c1c]" : "border-[#e0e0e0]";
  const controlBg = isDark ? "bg-[#111]" : "bg-[#f5f5f5]";
  const controlBorder = isDark ? "border-[#2a2a2a]" : "border-[#e0e0e0]";

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-[1000]" : "w-full"} ${bgColor} ${textColor} flex flex-col`}>
      {/* ─── CONTROLS BAR ─── */}
      <div className={`shrink-0 ${controlBg} border-b ${controlBorder} px-6 lg:px-10 py-3.5 flex flex-wrap items-center gap-5`}>

        {/* Label */}
        <div className="flex items-center gap-2 mr-2">
          <span className="material-icons text-[#ff5045] text-base">videocam</span>
          <span className={`text-xs font-bold uppercase tracking-wider hidden md:inline ${isDark ? "text-[#aaa]" : "text-[#888]"}`}>Teleprompter</span>
        </div>

        <span className={`w-px h-5 ${isDark ? "bg-[#2a2a2a]" : "bg-[#e0e0e0]"} hidden sm:block`} />

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
          className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent border-0 ${isDark ? "text-[#717171] hover:text-white" : "text-[#888] hover:text-[#111]"}`}
        >
          <span className="material-icons text-base">restart_alt</span>
          <span className="hidden sm:inline">Reiniciar</span>
        </button>

        <span className={`w-px h-5 ${isDark ? "bg-[#2a2a2a]" : "bg-[#e0e0e0]"} hidden sm:block`} />


        {/* Speed */}
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-[#555]" : "text-[#aaa]"}`}>Velocidade</span>
          <input
            type="range" min="1" max="10" step="0.5"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-32 accent-[#ff5045] cursor-pointer"
          />
          <span className={`text-sm font-bold w-8 ${isDark ? "text-[#f1f1f1]" : "text-[#111]"}`}>{speed}x</span>
        </div>

        <span className={`w-px h-5 ${isDark ? "bg-[#2a2a2a]" : "bg-[#e0e0e0]"} hidden sm:block`} />

        {/* Font Size */}
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-[#555]" : "text-[#aaa]"}`}>Tamanho</span>
          <input
            type="range" min="28" max="96"
            value={fontSize}
            onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
            className="w-32 accent-[#ff5045] cursor-pointer"
          />
          <span className={`text-sm font-bold w-10 ${isDark ? "text-[#f1f1f1]" : "text-[#111]"}`}>{fontSize}px</span>
        </div>

        <span className={`w-px h-5 ${isDark ? "bg-[#2a2a2a]" : "bg-[#e0e0e0]"} hidden sm:block`} />

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          title={isDark ? "Modo Claro" : "Modo Escuro"}
          className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent border-0 ${isDark ? "text-[#717171] hover:text-white" : "text-[#888] hover:text-[#111]"}`}
        >
          <span className="material-icons text-base">{isDark ? "light_mode" : "dark_mode"}</span>
          <span className="hidden sm:inline">{isDark ? "Claro" : "Escuro"}</span>
        </button>

        {!isFullscreen && (
          <>
            <span className={`w-px h-5 ${isDark ? "bg-[#2a2a2a]" : "bg-[#e0e0e0]"} hidden sm:block`} />
            <button
              onClick={onFullscreenToggle}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent border-0 ${isDark ? "text-[#717171] hover:text-white" : "text-[#888] hover:text-[#111]"}`}
            >
              <span className="material-icons text-base">fullscreen</span>
              <span className="hidden sm:inline">Tela Cheia</span>
            </button>
          </>
        )}

        {/* Recording indicator */}
        {isScrolling && (
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff5045] animate-pulse"></span>
            <span className="text-[10px] font-bold text-[#ff5045] uppercase tracking-widest">Gravando</span>
          </div>
        )}
      </div>

      {/* ─── FOCUS LINE ─── */}
      <div className="relative flex-1 overflow-hidden">
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
          className="h-full overflow-y-auto cursor-pointer py-16 scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          <div
            className="mx-auto max-w-5xl text-center font-extrabold leading-tight select-none"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.45 }}
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
