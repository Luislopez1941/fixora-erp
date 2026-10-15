import { useEffect, useState } from 'react';
import ConfigurationAPIs from '../../../../../services/configurationAPIs';
import PriceRangesManager from '../articles/PriceRangesManager';
import TableSkeleton from '../../../../general/skeleton/TableSkeleton';
import './PriceRanges.css';

interface Item {
  id: number;
  name: string;
  code: string;
}

const PriceRanges = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Artículo cuyo administrador de rangos está abierto (null = cerrado)
  const [managerItemId, setManagerItemId] = useState<number | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token-fixora');
      const data = await ConfigurationAPIs.get('item', {
        headers: { Authorization: token },
      });
      const list = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
      setItems(list);
    } catch (error) {
      console.error('Error al cargar items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filteredItems = items.filter((item) =>
    !q ||
    item.name?.toLowerCase().includes(q) ||
    (item.code && item.code.toLowerCase().includes(q))
  );

  return (
    <div className='price-ranges'>
      <div className='price-ranges__container'>
        <div className='price-ranges__header'>
          <div className='price-ranges__search'>
            <span className='price-ranges__search-icon material-symbols-rounded' aria-hidden>search</span>
            <input
              type='text'
              placeholder='Buscar artículo por nombre o código'
              aria-label='Buscar artículos'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='inputs__general price-ranges__search-input'
            />
          </div>
          <p className='price-ranges__hint'>Configura precios escalonados por cantidad para cada artículo</p>
        </div>

        {/* La tabla siempre se ve; el skeleton va dentro */}
        <div className='price-ranges__list'>
          <div className='price-ranges__row price-ranges__row--head'>
            <span>Código</span>
            <span>Artículo</span>
            <span className='price-ranges__col-actions'>Acciones</span>
          </div>

          {loading ? (
            <TableSkeleton rowClassName='price-ranges__row' cols={[{ pill: true, width: '64px' }, { width: '55%' }, { actions: 1 }]} />
          ) : filteredItems.length === 0 ? (
            <div className='price-ranges__state'>
              <p>{q ? 'No se encontraron artículos con ese criterio' : 'No hay artículos registrados'}</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div className='price-ranges__row' key={item.id}>
                <div className='price-ranges__cell' data-label='Código'>
                  {item.code ? <span className='price-ranges__tag'>{item.code}</span> : '—'}
                </div>
                <div className='price-ranges__cell price-ranges__cell--name' data-label='Artículo'>
                  <strong>{item.name}</strong>
                </div>
                <div className='price-ranges__cell price-ranges__col-actions'>
                  <button
                    type='button'
                    className='price-ranges__icon-btn'
                    title='Configurar rangos de precio'
                    aria-label='Configurar rangos de precio'
                    onClick={() => setManagerItemId(item.id)}
                  >
                    <span className='material-symbols-rounded'>sell</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {managerItemId != null && (
        <PriceRangesManager itemId={managerItemId} onClose={() => setManagerItemId(null)} />
      )}
    </div>
  );
};

export default PriceRanges;
