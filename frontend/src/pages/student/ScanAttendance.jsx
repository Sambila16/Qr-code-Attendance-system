import { useRef, useState } from 'react';
import QrScanner from '../../components/QrScanner';
import SignaturePad from '../../components/SignaturePad';
import client from '../../api/client';
import { getDeviceFingerprint } from '../../utils/fingerprint';

const STEPS = { SCAN: 'scan', SIGN: 'sign', DONE: 'done' };

export default function ScanAttendance() {
  const [step, setStep] = useState(STEPS.SCAN);
  const [scanned, setScanned] = useState(null);
  const [scanError, setScanError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const sigRef = useRef(null);

  function handleScanResult(decodedText) {
    try {
      const payload = JSON.parse(decodedText);
      if (!payload.sessionId || !payload.token) throw new Error('bad payload');
      setScanned(payload);
      setScanError('');
      setStep(STEPS.SIGN);
    } catch {
      setScanError('That QR code doesn\u2019t look like a valid Presence attendance code.');
    }
  }

  async function handleSubmit() {
    const signature = sigRef.current?.getSignature();
    if (!signature) {
      setSubmitError('Please add your signature before submitting.');
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      const { data } = await client.post('/attendance/mark', {
        session_id: scanned.sessionId,
        token: scanned.token,
        signature,
        device_fingerprint: getDeviceFingerprint(),
      });
      setResult(data);
      setStep(STEPS.DONE);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Could not submit attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(STEPS.SCAN);
    setScanned(null);
    setResult(null);
    setSubmitError('');
    setScanError('');
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-1">Mark attendance</h1>
      <p className="text-mist text-sm mb-6">
        {step === STEPS.SCAN && 'Point your camera at the QR code your class representative is displaying.'}
        {step === STEPS.SIGN && 'Confirm your presence by signing below.'}
        {step === STEPS.DONE && 'All done.'}
      </p>

      {step === STEPS.SCAN && (
        <div className="card p-6">
          <QrScanner active={step === STEPS.SCAN} onResult={handleScanResult} onError={setScanError} />
          {scanError && <p className="text-sm text-danger text-center mt-4">{scanError}</p>}
          <p className="text-xs text-mist text-center mt-4">
            The code refreshes every few seconds - make sure you're scanning the current one.
          </p>
        </div>
      )}

      {step === STEPS.SIGN && (
        <div className="card p-6">
          <p className="text-sm font-medium mb-3">Your signature</p>
          <SignaturePad ref={sigRef} />
          {submitError && <p className="text-sm text-danger mt-4">{submitError}</p>}
          <div className="flex gap-3 mt-5">
            <button className="btn-secondary flex-1" onClick={reset} disabled={submitting}>
              Rescan
            </button>
            <button className="btn-primary flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Confirm presence'}
            </button>
          </div>
        </div>
      )}

      {step === STEPS.DONE && result && (
        <div className="card p-8 text-center">
          <div
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 ${
              result.status === 'flagged' ? 'bg-danger/15' : 'bg-accent/15'
            }`}
          >
            <span className={`text-2xl ${result.status === 'flagged' ? 'text-danger' : 'text-accent'}`}>
              {result.status === 'flagged' ? '!' : '✓'}
            </span>
          </div>
          <p className="font-display font-semibold text-lg">
            {result.status === 'flagged' ? 'Recorded, but flagged' : 'Attendance marked'}
          </p>
          <p className="text-sm text-mist mt-1">{result.message}</p>
          <button className="btn-secondary mt-6" onClick={reset}>
            Mark another session
          </button>
        </div>
      )}
    </div>
  );
}
