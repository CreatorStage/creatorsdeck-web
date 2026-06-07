export interface Interval {
  start: number;
  end: number;
}

export async function findKeepIntervals(
  blob: Blob,
  thresholdDb: number = -40,
  minSilenceDurationMs: number = 500,
  paddingMs: number = 100
): Promise<{ intervalsInSeconds: Interval[]; audioBuffer: AudioBuffer }> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0); // Using first channel for analysis

  const thresholdAmplitude = Math.pow(10, thresholdDb / 20);
  const minSilenceSamples = (minSilenceDurationMs / 1000) * sampleRate;
  const paddingSamples = (paddingMs / 1000) * sampleRate;

  const windowSize = Math.floor(sampleRate * 0.01);
  const isSilent: boolean[] = new Array(Math.ceil(channelData.length / windowSize)).fill(false);

  for (let i = 0; i < channelData.length; i += windowSize) {
    let sumSquares = 0;
    let count = 0;
    for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
      sumSquares += channelData[i + j] * channelData[i + j];
      count++;
    }
    const rms = Math.sqrt(sumSquares / count);
    const windowIndex = Math.floor(i / windowSize);
    isSilent[windowIndex] = rms < thresholdAmplitude;
  }

  const silenceIntervals: Interval[] = [];
  let silenceStartIdx = -1;

  for (let w = 0; w < isSilent.length; w++) {
    if (isSilent[w]) {
      if (silenceStartIdx === -1) silenceStartIdx = w;
    } else {
      if (silenceStartIdx !== -1) {
        const silenceSamples = (w - silenceStartIdx) * windowSize;
        if (silenceSamples >= minSilenceSamples) {
          silenceIntervals.push({
            start: silenceStartIdx * windowSize,
            end: w * windowSize,
          });
        }
        silenceStartIdx = -1;
      }
    }
  }

  if (silenceStartIdx !== -1) {
    const silenceSamples = (isSilent.length - silenceStartIdx) * windowSize;
    if (silenceSamples >= minSilenceSamples) {
      silenceIntervals.push({
        start: silenceStartIdx * windowSize,
        end: channelData.length,
      });
    }
  }

  const keepIntervalsSamples: Interval[] = [];
  let currentKeepStart = 0;

  for (const interval of silenceIntervals) {
    const cutStart = Math.min(channelData.length, interval.start + paddingSamples);
    const cutEnd = Math.max(0, interval.end - paddingSamples);
    
    if (cutStart < cutEnd) {
      if (cutStart > currentKeepStart) {
        keepIntervalsSamples.push({ start: currentKeepStart, end: Math.floor(cutStart) });
      }
      currentKeepStart = Math.floor(cutEnd);
    }
  }

  if (currentKeepStart < channelData.length) {
    keepIntervalsSamples.push({ start: currentKeepStart, end: channelData.length });
  }

  const intervalsInSeconds = keepIntervalsSamples.map(inv => ({
    start: inv.start / sampleRate,
    end: inv.end / sampleRate
  }));

  audioContext.close();
  
  return { intervalsInSeconds, audioBuffer };
}

export async function processAudioRemovingSilence(
  blob: Blob,
  thresholdDb: number = -40,
  minSilenceDurationMs: number = 500,
  paddingMs: number = 100
): Promise<Blob> {
  
  const { intervalsInSeconds, audioBuffer } = await findKeepIntervals(blob, thresholdDb, minSilenceDurationMs, paddingMs);
  const sampleRate = audioBuffer.sampleRate;
  
  const keepIntervalsSamples = intervalsInSeconds.map(inv => ({
    start: Math.floor(inv.start * sampleRate),
    end: Math.floor(inv.end * sampleRate)
  }));

  let totalKeepSamples = 0;
  for (const inv of keepIntervalsSamples) {
    totalKeepSamples += (inv.end - inv.start);
  }

  if (totalKeepSamples === 0) {
    throw new Error("O áudio inteiro foi considerado como silêncio.");
  }

  const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  const offlineCtx = new OfflineCtx(
    audioBuffer.numberOfChannels,
    totalKeepSamples,
    sampleRate
  );
  
  const newBuffer = offlineCtx.createBuffer(
    audioBuffer.numberOfChannels,
    totalKeepSamples,
    sampleRate
  );

  let currentWriteOffset = 0;
  for (const inv of keepIntervalsSamples) {
    const copyLength = inv.end - inv.start;
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelIn = audioBuffer.getChannelData(channel);
      const channelOut = newBuffer.getChannelData(channel);
      
      const portion = channelIn.subarray(inv.start, inv.end);
      channelOut.set(portion, currentWriteOffset);
    }
    currentWriteOffset += copyLength;
  }

  return audioBufferToWav(newBuffer);
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArray], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(offset, data, true);
    offset += 2;
  }
  function setUint32(data: number) {
    view.setUint32(offset, data, true);
    offset += 4;
  }
}
