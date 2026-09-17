// A lightweight, dependency-free device fingerprint. It doesn't need to be
// cryptographically unique — it only needs to be *stable* for the same
// physical device/browser, so the backend can catch one phone marking
// attendance for several registration numbers in the same session.
function computeFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasSig = '';
  try {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('presence-fp', 2, 2);
    canvasSig = canvas.toDataURL();
  } catch {
    canvasSig = 'no-canvas';
  }

  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvasSig,
  ].join('||');

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash)}`;
}

export function getDeviceFingerprint() {
  const key = 'presence_device_fp';
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = computeFingerprint();
    localStorage.setItem(key, fp);
  }
  return fp;
}
