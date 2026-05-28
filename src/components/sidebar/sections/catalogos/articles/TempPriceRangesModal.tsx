import React, { useState } from 'react';
import './TempPriceRangesModal.css';

interface PriceRange {
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
}

interface TempPriceRangesModalProps {
  ranges: PriceRange[];
  onChange: (ranges: PriceRange[]) => void;
  onClose: () => void;
}

const TempPriceRangesModal: React.FC<TempPriceRangesModalProps> = ({ ranges, onChange, onClose }) => {
  const [minQuantity, setMinQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState<number | null>(null);
  const [price, setPrice] = useState(0);

  const handleAdd = () => {
    if (price <= 0 || minQuantity < 1) {
      alert('Por favor ingresa valores válidos');
      return;
    }

    const newRange: PriceRange = {
      minQuantity,
      maxQuantity,
      price,
    };

    onChange([...ranges, newRange]);
    setMinQuantity(1);
    setMaxQuantity(null);
    setPrice(0);
  };

  const handleDelete = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index));
  };

  return (
    <div className='temp-price-ranges-modal-overlay'>
      <div className='temp-price-ranges-modal-content'>
        <div className='temp-price-ranges-modal-header'>
          <h2>Rangos de Precio</h2>
          <button className='temp-price-ranges-modal-close' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='temp-price-ranges-modal-body'>
          {ranges.length > 0 && (
            <div className='temp-price-ranges-list'>
              <h3>Rangos Configurados</h3>
              <table className='temp-price-ranges-table'>
                <thead>
                  <tr>
                    <th>Cantidad Mínima</th>
                    <th>Cantidad Máxima</th>
                    <th>Precio Unitario</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ranges.map((range, index) => (
                    <tr key={index}>
                      <td>{range.minQuantity}</td>
                      <td>{range.maxQuantity || 'Sin límite'}</td>
                      <td>${range.price.toFixed(2)}</td>
                      <td>
                        <button
                          className='temp-price-ranges-delete'
                          onClick={() => handleDelete(index)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className='temp-price-ranges-form'>
            <h3>Agregar Nuevo Rango</h3>
            <div className='temp-price-ranges-form-row'>
              <div className='temp-price-ranges-form-group'>
                <label>Cantidad Mínima</label>
                <input
                  type='number'
                  min='1'
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(parseInt(e.target.value) || 1)}
                  className='temp-price-ranges-input'
                />
              </div>

              <div className='temp-price-ranges-form-group'>
                <label>Cantidad Máxima (opcional)</label>
                <input
                  type='number'
                  min='1'
                  value={maxQuantity || ''}
                  onChange={(e) => setMaxQuantity(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder='Sin límite'
                  className='temp-price-ranges-input'
                />
              </div>

              <div className='temp-price-ranges-form-group'>
                <label>Precio Unitario</label>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className='temp-price-ranges-input'
                />
              </div>

              <button className='temp-price-ranges-add' onClick={handleAdd}>
                Agregar Rango
              </button>
            </div>

            <div className='temp-price-ranges-help'>
              <p><strong>Ejemplo:</strong></p>
              <ul>
                <li>1-9 unidades: $350.00 (precio base del producto)</li>
                <li>10-19 unidades: $299.00</li>
                <li>20-49 unidades: $280.00</li>
                <li>50+ unidades: $250.00 (sin límite máximo)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className='temp-price-ranges-modal-footer'>
          <button className='btn__general-purple' onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default TempPriceRangesModal;
