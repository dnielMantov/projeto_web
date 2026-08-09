interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal de confirmação genérico, usado hoje para "tem certeza que deseja sair?". */
export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(3,7,18,0.7)', zIndex: 300, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="confirm-dialog-in"
        style={{
          background: '#0f1829',
          border: '1px solid #1e2d4a',
          borderRadius: '1rem',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '360px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: '1px solid #1e2d4a',
              color: '#94a3b8',
              borderRadius: '0.625rem',
              padding: '0.6rem 1.1rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#e2e8f0'; (e.currentTarget as HTMLElement).style.borderColor = '#334155'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor = '#1e2d4a'; }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: danger ? '#ef4444' : '#06b6d4',
              color: danger ? '#fff' : '#000',
              border: 'none',
              borderRadius: '0.625rem',
              padding: '0.6rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
