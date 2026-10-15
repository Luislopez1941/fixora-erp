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
    <div className={`variations-modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className={`variations-modal-content ${isOpen ? 'active' : ''}`}>
        <div className='variations-modal-header'>
          <h2>Gestionar Variaciones</h2>
          <button
            className='variations-modal-close'
            onClick={onClose}
          >
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
        <div className='variations-modal-body'>
          <VariationsManager variations={variations} onChange={onChange} />
        </div>
      </div>
    </div>
  );
};

export default VariationsModal;
