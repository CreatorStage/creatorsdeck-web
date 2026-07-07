import React, { useState, useRef, useCallback, useEffect } from "react";
// @ts-ignore
import MyWorker from "./whisper.worker?worker";

// ============================================
// Formatting Engine
// ============================================

function fixPunctuationSpacing(text: string): string {
  let result = text;
  result = result.replace(/\s+([.,;:!?)\]"])/g, "$1");
  result = result.replace(/([.,;:!?])([A-Za-zÀ-ÿ])/g, "$1 $2");
  result = result.replace(/([(\["])\s+/g, "$1");
  return result;
}

function applySmartCapitalization(text: string): string {
  if (!text) return text;
  let result = text.charAt(0).toUpperCase() + text.slice(1);
  result = result.replace(
    /([.!?])\s+([a-zà-ÿ])/g,
    (_, punct, letter) => `${punct} ${letter.toUpperCase()}`
  );
  result = result.replace(
    /(\n)([a-zà-ÿ])/g,
    (_, newline, letter) => `${newline}${letter.toUpperCase()}`
  );
  return result;
}

function processTranscript(text: string): string {
  let result = text;
  result = fixPunctuationSpacing(result);
  result = applySmartCapitalization(result);
  return result;
}

// Resample audio to 16kHz mono Float32Array as required by Whisper
async function prepareAudioBuffer(audioBlob: Blob): Promise<Float32Array> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const targetSampleRate = 16000;
  const numberOfChannels = 1;
  
  const offlineCtx = new OfflineAudioContext(
    numberOfChannels,
    Math.round(audioBuffer.duration * targetSampleRate),
    targetSampleRate
  );
  
  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = audioBuffer;
  bufferSource.connect(offlineCtx.destination);
  bufferSource.start();
  
  const renderedBuffer = await offlineCtx.startRendering();
  return renderedBuffer.getChannelData(0);
}

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
  const [error, setError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Whisper model loading and transcribing states
  const [modelLoading, setModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    const worker = new MyWorker();
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const { type, progress, text, message } = event.data;

      if (type === "progress") {
        setModelProgress(Math.round(progress));
      } else if (type === "ready" || type === "loaded") {
        setModelReady(true);
        setModelLoading(false);
        startRecordingActual();
      } else if (type === "transcribing") {
        setIsTranscribing(true);
      } else if (type === "completed") {
        setIsTranscribing(false);
        if (text && text.trim()) {
          setRawSegments([text.trim()]);
        }
      } else if (type === "error") {
        setIsTranscribing(false);
        setModelLoading(false);
        setError(`Erro local no Whisper: ${message}`);
      }
    };

    return worker;
  }, [modelReady]);

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
        if (!analyserRef.current) return;
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
              const h = Math.max(4, history[i] * height * 0.8);
              const x = i * barWidth;
              const y = (height - h) / 2;
              
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
    } catch (err) {
      console.error("Erro no visualizador de áudio:", err);
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

  const startRecordingActual = () => {
    setError(null);
    setRawSegments([]);
    audioChunksRef.current = [];

    if (!mediaStreamRef.current) {
      setError("Erro: Microfone não ativado.");
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsTranscribing(true);
        
        try {
          const float32Array = await prepareAudioBuffer(audioBlob);
          const worker = initWorker();
          worker.postMessage({
            type: "transcribe",
            audio: float32Array
          });
        } catch (err: any) {
          console.error(err);
          setError(`Erro ao decodificar áudio: ${err.message || err}`);
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setShowPanel(true);
    } catch (err: any) {
      setError(`Falha ao iniciar gravador: ${err.message || err}`);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopAudioVisualizer();
  }, [stopAudioVisualizer]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setError(null);
      if (modelReady) {
        startAudioVisualizer().then(() => {
          startRecordingActual();
        }).catch(() => {
          setError("Erro ao acessar microfone. Certifique-se de dar permissão.");
        });
      } else {
        setModelLoading(true);
        startAudioVisualizer().then(() => {
          const worker = initWorker();
          worker.postMessage({ type: "load" });
        }).catch((err) => {
          setModelLoading(false);
          setError("Erro ao acessar microfone. Certifique-se de dar permissão.");
          console.error(err);
        });
      }
    }
  };

  useEffect(() => {
    return () => {
      stopAudioVisualizer();
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [stopAudioVisualizer]);

  const rawJoined = rawSegments.join(" ");
  const processedTranscript = processTranscript(rawJoined.trim());

  const handleInsertText = () => {
    if (processedTranscript) {
      onTranscriptReady(processedTranscript);
      setRawSegments([]);
      setShowPanel(false);
    }
  };

  const handleDiscard = () => {
    if (isRecording) {
      stopRecording();
    }
    setRawSegments([]);
    setShowPanel(false);
    setError(null);
  };

  return (
    <>
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
        <span className="relative z-10 font-sans">
          {isRecording ? "Parar" : "Voz → Texto"}
        </span>

        {isRecording && (
          <span className="relative z-10 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-red-400 font-mono">REC</span>
          </span>
        )}
      </button>

      {/* Model loading overlay state */}
      {modelLoading && (
        <div className="w-full basis-[100%] mt-3 p-4 bg-yt-bg-elevated border border-yt-border/50 rounded-sm flex flex-col gap-2 animate-in">
          <div className="flex items-center justify-between text-xs font-semibold text-yt-text-primary font-sans">
            <span className="flex items-center gap-1.5">
              <span className="material-icons animate-spin text-sm text-yt-red">refresh</span>
              Inicializando reconhecimento de voz local (Whisper)...
            </span>
            <span>{modelProgress}%</span>
          </div>
          <div className="w-full h-1 bg-[#272727] rounded-full overflow-hidden">
            <div 
              className="h-full bg-yt-red transition-all duration-300" 
              style={{ width: `${modelProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-yt-text-disabled uppercase tracking-wider font-sans">
            Baixando inteligência artificial (~75MB) apenas no primeiro uso. Ficará salva no seu computador.
          </p>
        </div>
      )}

      {showPanel && !modelLoading && (
        <div
          className={`
            w-full basis-[100%] mt-3 p-4 rounded-sm border transition-all duration-500 animate-in
            ${isRecording
              ? "bg-gradient-to-br from-red-500/5 to-red-900/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.08)]"
              : "bg-yt-bg-primary border-yt-bg-overlay"
            }
          `}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {isRecording ? (
                <div className="flex items-center gap-2">
                  <div className="w-[120px] h-8 flex items-center bg-red-500/5 rounded-full px-2 border border-red-500/10">
                    <canvas ref={canvasRef} width={100} height={24} className="w-full h-full" />
                  </div>
                  <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider animate-pulse font-sans">
                    Gravando Áudio...
                  </span>
                </div>
              ) : (
                <>
                  <span className="material-icons notranslate text-sm text-[#66bb6a]" translate="no">check_circle</span>
                  <span className="text-[11px] font-semibold text-[#66bb6a] uppercase tracking-wider font-sans">
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
              <span className="material-icons notranslate text-sm" translate="no">close</span>
            </button>
          </div>

          <div
            className={`
              min-h-[80px] max-h-[200px] overflow-y-auto p-3 rounded-sm text-sm leading-relaxed
              ${isRecording
                ? "bg-black/20 border border-red-500/15"
                : "bg-yt-bg-surface border border-yt-bg-overlay"
              }
            `}
          >
            {isTranscribing ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <span className="material-icons notranslate animate-spin text-2xl text-yt-red" translate="no">refresh</span>
                <span className="text-xs text-yt-text-secondary font-medium font-sans">Processando áudio localmente com Whisper...</span>
              </div>
            ) : processedTranscript ? (
              <div className="text-yt-text-primary whitespace-pre-wrap font-sans">
                {processedTranscript}
              </div>
            ) : (
              <p className="text-yt-text-disabled italic text-xs font-sans">
                {isRecording
                  ? "Sua voz está sendo gravada. Pressione Parar para transcrever localmente."
                  : "Nenhum texto capturado."
                }
              </p>
            )}
          </div>

          {error && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-sm text-[11px] text-red-400 font-sans">
              <span className="material-icons notranslate text-sm" translate="no">error_outline</span>
              {error}
            </div>
          )}

          {!isRecording && processedTranscript && !isTranscribing && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                type="button"
                onClick={handleInsertText}
                className="flex items-center gap-1.5 px-4 py-2 bg-yt-red hover:bg-yt-red-hover text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-all cursor-pointer border-0 font-sans"
              >
                <span className="material-icons notranslate text-sm" translate="no">add_circle</span>
                Inserir no Roteiro
              </button>
              <button
                type="button"
                onClick={() => {
                  setRawSegments([]);
                  startAudioVisualizer().then(() => {
                    startRecordingActual();
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-yt-bg-elevated hover:bg-yt-bg-overlay text-yt-text-primary text-xs font-semibold uppercase tracking-wider rounded-sm transition-all cursor-pointer border border-yt-bg-overlay font-sans"
              >
                <span className="material-icons notranslate text-sm" translate="no">replay</span>
                Gravar Novamente
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="flex items-center gap-1.5 px-3 py-2 text-yt-text-secondary hover:text-red-400 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all cursor-pointer bg-transparent border-0 font-sans"
              >
                <span className="material-icons notranslate text-sm" translate="no">delete_outline</span>
                Descartar
              </button>
            </div>
          )}

          {isRecording && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider rounded-sm border border-red-500/40 transition-all cursor-pointer font-sans"
              >
                <span className="material-icons notranslate text-sm" translate="no">stop</span>
                Finalizar Gravação
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default VoiceRecorder;
