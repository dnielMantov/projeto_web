interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
      }}
    >
      <svg width={size * 0.54} height={size * 0.54} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 5.5C4 4.67 4.67 4 5.5 4H11v14.5H5.5A1.5 1.5 0 0 1 4 17V5.5Z"
          fill="rgba(255,255,255,0.85)"
        />
        <path
          d="M20 5.5c0-.83-.67-1.5-1.5-1.5H13v14.5h5.5c.83 0 1.5-.67 1.5-1.5V5.5Z"
          fill="#ffffff"
        />
        <circle cx="12" cy="3" r="1.5" fill="#ffffff" />
        <path d="M12 4.5V6" stroke="#ffffff" strokeWidth="1.15" strokeLinecap="round" />
      </svg>
    </div>
  );
}
