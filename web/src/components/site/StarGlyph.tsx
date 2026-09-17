/** A four-point star, the atlas mark for a named star. */
export function StarGlyph({ className = "", size = 10 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" className={className} fill="currentColor">
      <path d="M5 0C5.3 3 7 4.7 10 5 7 5.3 5.3 7 5 10 4.7 7 3 5.3 0 5 3 4.7 4.7 3 5 0Z" />
    </svg>
  );
}
