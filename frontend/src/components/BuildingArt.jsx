import { useState } from 'react';

function Cloud({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity="0.85">
      <ellipse cx="0" cy="0" rx="18" ry="7" />
      <ellipse cx="12" cy="-5" rx="11" ry="7" />
      <ellipse cx="-10" cy="-4" rx="9" ry="6" />
    </g>
  );
}

function SmallCar({ x, y, color }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="6" width="34" height="11" rx="4" fill={color} />
      <path d="M7 6 L11 0 H24 L28 6 Z" fill={color} />
      <path d="M10 6 L13 1.5 H17 V6 Z M19 6 V1.5 H23 L26 6 Z" fill="#dbe9fb" />
      <circle cx="8" cy="17" r="3.5" fill="#26324a" />
      <circle cx="26" cy="17" r="3.5" fill="#26324a" />
    </g>
  );
}

function Tree({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-1.5" y="0" width="3" height="12" fill="#7a6a58" />
      <circle cx="0" cy="-4" r="10" fill="#8fd6b0" />
      <circle cx="-6" cy="0" r="7" fill="#7fcaa2" />
    </g>
  );
}

function MallArt() {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration of a shopping mall">
      <defs>
        <linearGradient id="sky-mall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bcd6fb" />
          <stop offset="1" stopColor="#eaf3ff" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#sky-mall)" />
      <Cloud x={60} y={34} />
      <Cloud x={250} y={26} s={0.8} />
      <g fill="#c9d9f2">
        <rect x="8" y="88" width="34" height="80" />
        <rect x="278" y="76" width="34" height="92" />
      </g>
      <rect x="46" y="70" width="228" height="98" fill="#fff" />
      <rect x="46" y="70" width="228" height="15" fill="#3a6ae0" />
      <rect x="60" y="94" width="200" height="44" rx="3" fill="#cfe0fb" />
      <g stroke="#fff" strokeWidth="2">
        <line x1="93" y1="94" x2="93" y2="138" />
        <line x1="127" y1="94" x2="127" y2="138" />
        <line x1="193" y1="94" x2="193" y2="138" />
        <line x1="227" y1="94" x2="227" y2="138" />
      </g>
      <rect x="146" y="122" width="28" height="46" rx="2" fill="#3a6ae0" />
      <rect x="159" y="122" width="2" height="46" fill="#fff" />
      <rect x="236" y="104" width="4" height="64" fill="#5a6a86" />
      <rect x="224" y="82" width="28" height="28" rx="6" fill="#3a6ae0" />
      <text x="238" y="104" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" textAnchor="middle" fill="#fff">P</text>
      <rect x="0" y="168" width="320" height="32" fill="#d3dbea" />
      <line x1="0" y1="186" x2="320" y2="186" stroke="#fff" strokeWidth="2" strokeDasharray="14 10" />
      <Tree x={24} y={150} />
      <Tree x={300} y={152} />
      <SmallCar x={70} y={171} color="#e4572e" />
      <SmallCar x={210} y={172} color="#7a4bd6" />
    </svg>
  );
}

function AirportArt() {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration of an airport terminal with a plane">
      <defs>
        <linearGradient id="sky-air" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8cdfa" />
          <stop offset="1" stopColor="#e9f3ff" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#sky-air)" />
      <Cloud x={52} y={52} s={1.1} />
      <Cloud x={190} y={30} s={0.8} />
      <g transform="translate(206 52) rotate(-8)">
        <ellipse cx="0" cy="0" rx="36" ry="6.5" fill="#fff" />
        <path d="M-8 0 L-26 -24 H-16 L6 0 Z" fill="#dbe6f7" />
        <path d="M-8 0 L-26 24 H-16 L6 0 Z" fill="#c4d4ec" />
        <path d="M-34 0 L-42 -13 H-35 L-26 0 Z" fill="#3a6ae0" />
        <ellipse cx="27" cy="-1" rx="6" ry="3" fill="#7aa2ff" />
      </g>
      <rect x="244" y="62" width="14" height="108" fill="#e8eefc" stroke="#c4d4ec" />
      <path d="M236 62 H266 L262 48 H240 Z" fill="#3a6ae0" />
      <rect x="241" y="51" width="22" height="7" fill="#bcd3f7" />
      <rect x="28" y="118" width="200" height="52" fill="#fff" />
      <path d="M22 118 Q128 78 234 118 Z" fill="#7aa2ff" />
      <rect x="42" y="130" width="172" height="22" fill="#cfe0fb" />
      <g stroke="#fff" strokeWidth="2">
        <line x1="76" y1="130" x2="76" y2="152" />
        <line x1="110" y1="130" x2="110" y2="152" />
        <line x1="144" y1="130" x2="144" y2="152" />
        <line x1="178" y1="130" x2="178" y2="152" />
      </g>
      <rect x="118" y="152" width="22" height="18" fill="#3a6ae0" />
      <rect x="0" y="170" width="320" height="30" fill="#8d99ae" />
      <line x1="0" y1="185" x2="320" y2="185" stroke="#fff" strokeWidth="3" strokeDasharray="22 14" />
    </svg>
  );
}

