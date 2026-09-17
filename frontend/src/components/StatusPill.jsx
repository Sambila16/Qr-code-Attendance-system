export default function StatusPill({ status }) {
  if (status === 'flagged') {
    return (
      <span className="pill bg-danger/15 text-danger">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4m0 4h.01M10.3 3.86 1.8 18a1 1 0 0 0 .86 1.5h18.68a1 1 0 0 0 .86-1.5L13.7 3.86a1 1 0 0 0-1.72 0Z" strokeLinejoin="round" />
        </svg>
        Flagged
      </span>
    );
  }
  return (
    <span className="pill bg-accent/15 text-accent">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Valid
    </span>
  );
}
