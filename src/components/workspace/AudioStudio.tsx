import React, { useState, useRef, useEffect, useCallback } from "react";
import { processAudioRemovingSilence } from "../../utils/audioProcessor";

interface AudioStudioProps {}

export default function AudioStudio(props: AudioStudioProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [rawBlob, setRawBlob] = useState<Blob | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [thresholdDb, setThresholdDb] = useState<number>(-40);
  const [minSilenceDurationMs, setMinSilenceDurationMs] = useState<number>(500);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopVisualizer();
      if (timerRef.current) clearInterval(timerRef.current);
      if (processedUrl) URL.revokeObjectURL(processedUrl);
    };
  }, [processedUrl]);

  const startVisualizer = useCallback(async (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
              
              // Draw rounded rect
              ctx.beginPath();
              ctx.roundRect(x + 1, y, Math.max(2, barWidth - 2), h, 4);
              ctx.fill();
            }
          }
        }
        
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // ignore
    }
  }, []);

  const stopVisualizer = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setRawBlob(null);
      if (processedUrl) {
        URL.revokeObjectURL(processedUrl);
        setProcessedUrl(null);
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      startVisualizer(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRawBlob(blob);
        stopVisualizer();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError("Não foi possível acessar o microfone.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudio = async () => {
    if (!rawBlob) return;
    setIsProcessing(true);
    setError(null);
    try {
      const resultBlob = await processAudioRemovingSilence(
        rawBlob,
        thresholdDb,
        minSilenceDurationMs
      );
      const url = URL.createObjectURL(resultBlob);
      setProcessedUrl(url);
    } catch (err: any) {
      setError("Erro ao processar áudio: " + (err.message || "Tente novamente."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const a = document.createElement("a");
    a.href = processedUrl;
    a.download = "jumpcut-audio.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3 border-b border-yt-bg-overlay/50 pb-4">
        <span className="material-icons text-3xl text-yt-red">graphic_eq</span>
        <div>
          <h2 className="text-xl font-bold text-yt-text-primary uppercase tracking-wider">Estúdio de Áudio</h2>
          <p className="text-xs text-yt-text-secondary mt-1">Grave sua voz e deixe a IA cortar automaticamente os silêncios (jump-cut).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gravação */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 bg-yt-bg-primary border border-yt-bg-overlay rounded-sm text-center min-h-[250px] flex flex-col items-center justify-center">
            {isRecording ? (
              <div className="space-y-6 w-full flex flex-col items-center">
                <div className="w-full flex justify-center h-24">
                  <canvas ref={canvasRef} width={400} height={96} className="w-full max-w-[400px] h-full" />
                </div>
                
                <div className="flex items-center gap-3 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 font-mono text-xl tracking-wider">
                    {formatTime(recordingSeconds)}
                  </span>
                </div>

                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold uppercase tracking-widest text-sm rounded-sm border border-red-500/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-icons text-base">stop</span>
                  Parar Gravação
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={startRecording}
                  className="w-24 h-24 bg-yt-red hover:bg-yt-red-hover text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)] transition-all cursor-pointer transform hover:scale-105"
                >
                  <span className="material-icons text-4xl">mic</span>
                </button>
                <p className="text-yt-text-primary font-bold uppercase tracking-wider">Clique para gravar</p>
              </div>
            )}
          </div>

          {/* Player & Actions */}
          {rawBlob && !isRecording && (
            <div className="p-4 bg-yt-bg-surface border border-yt-bg-overlay rounded-sm space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-yt-text-primary uppercase tracking-wider flex items-center gap-2">
                  <span className="material-icons text-yt-blue text-base">check_circle</span>
                  Gravação Concluída
                </h3>
              </div>

              {!processedUrl ? (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={processAudio}
                    disabled={isProcessing}
                    className="w-full py-3 bg-yt-blue hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-xs rounded-sm transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <span className="material-icons animate-spin text-base">sync</span>
                        Cortando silêncios...
                      </>
                    ) : (
                      <>
                        <span className="material-icons text-base">content_cut</span>
                        Gerar Áudio com Jump-Cuts
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-sm">
                  <h4 className="text-xs font-bold text-[#66bb6a] uppercase tracking-wider flex items-center gap-2">
                    <span className="material-icons text-base">auto_awesome</span>
                    Áudio Processado com Sucesso!
                  </h4>
                  <audio src={processedUrl} controls className="w-full h-10 outline-none" />
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 py-2.5 bg-[#66bb6a] hover:bg-[#81c784] text-gray-900 font-bold uppercase tracking-widest text-xs rounded-sm transition-all flex justify-center items-center gap-2 cursor-pointer"
                    >
                      <span className="material-icons text-base">download</span>
                      Baixar .WAV
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-sm flex items-center gap-2">
              <span className="material-icons text-sm">error</span>
              {error}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <div className="p-5 bg-yt-bg-primary border border-yt-bg-overlay rounded-sm space-y-6">
            <h3 className="text-xs font-bold text-yt-text-primary uppercase tracking-widest flex items-center gap-2 border-b border-yt-bg-overlay/50 pb-2">
              <span className="material-icons text-yt-text-secondary text-base">tune</span>
              Configurações do Corte
            </h3>

            <div className="space-y-2">
              <label className="flex justify-between text-[11px] font-semibold text-yt-text-secondary uppercase tracking-wider">
                <span>Sensibilidade (Volume)</span>
                <span className="text-yt-blue">{thresholdDb} dB</span>
              </label>
              <input
                type="range"
                min="-60"
                max="-10"
                step="1"
                value={thresholdDb}
                onChange={(e) => setThresholdDb(Number(e.target.value))}
                className="w-full accent-yt-blue"
              />
              <p className="text-[10px] text-yt-text-disabled">
                Se os cortes não estiverem removendo sua respiração, aumente este valor (ex: -30dB). Se estiver cortando sua voz suave, diminua (ex: -50dB).
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex justify-between text-[11px] font-semibold text-yt-text-secondary uppercase tracking-wider">
                <span>Pausa Mínima</span>
                <span className="text-yt-blue">{minSilenceDurationMs} ms</span>
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={minSilenceDurationMs}
                onChange={(e) => setMinSilenceDurationMs(Number(e.target.value))}
                className="w-full accent-yt-blue"
              />
              <p className="text-[10px] text-yt-text-disabled">
                Quanto tempo de silêncio precisa acontecer para o sistema decidir cortar. Valores menores resultam em edições mais agressivas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