function StationArt() {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration of a railway station with a train">
      <defs>
        <linearGradient id="sky-stn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bcd6fb" />
          <stop offset="1" stopColor="#fff0d9" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#sky-stn)" />
      <Cloud x={70} y={36} />
      <Cloud x={256} y={44} s={0.85} />
      <rect x="40" y="96" width="240" height="68" fill="#fff6e6" />
      <polygon points="40,96 160,64 280,96" fill="#e8801f" />
      <rect x="146" y="30" width="28" height="68" fill="#fff6e6" stroke="#f0d7b0" />
      <polygon points="142,30 160,14 178,30" fill="#e8801f" />
      <circle cx="160" cy="48" r="9" fill="#fff" stroke="#5a6a86" strokeWidth="2" />
      <path d="M160 48 V42 M160 48 L165 50" stroke="#5a6a86" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <g fill="#bcd3f7">
        <path d="M58 150 V124 a10 10 0 0 1 20 0 V150 Z" />
        <path d="M92 150 V124 a10 10 0 0 1 20 0 V150 Z" />
        <path d="M208 150 V124 a10 10 0 0 1 20 0 V150 Z" />
        <path d="M242 150 V124 a10 10 0 0 1 20 0 V150 Z" />
      </g>
      <path d="M138 164 V132 a22 22 0 0 1 44 0 V164 Z" fill="#e8801f" />
      <path d="M146 164 V134 a14 14 0 0 1 28 0 V164 Z" fill="#fff6e6" />
      <rect x="0" y="164" width="320" height="10" fill="#b4bfd3" />
      <rect x="0" y="174" width="320" height="26" fill="#8d99ae" />
      <g fill="#5a6a86">
        <rect x="0" y="180" width="320" height="2" />
        <rect x="0" y="192" width="320" height="2" />
      </g>
      <g>
        <rect x="14" y="164" width="108" height="24" rx="5" fill="#fff" />
        <rect x="14" y="176" width="108" height="5" fill="#e8801f" />
        <rect x="22" y="169" width="14" height="8" rx="1.5" fill="#7aa2ff" />
        <rect x="42" y="169" width="14" height="8" rx="1.5" fill="#7aa2ff" />
        <rect x="62" y="169" width="14" height="8" rx="1.5" fill="#7aa2ff" />
        <rect x="82" y="169" width="14" height="8" rx="1.5" fill="#7aa2ff" />
        <rect x="102" y="169" width="14" height="8" rx="1.5" fill="#7aa2ff" />
        <rect x="124" y="164" width="108" height="24" rx="5" fill="#fff" />
        <rect x="124" y="176" width="108" height="5" fill="#e8801f" />
        <rect x="132" y="169" width="14" height="8" rx="1.5" fill="#7aa2ff" />
        <rect x="152" y="169" width="14" height="8" rx="1.5" fill="#7aa2ff" />
        <rect x="172" y="169" width="14" height="8" rx="1.5" fill="#7aa2ff" />
        <rect x="192" y="169" width="14" height="8" rx="1.5" fill="#7aa2ff" />
        <rect x="212" y="169" width="14" height="8" rx="1.5" fill="#7aa2ff" />
      </g>
    </svg>
  );
}

export function BuildingArt({ type }) {
  if (type === 'airport') return <AirportArt />;
  if (type === 'railway') return <StationArt />;
  return <MallArt />;
}

// The real photo when /images/<slug>.jpg exists, otherwise an illustration
export function BuildingPhoto({ building, className = '' }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const showImage = building.imageUrl && failedUrl !== building.imageUrl;
  return (
    <div className={`photo ${className}`}>
      {showImage ? (
        <img
          src={building.imageUrl}
          alt={building.name}
          loading="lazy"
          onError={() => setFailedUrl(building.imageUrl)}
        />
      ) : (
        <BuildingArt type={building.type} />
      )}
    </div>
  );
}
