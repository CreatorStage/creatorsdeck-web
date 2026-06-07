import React, { useState, useRef, useCallback, useEffect } from "react";

// Extend window for webkit prefix
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

// ============================================
// Formatting Engine
// ============================================

/**
 * Fix spacing around punctuation marks:
 * - Remove space before punctuation (e.g. "palavra ." → "palavra.")
 * - Ensure single space after punctuation (except line breaks)
 */
function fixPunctuationSpacing(text: string): string {
  let result = text;
  // Remove spaces before punctuation
  result = result.replace(/\s+([.,;:!?)\]"])/g, "$1");
  // Ensure space after punctuation (if followed by a letter)
  result = result.replace(/([.,;:!?])([A-Za-zÀ-ÿ])/g, "$1 $2");
  // Remove space after opening brackets/quotes
  result = result.replace(/([(\["])\s+/g, "$1");
  return result;
}

/**
 * Capitalize the first letter after sentence-ending punctuation (. ! ?)
 * and capitalize the very first character
 */
function applySmartCapitalization(text: string): string {
  if (!text) return text;

  // Capitalize first character
  let result = text.charAt(0).toUpperCase() + text.slice(1);

  // Capitalize after sentence-ending punctuation followed by space
  result = result.replace(
    /([.!?])\s+([a-zà-ÿ])/g,
    (_, punct, letter) => `${punct} ${letter.toUpperCase()}`
  );

  // Capitalize after line breaks
  result = result.replace(
    /(\n)([a-zà-ÿ])/g,
    (_, newline, letter) => `${newline}${letter.toUpperCase()}`
  );

  return result;
}

/**
 * Full pipeline: spoken text → formatted text with punctuation
 */
function processTranscript(text: string): string {
  let result = text;
  result = fixPunctuationSpacing(result);
  result = applySmartCapitalization(result);
  return result;
}

// Pause threshold in milliseconds — pauses longer than this insert a line break
const PAUSE_THRESHOLD_MS = 2000;

// ============================================
// Component
// ============================================

interface VoiceRecorderProps {
  onTranscriptReady: (text: string) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscriptReady, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [rawSegments, setRawSegments] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastFinalTimestampRef = useRef<number>(0);
  const segmentsRef = useRef<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
    return () => {
      stopAudioVisualizer();
    };
  }, []);

  const startAudioVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const historyLength = 60;
      const history = new Array(historyLength).fill(0);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(avg / 128, 1);
        
        history.push(normalizedLevel);
        history.shift();

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);
            
            const barWidth = width / historyLength;
            for (let i = 0; i < historyLength; i++) {
              const h = Math.max(4, history[i] * height * 0.8); // min 4px height, max 80% canvas height
              const x = i * barWidth;
              const y = (height - h) / 2; // Center vertically
              
              ctx.fillStyle = i === historyLength - 1 ? "#ef4444" : "rgba(239, 68, 68, 0.6)";
              
              ctx.beginPath();
              ctx.roundRect(x + 1, y, Math.max(2, barWidth - 2), h, 4);
              ctx.fill();
            }
          }
        }
        
        setAudioLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // If mic access fails for visualizer, just ignore silently
    }
  }, []);

  const stopAudioVisualizer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(() => {
    setError(null);
    setRawSegments([]);
    setInterimTranscript("");
    segmentsRef.current = [];
    lastFinalTimestampRef.current = Date.now();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Seu navegador não suporta reconhecimento de voz. Use o Chrome ou Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-BR";

    recognition.onstart = () => {
      setIsRecording(true);
      setShowPanel(true);
      startAudioVisualizer();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const now = Date.now();
          const elapsed = now - lastFinalTimestampRef.current;
          const text = result[0].transcript.trim();

          if (text) {
            // If pause was longer than threshold, insert a line break before this segment
            if (elapsed > PAUSE_THRESHOLD_MS && segmentsRef.current.length > 0) {
              segmentsRef.current.push("\n" + text);
            } else {
              segmentsRef.current.push(text);
            }

            setRawSegments([...segmentsRef.current]);
          }

          lastFinalTimestampRef.current = now;
        } else {
          interimText += result[0].transcript;
        }
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setError("Permissão de microfone negada. Permita o acesso ao microfone nas configurações do navegador.");
      } else if (event.error === "no-speech") {
        setError("Nenhuma fala detectada. Tente novamente.");
      } else if (event.error !== "aborted") {
        setError(`Erro no reconhecimento: ${event.error}`);
      }
      setIsRecording(false);
      stopAudioVisualizer();
    };

    recognition.onend = () => {
      setIsRecording(false);
      stopAudioVisualizer();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [startAudioVisualizer, stopAudioVisualizer]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    stopAudioVisualizer();
  }, [stopAudioVisualizer]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Build the raw joined text (before processing)
  const rawJoined = rawSegments.join(" ") + (interimTranscript ? " " + interimTranscript : "");

  // Processed transcript (with spacing, capitalization)
  const processedTranscript = processTranscript(rawJoined.trim());

  const handleInsertText = () => {
    if (processedTranscript) {
      onTranscriptReady(processedTranscript);
      setRawSegments([]);
      setInterimTranscript("");
      segmentsRef.current = [];
      setShowPanel(false);
    }
  };

  const handleDiscard = () => {
    if (isRecording) {
      stopRecording();
    }
    setRawSegments([]);
    setInterimTranscript("");
    segmentsRef.current = [];
    setShowPanel(false);
    setError(null);
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-sm text-[11px] text-yellow-400">
        <span className="material-icons text-sm">warning</span>
        Reconhecimento de voz não suportado neste navegador. Use Chrome ou Edge.
      </div>
    );
  }

  return (
    <>
      {/* Main mic toggle button */}
      <button
        type="button"
        onClick={handleToggleRecording}
        disabled={disabled}
        className={`
          relative group flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm
          transition-all duration-300 cursor-pointer border
          ${isRecording
            ? "bg-red-500/20 border-red-500/60 text-red-400 hover:bg-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
            : "bg-yt-bg-elevated hover:bg-yt-bg-overlay text-yt-text-primary border-yt-bg-overlay hover:border-yt-red/40"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        title={isRecording ? "Parar gravação" : "Gravar áudio para texto"}
      >
        {/* Animated pulse rings behind mic icon when recording */}
        {isRecording && (
          <>
            <span
              className="absolute left-[14px] top-1/2 -translate-y-1/2 rounded-full bg-red-500/20 animate-ping"
              style={{ width: `${16 + audioLevel * 12}px`, height: `${16 + audioLevel * 12}px` }}
            />
            <span
              className="absolute left-[14px] top-1/2 -translate-y-1/2 rounded-full bg-red-500/10"
              style={{
                width: `${22 + audioLevel * 20}px`,
                height: `${22 + audioLevel * 20}px`,
                animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          </>
        )}

        <span className={`material-icons text-sm relative z-10 transition-colors duration-300 ${isRecording ? "text-red-400" : ""}`}>
          {isRecording ? "stop_circle" : "mic"}
        </span>
        <span className="relative z-10">
          {isRecording ? "Parar" : "Voz → Texto"}
        </span>

        {/* Live recording indicator dot */}
        {isRecording && (
          <span className="relative z-10 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-red-400 font-mono">REC</span>
          </span>
        )}
      </button>

      {/* Expanded transcript panel */}
      {showPanel && (
        <div
          className={`
            w-full basis-[100%] mt-3 p-4 rounded-sm border transition-all duration-500 animate-in
            ${isRecording
              ? "bg-gradient-to-br from-red-500/5 to-red-900/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.08)]"
              : "bg-yt-bg-primary border-yt-bg-overlay"
            }
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {isRecording ? (
                <div className="flex items-center gap-2">
                  <div className="w-[120px] h-8 flex items-center bg-red-500/5 rounded-full px-2 border border-red-500/10">
                    <canvas ref={canvasRef} width={100} height={24} className="w-full h-full" />
                  </div>
                  <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider animate-pulse">
                    Ouvindo...
                  </span>
                </div>
              ) : (
                <>
                  <span className="material-icons text-sm text-[#66bb6a]">check_circle</span>
                  <span className="text-[11px] font-semibold text-[#66bb6a] uppercase tracking-wider">
                    Transcrição Pronta
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleDiscard}
              className="text-yt-text-secondary hover:text-yt-text-primary p-1 rounded-sm hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-0"
              title="Fechar"
            >
              <span className="material-icons text-sm">close</span>
            </button>
          </div>

          {/* Transcript preview — shows processed text */}
          <div
            className={`
              min-h-[80px] max-h-[200px] overflow-y-auto p-3 rounded-sm text-sm leading-relaxed
              ${isRecording
                ? "bg-black/20 border border-red-500/15"
                : "bg-yt-bg-surface border border-yt-bg-overlay"
              }
            `}
          >
            {processedTranscript ? (
              <div className="text-yt-text-primary whitespace-pre-wrap">
                {processedTranscript}
              </div>
            ) : (
              <p className="text-yt-text-disabled italic text-xs">
                {isRecording
                  ? "Comece a falar... o texto aparecerá aqui em tempo real."
                  : "Nenhum texto capturado."
                }
              </p>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-sm text-[11px] text-red-400">
              <span className="material-icons text-sm">error_outline</span>
              {error}
            </div>
          )}

          {/* Action buttons */}
          {!isRecording && processedTranscript && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                type="button"
                onClick={handleInsertText}
                className="flex items-center gap-1.5 px-4 py-2 bg-yt-red hover:bg-yt-red-hover text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-all cursor-pointer border-0"
              >
                <span className="material-icons text-sm">add_circle</span>
                Inserir no Roteiro
              </button>
              <button
                type="button"
                onClick={() => {
                  setRawSegments([]);
                  setInterimTranscript("");
                  segmentsRef.current = [];
                  startRecording();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-yt-bg-elevated hover:bg-yt-bg-overlay text-yt-text-primary text-xs font-semibold uppercase tracking-wider rounded-sm transition-all cursor-pointer border border-yt-bg-overlay"
              >
                <span className="material-icons text-sm">replay</span>
                Gravar Novamente
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="flex items-center gap-1.5 px-3 py-2 text-yt-text-secondary hover:text-red-400 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all cursor-pointer bg-transparent border-0"
              >
                <span className="material-icons text-sm">delete_outline</span>
                Descartar
              </button>
            </div>
          )}

          {/* Recording controls */}
          {isRecording && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider rounded-sm border border-red-500/40 transition-all cursor-pointer"
              >
                <span className="material-icons text-sm">stop</span>
                Finalizar Gravação
              </button>
              <span className="text-[10px] text-yt-text-disabled font-mono uppercase tracking-wider">
                Pause 2s para quebrar linha automaticamente
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default VoiceRecorder;
