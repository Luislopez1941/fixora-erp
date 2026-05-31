import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { modal } from '../../../../../redux/state/modals';
import ConfigurationAPIs from '../../../../../services/configurationAPIs';
import './PriceRanges.css';

interface Item {
  id: number;
  name: string;
  code: string;
}

interface PriceRange {
  id: number;
  itemId: number;
  minQuantity: number;
  maxQuantity: number | null;
  price: string;
  item?: Item;
}

const PriceRanges = () => {
  const dispatch = useDispatch();
  const [items, setItems] = useState<Item[]>([]);
  const [_priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      fetchPriceRanges();
    }
  }, [selectedItemId]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token-eco');
      const data = await ConfigurationAPIs.get('item', {
        headers: { Authorization: token },
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceRanges = async () => {
    if (!selectedItemId) return;
    
    setLoading(true);
    try {
      const data = await ConfigurationAPIs.get<PriceRange[]>(
        `item/price-range/item/${selectedItemId}`
      );
      setPriceRanges(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar rangos de precios:', error);
      setPriceRanges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (itemId: number) => {
    setSelectedItemId(itemId);
    dispatch(modal('price-ranges-modal'));
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.code && item.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className='price-ranges'>
      <div className='price-ranges__header'>
        <h1>Rangos de Precios</h1>
        <p>Configura precios escalonados por cantidad para tus productos</p>
      </div>

      <div className='price-ranges__search'>
        <input
          type='text'
          placeholder='Buscar artículo por nombre o código...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='price-ranges__search-input'
        />
      </div>

      <div className='price-ranges__content'>
        {loading ? (
          <p className='price-ranges__loading'>Cargando...</p>
        ) : filteredItems.length === 0 ? (
          <p className='price-ranges__empty'>No se encontraron artículos</p>
        ) : (
          <div className='price-ranges__grid'>
            {filteredItems.map((item) => (
              <div key={item.id} className='price-ranges__card'>
                <div className='price-ranges__card-header'>
                  <h3>{item.name}</h3>
                  {item.code && <span className='price-ranges__card-code'>{item.code}</span>}
                </div>
                <button
                  className='btn__general-orange'
                  onClick={() => handleOpenModal(item.id)}
                >
                  💰 Configurar Rangos
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceRanges;
