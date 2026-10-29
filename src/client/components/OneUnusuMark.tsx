import React from 'react';

/**
 * Tanda ONE UNUSU untuk halaman masuk aplikasi yang terintegrasi SSO.
 *
 * Satu tile hijau bertanda "1" dikelilingi dua busur yang berputar berlawanan
 * arah: satu akun sebagai pusat seluruh layanan kampus. Animasi bersifat
 * dekoratif dan berhenti sendiri bila pengguna memilih "kurangi gerakan" pada
 * sistem operasinya.
 */
const STYLES = `
  .oneunusu-mark__spin-a,
  .oneunusu-mark__spin-b,
  .oneunusu-mark__glow {
    transform-origin: 32px 32px;
  }
  .oneunusu-mark__spin-a { animation: oneunusu-mark-spin 14s linear infinite; }
  .oneunusu-mark__spin-b { animation: oneunusu-mark-spin 11s linear infinite reverse; }
  .oneunusu-mark__glow { animation: oneunusu-mark-pulse 4.2s ease-in-out infinite; }
  @keyframes oneunusu-mark-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes oneunusu-mark-pulse {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    50% { opacity: 0.03; transform: scale(1.14); }
  }
  @media (prefers-reduced-motion: reduce) {
    .oneunusu-mark__spin-a,
    .oneunusu-mark__spin-b,
    .oneunusu-mark__glow { animation: none; }
  }
`;

interface OneUnusuMarkProps {
  size?: number;
  className?: string;
}

export function OneUnusuMark({ size = 96, className = '' }: OneUnusuMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="ONE UNUSU"
      focusable="false"
      className={className}
    >
      <style>{STYLES}</style>

      <defs>
        <linearGradient id="oneunusu-mark-core" x1="16" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#15803D" />
          <stop offset="1" stopColor="#0A5C36" />
        </linearGradient>
        <filter id="oneunusu-mark-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#0A5C36" floodOpacity="0.22" />
        </filter>
      </defs>

      <circle className="oneunusu-mark__glow" cx="32" cy="32" r="19" fill="#166534" />

      <circle
        className="oneunusu-mark__spin-a"
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="#166534"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="26 162.5"
      />
      <circle
        className="oneunusu-mark__spin-b"
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="26 162.5"
        strokeDashoffset="-94.2"
      />

      <rect x="12" y="12" width="40" height="40" rx="12.5" fill="url(#oneunusu-mark-core)" filter="url(#oneunusu-mark-shadow)" />
      <rect
        x="13.2"
        y="13.2"
        width="37.6"
        height="37.6"
        rx="11.4"
        fill="none"
        stroke="#D4AF37"
        strokeOpacity="0.4"
        strokeWidth="1"
      />

      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize="22"
        fontWeight="800"
        fontFamily="'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif"
      >
        1
      </text>
    </svg>
  );
}

export default OneUnusuMark;

