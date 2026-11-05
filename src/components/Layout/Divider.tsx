/** Maroon band with a gold lotus: frames each parchment section like the opening's border. */
export default function Divider() {
  return (
    <div aria-hidden className="weave flex items-center justify-center gap-3 bg-maroon py-4">
      <span className="h-px w-20 bg-gradient-to-r from-transparent to-zari/80" />
      <svg viewBox="0 0 40 28" className="h-6 w-9 text-zari" fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d="M20 3c4 5 4 12 0 17-4-5-4-12 0-17Z" />
        <path d="M20 20c-6-1-10-5-11-10 6 0 10 3 11 10Zm0 0c6-1 10-5 11-10-6 0-10 3-11 10Z" />
        <path d="M6 24c6 3 22 3 28 0" />
      </svg>
      <span className="h-px w-20 bg-gradient-to-l from-transparent to-zari/80" />
    </div>
  );
}
