type IconProps = {
  className?: string;
};

function IconFrame({
  children,
  className = ""
}: IconProps & { children: React.ReactNode }) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-white text-caramel shadow-soft ${className}`}
    >
      {children}
    </div>
  );
}

export function BagelIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="15" fill="#D1B79F" />
        <circle cx="24" cy="24" r="6" fill="#FFF8F1" />
        <circle cx="18" cy="18" r="1.3" fill="#8A6147" />
        <circle cx="29" cy="17" r="1.2" fill="#8A6147" />
        <circle cx="32" cy="25" r="1.1" fill="#8A6147" />
        <circle cx="18" cy="29" r="1.1" fill="#8A6147" />
      </svg>
    </IconFrame>
  );
}

export function TeaIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" aria-hidden="true">
        <path
          d="M14 19h18v7a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-7Z"
          fill="#B97252"
          opacity="0.3"
        />
        <path
          d="M14 19h18v7a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-7Zm18 2h3a4 4 0 0 1 0 8h-2"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M20 14c0-2 2-2 2-4m6 4c0-2 2-2 2-4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      </svg>
    </IconFrame>
  );
}

export function SneakersIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" aria-hidden="true">
        <path
          d="M12 28h8l5-6 5 5 6 2v5H12v-6Z"
          fill="#D1B79F"
          opacity="0.45"
        />
        <path
          d="M12 28h8l5-6 5 5 6 2v5H12v-6Zm11-5 3 3m-1-6 4 4m-12 6h3m3 0h3m3 0h3"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconFrame>
  );
}

export function JournalIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" aria-hidden="true">
        <rect x="14" y="11" width="20" height="26" rx="3" fill="#B97252" opacity="0.28" />
        <rect x="14" y="11" width="20" height="26" rx="3" stroke="currentColor" strokeWidth="2.3" />
        <path d="M19 11v26M22 19h7m-7 6h7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      </svg>
    </IconFrame>
  );
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M8 6.5v11l9-5.5-9-5.5Z" />
    </svg>
  );
}

export function PaperPlaneIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className ?? "h-12 w-12"}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 22.5 39 9l-9.8 30-8.3-10.2L8 22.5Z"
        fill="#B97252"
        opacity="0.16"
      />
      <path
        d="M8 22.5 39 9l-9.8 30-8.3-10.2M8 22.5l13 3.9m18-17.4L21 26.4m0 0 1.4 9.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
