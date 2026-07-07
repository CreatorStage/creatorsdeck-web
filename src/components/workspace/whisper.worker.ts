import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

let transcriber: any = null;

async function getTranscriber(progress_callback: (data: any) => void) {
  if (!transcriber) {
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      progress_callback,
    });
  }
  return transcriber;
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, audio } = event.data;

  if (type === 'load') {
    try {
      await getTranscriber((data: any) => {
        if (data.status === 'progress') {
          self.postMessage({
            type: 'progress',
            file: data.file,
            progress: data.progress,
            loaded: data.loaded,
            total: data.total
          });
        } else if (data.status === 'ready') {
          self.postMessage({ type: 'ready' });
        }
      });
      self.postMessage({ type: 'loaded' });
    } catch (err: any) {
      self.postMessage({ type: 'error', message: err.message || err });
    }
  } else if (type === 'transcribe') {
    try {
      const activeTranscriber = await getTranscriber(() => {});
      self.postMessage({ type: 'transcribing' });
      
      const startTime = performance.now();
      const response = await activeTranscriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: 'portuguese',
        task: 'transcribe',
        return_timestamps: false
      });
      const duration = performance.now() - startTime;
      
      self.postMessage({
        type: 'completed',
        text: response.text,
        duration
      });
    } catch (err: any) {
      self.postMessage({ type: 'error', message: err.message || err });
    }
  }
});
