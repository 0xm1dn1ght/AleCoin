export function CoinLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="13" fill="#e0a83a" />
      <g fill="#12291f">
        <circle cx="14" cy="9.5" r="3.6" />
        <circle cx="9.8" cy="15" r="3.6" />
        <circle cx="18.2" cy="15" r="3.6" />
      </g>
      <path
        d="M14 14 Q15 19 17.5 22"
        stroke="#12291f"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
