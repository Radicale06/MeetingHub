import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export const Modal = ({ open, onClose, title, children, width }: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="mh-modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="mh-modal" style={width ? { width } : undefined}>
        <div className="mh-modal-header">
          <h3>{title}</h3>
          <button className="mh-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="mh-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};
