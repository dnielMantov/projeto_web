import { useEffect, useRef, useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: ReactNode;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  align?: 'left' | 'right';
  ariaLabel?: string;
  disabled?: boolean;
  title?: string;
}

/**
 * Menu suspenso próprio do site, para não depender do <select> nativo do
 * sistema operacional (cuja aparência não pode ser estilizada). A seta gira
 * 180° ao abrir/fechar, no mesmo padrão do menu da conta no cabeçalho.
 */
export function Dropdown({ value, options, onChange, style, buttonStyle, align = 'left', ariaLabel, disabled, title }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block" style={style}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        title={title}
        disabled={disabled}
        className="flex items-center justify-between gap-2"
        style={{
          background: '#0f1829',
          border: '1px solid #1e2d4a',
          borderRadius: '0.5rem',
          color: '#e2e8f0',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          outline: 'none',
          width: '100%',
          whiteSpace: 'nowrap',
          ...buttonStyle,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected?.label ?? value}</span>
        <ChevronDown
          size={15}
          style={{
            flexShrink: 0,
            color: '#64748b',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {open && (
        <div
          className="dropdown-menu-in absolute overflow-hidden"
          style={{
            top: 'calc(100% + 0.4rem)',
            [align === 'right' ? 'right' : 'left']: 0,
            background: '#0f1829',
            border: '1px solid #1e2d4a',
            borderRadius: '0.625rem',
            minWidth: '100%',
            zIndex: 60,
            boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
          }}
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full text-left"
                style={{
                  display: 'block',
                  padding: '0.6rem 0.9rem',
                  background: isActive ? 'rgba(6,182,212,0.12)' : 'transparent',
                  color: isActive ? '#06b6d4' : '#e2e8f0',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 400,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isActive ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLElement).style.color = '#06b6d4';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isActive ? 'rgba(6,182,212,0.12)' : 'transparent';
                  (e.currentTarget as HTMLElement).style.color = isActive ? '#06b6d4' : '#e2e8f0';
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
