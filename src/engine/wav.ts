export function audioBufferToWav(buf: AudioBuffer): Blob {
  const numCh = Math.min(2, buf.numberOfChannels);
  const l = buf.getChannelData(0);
  const r = numCh > 1 ? buf.getChannelData(1) : l;
  const length = l.length;
  const sampleRate = buf.sampleRate;
  const out = new ArrayBuffer(44 + length * 4);
  const view = new DataView(out);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + length * 4, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, length * 4, true);
  let off = 44;
  for (let i = 0; i < length; i++) {
    view.setInt16(off, Math.max(-1, Math.min(1, l[i])) * 0x7fff, true);
    view.setInt16(off + 2, Math.max(-1, Math.min(1, r[i])) * 0x7fff, true);
    off += 4;
  }
  return new Blob([out], { type: "audio/wav" });
}
