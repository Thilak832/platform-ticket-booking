export function LogoMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#logo-grad)" />
      <path
        d="M11 21.5V13a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v8.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="10" y="13.5" width="12" height="6.5" rx="2.2" fill="white" fillOpacity="0.18" stroke="white" strokeWidth="1.6" />
      <circle cx="13.2" cy="23.4" r="1.4" fill="white" />
      <circle cx="18.8" cy="23.4" r="1.4" fill="white" />
      <path d="M10 16.6h12" stroke="white" strokeWidth="1.4" />
      <defs>
        <linearGradient id="logo-grad" x1="1" y1="1" x2="31" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f766e" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function StationIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="11" fill="var(--primary-light)" />
      <path d="M12 26V15a8 8 0 0 1 16 0v11" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="10.5" y="16" width="19" height="9" rx="3" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.8" />
      <circle cx="15" cy="27.5" r="1.7" fill="var(--primary)" />
      <circle cx="25" cy="27.5" r="1.7" fill="var(--primary)" />
      <path d="M10.5 20.5h19" stroke="var(--primary)" strokeWidth="1.4" />
    </svg>
  );
}

export function DropOffIcon({ active }) {
  const c = active ? "white" : "var(--primary)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3v11.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M7.5 10.5 12 15l4.5-4.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 18.5h15" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PickUpIcon({ active }) {
  const c = active ? "white" : "var(--primary)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 20.5V9" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M7.5 13.5 12 9l4.5 4.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 4.5h15" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ViewWaitIcon({ active }) {
  const c = active ? "white" : "var(--primary)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke={c} strokeWidth="2" />
      <path d="M12 8v4.3l3 1.9" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WalletChipIcon() {
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="33" height="25" rx="5" fill="#f4d35e" stroke="#c9a227" />
      <line x1="0.5" y1="8.5" x2="33.5" y2="8.5" stroke="#c9a227" />
      <line x1="0.5" y1="17.5" x2="33.5" y2="17.5" stroke="#c9a227" />
      <line x1="11" y1="0.5" x2="11" y2="25.5" stroke="#c9a227" />
      <line x1="23" y1="0.5" x2="23" y2="25.5" stroke="#c9a227" />
    </svg>
  );
}

export function EmptyTicketsIllustration() {
  return (
    <svg width="140" height="110" viewBox="0 0 140 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="70" cy="98" rx="52" ry="8" fill="var(--neutral-bg)" />
      <rect x="24" y="26" width="92" height="56" rx="10" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
      <circle cx="98" cy="54" r="16" fill="var(--primary-light)" />
      <path d="M91 54h14M98 47v14" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
      <rect x="34" y="38" width="34" height="5" rx="2.5" fill="var(--neutral-border)" />
      <rect x="34" y="48" width="46" height="5" rx="2.5" fill="var(--neutral-border)" />
      <rect x="34" y="58" width="26" height="5" rx="2.5" fill="var(--neutral-border)" />
      <path d="M24 40c-8-2-16 3-16 3" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
      <path d="M116 68c8 2 16-3 16-3" stroke="var(--border)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StatIcon({ kind }) {
  const paths = {
    bookings: (
      <path d="M7 3v3M17 3v3M4.5 9h15M6 5h12a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V6.5A1.5 1.5 0 0 1 6 5Z" />
    ),
    users: (
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M9.5 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 20v-1.5a3.2 3.2 0 0 0-2.2-3.03M15 4.6a3 3 0 0 1 0 5.8" />
    ),
    revenue: (
      <path d="M12 4v16M17 8a4 4 0 0 0-4-2h-1.5a3 3 0 0 0 0 6h3a3 3 0 0 1 0 6H12a4 4 0 0 1-4-2" />
    ),
    total: (
      <path d="M4 19V9.5L12 4l8 5.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z" />
    ),
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      {paths[kind]}
    </svg>
  );
}

export function HeroIllustration() {
  return (
    <svg viewBox="0 0 420 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-illustration">
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#e6fbf8" />
          <stop offset="1" stopColor="#f4faf9" />
        </linearGradient>
        <linearGradient id="hero-train" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#0f766e" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <rect width="420" height="260" rx="24" fill="url(#hero-sky)" />
      <circle cx="352" cy="52" r="26" fill="#fde68a" opacity="0.7" />
      <path d="M0 208h420" stroke="#99e6dc" strokeWidth="2" />
      <path d="M0 214h420" stroke="#99e6dc" strokeWidth="2" strokeDasharray="10 8" />

      <rect x="46" y="120" width="150" height="72" rx="14" fill="url(#hero-train)" />
      <rect x="60" y="134" width="26" height="26" rx="6" fill="white" fillOpacity="0.85" />
      <rect x="94" y="134" width="26" height="26" rx="6" fill="white" fillOpacity="0.85" />
      <rect x="128" y="134" width="26" height="26" rx="6" fill="white" fillOpacity="0.85" />
      <rect x="46" y="176" width="150" height="10" fill="white" fillOpacity="0.25" />
      <circle cx="72" cy="198" r="10" fill="#0f172a" />
      <circle cx="72" cy="198" r="4" fill="#94a3b8" />
      <circle cx="168" cy="198" r="10" fill="#0f172a" />
      <circle cx="168" cy="198" r="4" fill="#94a3b8" />
      <path d="M196 150h20a10 10 0 0 1 10 10v14h-30z" fill="url(#hero-train)" />

      <g transform="translate(250,70)">
        <rect x="0" y="0" width="120" height="130" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        <rect x="14" y="16" width="92" height="10" rx="5" fill="#ccfbf1" />
        <rect x="14" y="34" width="60" height="8" rx="4" fill="#e6fbf8" />
        <rect x="14" y="58" width="92" height="46" rx="6" fill="#f1f5f9" />
        <rect x="24" y="68" width="26" height="26" rx="3" fill="#0f172a" />
        <rect x="28" y="72" width="4" height="4" fill="white" />
        <rect x="36" y="72" width="4" height="4" fill="white" />
        <rect x="28" y="80" width="4" height="4" fill="white" />
        <rect x="36" y="80" width="4" height="4" fill="white" />
        <rect x="58" y="68" width="40" height="6" rx="3" fill="#99e6dc" />
        <rect x="58" y="80" width="30" height="6" rx="3" fill="#99e6dc" />
        <circle cx="106" cy="116" r="9" fill="#f59e0b" />
        <path d="M102 116l3 3 6-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <path d="M20 200c30-10 40 8 70-2" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
