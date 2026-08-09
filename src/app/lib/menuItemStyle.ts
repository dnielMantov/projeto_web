import type { CSSProperties, MouseEvent } from 'react';

/**
 * Estilo + hover compartilhado por itens de menu tipo lista (login, cadastro,
 * painel, sair...). Usado no dropdown da conta no cabeçalho e no card da
 * conta em /minha-conta, para os dois seguirem o mesmo padrão de destaque.
 */
export function menuItemProps(baseColor: string, hoverColor = '#06b6d4') {
  return {
    style: {
      display: 'block' as const,
      width: '100%',
      textAlign: 'left' as const,
      padding: '0.65rem 1rem',
      color: baseColor,
      fontSize: '0.875rem',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'color 0.15s, background 0.15s',
    } satisfies CSSProperties,
    onMouseEnter: (e: MouseEvent) => {
      (e.currentTarget as HTMLElement).style.color = hoverColor;
      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
    },
    onMouseLeave: (e: MouseEvent) => {
      (e.currentTarget as HTMLElement).style.color = baseColor;
      (e.currentTarget as HTMLElement).style.background = 'none';
    },
  };
}
