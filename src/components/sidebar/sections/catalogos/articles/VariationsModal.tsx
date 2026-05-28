import React from 'react';
import VariationsManager, { Variation } from '../VariationsManager';
import './VariationsModal.css';

interface VariationsModalProps {
  variations: Variation[];
  onChange: (variations: Variation[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const VariationsModal: React.FC<VariationsModalProps> = ({ variations, onChange, isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className='variations-modal-overlay'>
      <div className='variations-modal-content'>
        <div className='variations-modal-header'>
          <h2>Gestionar Variaciones</h2>
          <button
            className='variations-modal-close'
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className='variations-modal-body'>
          <VariationsManager variations={variations} onChange={onChange} />
        </div>
        <div className='variations-modal-footer'>
          <button
            className='btn__general-purple'
            onClick={onClose}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariationsModal;
