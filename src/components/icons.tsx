export function PlaneIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M10.5 3.5 3 12l3 1 2 3.5 1.5-1.5-1-3 3-3 4 7.5 1.5-1L14 4l-1-1-2.5.5Z"
        fill="currentColor"
      />
      <path
        d="M2.5 12 10 4l1.2.9-6.2 8.4L2.5 12ZM21.5 12 14 20l-1.2-.9 6.2-8.4 2.5 1.3Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

export function BusIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="12" rx="3" fill="currentColor" opacity="0.15" />
      <rect x="3" y="4" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4v6M16 4v6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7.5" cy="18.5" r="1.7" fill="currentColor" />
      <circle cx="16.5" cy="18.5" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function SwapIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 7h13m0 0-3.5-3.5M19 7l-3.5 3.5M18 17H5m0 0 3.5 3.5M5 17l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UsersIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15.5 6.2A3.2 3.2 0 1 1 16.7 12.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15 14.3c2.6.3 4.5 2.5 4.5 5.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SeatIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 4v9a2 2 0 0 0 2 2h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M7 4h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="6" y="15" width="12" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M17 8v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon({ className = "w-3.5 h-3.5", filled = true }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.6}>
      <path d="M12 2.5l2.9 6.3 6.8.7-5.1 4.6 1.5 6.7L12 17.6l-6.1 3.2 1.5-6.7L2.3 9.5l6.8-.7L12 2.5Z" />
    </svg>
  );
}

export function GripIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="6" r="1.4" fill="currentColor" />
      <circle cx="15" cy="6" r="1.4" fill="currentColor" />
      <circle cx="9" cy="12" r="1.4" fill="currentColor" />
      <circle cx="15" cy="12" r="1.4" fill="currentColor" />
      <circle cx="9" cy="18" r="1.4" fill="currentColor" />
      <circle cx="15" cy="18" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function ChevronIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2.5c.5 3.3 1.2 4 4.5 4.5-3.3.5-4 1.2-4.5 4.5-.5-3.3-1.2-4-4.5-4.5 3.3-.5 4-1.2 4.5-4.5Z"
        fill="currentColor"
      />
      <path
        d="M19 13c.3 2 .7 2.4 2.7 2.7-2 .3-2.4.7-2.7 2.7-.3-2-.7-2.4-2.7-2.7 2-.3 2.4-.7 2.7-2.7Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

export function WifiIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 9.5a12 12 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 13a7.5 7.5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 16.5a3 3 0 0 1 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="19.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function CheckCircleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12.5l2.5 2.5 5.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XCircleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CardIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function QrCodeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14.5" y="14.5" width="2.5" height="2.5" fill="currentColor" />
      <rect x="18.5" y="14.5" width="2.5" height="2.5" fill="currentColor" />
      <rect x="14.5" y="18.5" width="2.5" height="2.5" fill="currentColor" />
      <rect x="18.5" y="18.5" width="2.5" height="2.5" fill="currentColor" />
    </svg>
  );
}

export function LeafIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 19c-1-6 2-13 14-14 1 12-6 15-14 14Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M6 18c3-4 6-7 12-11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5.3l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WalletIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2.5" y="6" width="19" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 6a2.2 2.2 0 0 1 2.2-2.2h11.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function BellIcon({
  className = "w-4 h-4",
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={className}>
      <path
        d="M6 10.5a6 6 0 0 1 12 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6Z"
        stroke={filled ? "none" : "currentColor"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 19.5a2.5 2.5 0 0 0 5 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
