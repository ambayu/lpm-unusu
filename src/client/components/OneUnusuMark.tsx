import React from 'react';

/**
 * Tanda ONE UNUSU untuk halaman masuk aplikasi yang terintegrasi SSO.
 *
 * Dua busur berputar berlawanan arah mengelilingi satu inti: satu akun sebagai
 * pusat seluruh layanan kampus. Animasi bersifat dekoratif dan berhenti sendiri
 * bila pengguna memilih "kurangi gerakan" pada sistem operasinya.
 */
const STYLES = `
  .oneunusu-mark__spin-a,
  .oneunusu-mark__spin-b,
  .oneunusu-mark__halo {
    transform-origin: 32px 32px;
  }
  .oneunusu-mark__spin-a { animation: oneunusu-mark-spin 6s linear infinite; }
  .oneunusu-mark__spin-b { animation: oneunusu-mark-spin 9s linear infinite reverse; }
  .oneunusu-mark__halo { animation: oneunusu-mark-pulse 3.6s ease-in-out infinite; }
  @keyframes oneunusu-mark-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes oneunusu-mark-pulse {
    0%, 100% { opacity: 0.18; transform: scale(1); }
    50% { opacity: 0.05; transform: scale(1.22); }
  }
  @media (prefers-reduced-motion: reduce) {
    .oneunusu-mark__spin-a,
    .oneunusu-mark__spin-b,
    .oneunusu-mark__halo { animation: none; }
  }
`;

interface OneUnusuMarkProps {
  size?: number;
  className?: string;
}

export function OneUnusuMark({ size = 64, className = '' }: OneUnusuMarkProps) {
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
        <linearGradient id="oneunusu-mark-core" x1="19" y1="17" x2="45" y2="49" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#15803D" />
          <stop offset="1" stopColor="#0A5C36" />
        </linearGradient>
      </defs>

      <circle cx="32" cy="32" r="31" fill="#F0FDF4" />
      <circle cx="32" cy="32" r="31" fill="none" stroke="#166534" strokeOpacity="0.12" />
      <circle className="oneunusu-mark__halo" cx="32" cy="32" r="16.5" fill="#166534" />

      <circle
        className="oneunusu-mark__spin-a"
        cx="32"
        cy="32"
        r="25.5"
        fill="none"
        stroke="#166534"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="44 116"
      />
      <circle
        className="oneunusu-mark__spin-b"
        cx="32"
        cy="32"
        r="25.5"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="16 144"
        strokeDashoffset="-58"
      />

      <circle cx="32" cy="32" r="15.5" fill="url(#oneunusu-mark-core)" />
      <circle cx="32" cy="32" r="12" fill="none" stroke="#D4AF37" strokeOpacity="0.45" />

      <text
        x="32"
        y="32.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize="17"
        fontWeight="800"
        fontFamily="'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif"
      >
        1
      </text>
    </svg>
  );
}

export default OneUnusuMark;

