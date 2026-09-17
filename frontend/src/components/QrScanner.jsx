import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const ELEMENT_ID = 'qr-reader-region';

export default function QrScanner({ onResult, onError, active }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    const html5Qr = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = html5Qr;
    let stopped = false;

    html5Qr
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (!stopped) onResult(decodedText);
        },
        () => {} // ignore per-frame "not found" noise
      )
      .catch((err) => onError?.(err?.message || 'Could not access the camera'));

    return () => {
      stopped = true;
      html5Qr
        .stop()
        .then(() => html5Qr.clear())
        .catch(() => {});
    };
  }, [active]);

  return (
    <div className="rounded-xl overflow-hidden bg-black aspect-square w-full max-w-sm mx-auto relative">
      <div id={ELEMENT_ID} className="w-full h-full" />
    </div>
  );
}
 
