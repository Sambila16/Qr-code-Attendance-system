import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = forwardRef(function SignaturePad(_props, ref) {
  const sigRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useImperativeHandle(ref, () => ({
    getSignature: () => {
      if (!sigRef.current || sigRef.current.isEmpty()) return null;
      return sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    },
    isEmpty: () => sigRef.current?.isEmpty() ?? true,
    clear: () => {
      sigRef.current?.clear();
      setIsEmpty(true);
    },
  }));

  return (
    <div>
      <div className="rounded-xl overflow-hidden border-2 border-dashed border-white/15 bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="#12172B"
          canvasProps={{ width: 460, height: 180, className: 'w-full h-[180px]' }}
          onEnd={() => setIsEmpty(sigRef.current?.isEmpty() ?? true)}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-mist">Sign inside the box with your finger or mouse</p>
        <button
          type="button"
          onClick={() => {
            sigRef.current?.clear();
            setIsEmpty(true);
          }}
          className="text-xs text-accent2 hover:underline"
          disabled={isEmpty}
        >
          Clear
        </button>
      </div>
    </div>
  );
});

export default SignaturePad;
