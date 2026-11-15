export function LogoMark({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeWidth="6.5" className="stroke-foreground">
        <path d="M59.9 22.5 A34 34 0 0 1 80 77.9" />
        <path d="M62.8 88.8 A34 34 0 0 1 20.1 59" />
      </g>
      <g className="fill-foreground stroke-background" strokeWidth="5" paintOrder="stroke">
        <path d="M36 14 a21 21 0 1 1 6 41 q-6 8 -15 9 q5 -5 4 -10 A21 21 0 0 1 36 14 z" />
      </g>
      <circle cx="71" cy="83" r="5" className="fill-primary" style={{ filter: "drop-shadow(0 0 5px var(--primary))" }} />
    </svg>
  );
}

export function Wordmark({ className = "text-5xl" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      tumeni<span className="text-primary">.</span>
    </span>
  );
}
