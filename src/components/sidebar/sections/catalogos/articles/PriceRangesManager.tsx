import React, { useState, useEffect } from 'react';
import ConfigurationAPIs from '../../../../../services/configurationAPIs';
import './PriceRangesManager.css';

interface PriceRange {
  id?: number;
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
}

interface PriceRangesManagerProps {
  itemId?: number;
  itemVariationId?: number;
  onClose: () => void;
}

const PriceRangesManager: React.FC<PriceRangesManagerProps> = ({
  itemId,
  itemVariationId,
  onClose,
}) => {
  console.log('PriceRangesManager renderizado', { itemId, itemVariationId });
  
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRange, setNewRange] = useState<PriceRange>({
    minQuantity: 1,
    maxQuantity: null,
    price: 0,
  });

  const fetchPriceRanges = async () => {
    setLoading(true);
    try {
      const endpoint = itemVariationId
        ? `item/price-range/variation/${itemVariationId}`
        : `item/price-range/item/${itemId}`;
      
      const data = await ConfigurationAPIs.get<PriceRange[]>(endpoint);
      setPriceRanges(data);
    } catch (error) {
      console.error('Error al cargar rangos de precios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceRanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, itemVariationId]);

  const handleAddRange = async () => {
    if (newRange.price <= 0 || newRange.minQuantity < 1) {
      alert('Por favor ingresa valores válidos');
      return;
    }

    try {
      await ConfigurationAPIs.post('item/price-range', {
        itemId,
        itemVariationId,
        minQuantity: newRange.minQuantity,
        maxQuantity: newRange.maxQuantity,
        price: newRange.price,
      });

      await fetchPriceRanges();
      setNewRange({ minQuantity: 1, maxQuantity: null, price: 0 });
    } catch (error) {
      console.error('Error al crear rango de precios:', error);
      alert('Error al crear rango de precios');
    }
  };

  const handleDeleteRange = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este rango de precios?')) return;

    try {
      await ConfigurationAPIs.delete(`item/price-range/${id}`);
      await fetchPriceRanges();
    } catch (error) {
      console.error('Error al eliminar rango de precios:', error);
      alert('Error al eliminar rango de precios');
    }
  };

  return (
    <div className="price-ranges-modal">
      <div className="price-ranges-content">
        <div className="price-ranges-header">
          <h2>Rangos de Precios</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="price-ranges-body">
          {/* Lista de rangos existentes */}
          <div className="ranges-list">
            <h3>Rangos Configurados</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : priceRanges.length === 0 ? (
              <p className="no-ranges">No hay rangos de precios configurados</p>
            ) : (
              <table className="ranges-table">
                <thead>
                  <tr>
                    <th>Cantidad Mínima</th>
                    <th>Cantidad Máxima</th>
                    <th>Precio Unitario</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {priceRanges.map((range) => (
                    <tr key={range.id}>
                      <td>{range.minQuantity}</td>
                      <td>{range.maxQuantity || 'Sin límite'}</td>
                      <td>${parseFloat(range.price.toString()).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn-delete-range"
                          onClick={() => handleDeleteRange(range.id!)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Formulario para agregar nuevo rango */}
          <div className="add-range-form">
            <h3>Agregar Nuevo Rango</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Cantidad Mínima</label>
                <input
                  type="number"
                  min="1"
                  value={newRange.minQuantity}
                  onChange={(e) =>
                    setNewRange({ ...newRange, minQuantity: parseInt(e.target.value) || 1 })
                  }
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Cantidad Máxima (opcional)</label>
                <input
                  type="number"
                  min="1"
                  value={newRange.maxQuantity || ''}
                  onChange={(e) =>
                    setNewRange({
                      ...newRange,
                      maxQuantity: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Sin límite"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Precio Unitario</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRange.price}
                  onChange={(e) =>
                    setNewRange({ ...newRange, price: parseFloat(e.target.value) || 0 })
                  }
                  className="input-field"
                />
              </div>

              <button className="btn-add-range" onClick={handleAddRange}>
                Agregar Rango
              </button>
            </div>

            <div className="help-text">
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
      </div>
    </div>
  );
};

export default PriceRangesManager;
