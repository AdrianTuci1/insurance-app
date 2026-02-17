import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, isFullScreen = false }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-container ${isFullScreen ? 'full-screen' : ''}`} onClick={e => e.stopPropagation()}>
                <button className="modal-close-absolute" onClick={onClose} aria-label="Close modal">
                    <X size={20} />
                </button>
                <div className="modal-content">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
