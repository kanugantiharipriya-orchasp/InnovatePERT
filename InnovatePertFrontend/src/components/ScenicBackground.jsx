/* Light, airy scenic background — pastel mountains, lake and mist.
   Pure inline SVG, light colors only. Renders as a full-bleed layer
   behind the floating white auth panels (reference style). */

function ScenicBackground({ className = "" }) {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DBF1FF" />
          <stop offset="0.55" stopColor="#EEF9FF" />
          <stop offset="1" stopColor="#F8FDFF" />
        </linearGradient>
        <linearGradient id="sc-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9EEF0" />
          <stop offset="1" stopColor="#E9FAF8" />
        </linearGradient>
        <radialGradient id="sc-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF6CF" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#FFEDB8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFEDB8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* sky */}
      <rect width="1440" height="900" fill="url(#sc-sky)" />

      {/* sun glow */}
      <circle cx="1110" cy="190" r="240" fill="url(#sc-sun)" />
      <circle cx="1110" cy="190" r="64" fill="#FFF3C4" opacity="0.85" />

      {/* soft clouds */}
      <g fill="#FFFFFF" opacity="0.65">
        <ellipse cx="260" cy="150" rx="150" ry="26" />
        <ellipse cx="340" cy="135" rx="110" ry="20" />
        <ellipse cx="880" cy="120" rx="180" ry="28" />
        <ellipse cx="970" cy="105" rx="120" ry="20" />
        <ellipse cx="1320" cy="220" rx="150" ry="24" />
      </g>

      {/* far ridge */}
      <path
        d="M0 470 C 120 380, 230 420, 350 385 C 470 350, 540 400, 660 375
           C 800 345, 900 420, 1030 385 C 1160 350, 1260 410, 1380 380 L 1440 395 V 540 H 0 Z"
        fill="#C3E2F8"
        opacity="0.85"
      />

      {/* mid ridge */}
      <path
        d="M0 540 C 150 470, 300 515, 440 485 C 600 450, 700 520, 860 492
           C 1020 462, 1140 525, 1300 495 C 1380 480, 1420 500, 1440 505 V 660 H 0 Z"
        fill="#B7E3D6"
      />

      {/* near ridge with pine silhouettes */}
      <path
        d="M0 630 C 160 575, 320 615, 480 592 C 640 568, 780 630, 960 605
           C 1120 582, 1260 635, 1440 610 V 700 H 0 Z"
        fill="#8FD2BF"
      />
      <g fill="#7CC7B1">
        <path d="M180 585 l14 -30 14 30 z" />
        <path d="M205 592 l12 -26 12 26 z" />
        <path d="M560 585 l14 -32 14 32 z" />
        <path d="M585 590 l12 -26 12 26 z" />
        <path d="M1010 580 l14 -30 14 30 z" />
        <path d="M1038 586 l12 -25 12 25 z" />
        <path d="M1290 592 l13 -28 13 28 z" />
      </g>

      {/* mist bands */}
      <g fill="#FFFFFF" opacity="0.55">
        <ellipse cx="320" cy="430" rx="260" ry="34" />
        <ellipse cx="880" cy="450" rx="300" ry="40" />
        <ellipse cx="1240" cy="560" rx="280" ry="36" />
      </g>

      {/* lake */}
      <rect y="688" width="1440" height="212" fill="url(#sc-lake)" />

      {/* lake reflection streaks */}
      <g stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" opacity="0.5">
        <line x1="180" y1="740" x2="320" y2="740" />
        <line x1="560" y1="780" x2="760" y2="780" />
        <line x1="980" y1="735" x2="1120" y2="735" />
        <line x1="1200" y1="800" x2="1330" y2="800" />
      </g>
      <g stroke="#AFE4DB" strokeWidth="8" strokeLinecap="round" opacity="0.4">
        <line x1="260" y1="820" x2="400" y2="820" />
        <line x1="820" y1="850" x2="1010" y2="850" />
      </g>

      {/* foreground fade into white (keeps text areas clean) */}
      <rect y="780" width="1440" height="120" fill="#FFFFFF" opacity="0.35" />
    </svg>
  );
}

export default ScenicBackground;
