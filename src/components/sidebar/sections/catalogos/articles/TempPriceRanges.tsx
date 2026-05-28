import React, { useState } from 'react';
import './TempPriceRanges.css';

interface PriceRange {
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
}

interface TempPriceRangesProps {
  ranges: PriceRange[];
  onChange: (ranges: PriceRange[]) => void;
}

const TempPriceRanges: React.FC<TempPriceRangesProps> = ({ ranges, onChange }) => {
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
    <div className='temp-price-ranges'>
      <h4>Rangos de Precio (Opcional)</h4>
      
      {ranges.length > 0 && (
        <div className='temp-price-ranges__list'>
          {ranges.map((range, index) => (
            <div key={index} className='temp-price-ranges__item'>
              <span>
                {range.minQuantity} - {range.maxQuantity || '∞'} unidades: ${range.price}
              </span>
              <button
                type='button'
                onClick={() => handleDelete(index)}
                className='temp-price-ranges__delete'
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className='temp-price-ranges__form'>
        <input
          type='number'
          min='1'
          value={minQuantity}
          onChange={(e) => setMinQuantity(parseInt(e.target.value) || 1)}
          placeholder='Cantidad mínima'
          className='temp-price-ranges__input'
        />
        <input
          type='number'
          min='1'
          value={maxQuantity || ''}
          onChange={(e) => setMaxQuantity(e.target.value ? parseInt(e.target.value) : null)}
          placeholder='Cantidad máxima (opcional)'
          className='temp-price-ranges__input'
        />
        <input
          type='number'
          step='0.01'
          min='0'
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
          placeholder='Precio'
          className='temp-price-ranges__input'
        />
        <button
          type='button'
          onClick={handleAdd}
          className='temp-price-ranges__add'
        >
          + Agregar
        </button>
      </div>
    </div>
  );
};

export default TempPriceRanges;
