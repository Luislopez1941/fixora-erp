import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../../production/production.css'
import '../catalog-views.css'
import { AREA_TYPE_OPTIONS } from '../../../../../constants/catalogTypes'
const CatalogTypes: React.FC = () => {
  const navigate = useNavigate()

  const viewSubAreas = (type: string) => {
    navigate(`/auth/catalogos/areas?type=${type}`)
  }

  const AREA_ICONS: Record<string, string> = {
    GENERAL: 'corporate_fare',
    SALES: 'point_of_sale',
    PURCHASES: 'shopping_bag',
    WAREHOUSE: 'warehouse',
    PRODUCTION: 'precision_manufacturing',
    ADMIN: 'admin_panel_settings',
  }

  return (
    <div className='catalog-areas-types production'>
      <div className='production__container'>
        <header className='production__header'>
          <span className='production__eyebrow'>Catálogo</span>
          <h1 className='production__title'>Áreas</h1>
          <p className='production__subtitle'>
            Clasificación de áreas del sistema. Selecciona un área para ver sus subáreas.
          </p>
        </header>

        <section className='catalog-areas__grid'>
          {AREA_TYPE_OPTIONS.map((typeOption) => (
            <article
              key={typeOption.value}
              className='catalog-area__card'
              style={{
                '--area-color': typeOption.color,
                '--area-color-bg': `${typeOption.color}18`,
                '--area-color-border': `${typeOption.color}28`,
              } as React.CSSProperties}
            >
              <div className='catalog-area__top'>
                <div
                  className='catalog-area__icon'
                  style={{
                    color: typeOption.color,
                    background: `${typeOption.color}14`,
                    borderColor: `${typeOption.color}30`,
                  }}
                >
                  <span className='material-symbols-rounded' style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>
                    {AREA_ICONS[typeOption.value] ?? 'category'}
                  </span>
                </div>

                <div className='catalog-area__actions-row'>
                  <button
                    type='button'
                    className='catalog-area__btn-icon'
                    title='Ver Subáreas'
                    onClick={() => viewSubAreas(typeOption.value)}
                  >
                    <span className='material-symbols-rounded' style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>visibility</span>
                  </button>
                  <button
                    type='button'
                    className='catalog-area__btn-icon catalog-area__btn-icon--primary'
                    title='Administrar'
                    onClick={() => viewSubAreas(typeOption.value)}
                  >
                    <span className='material-symbols-rounded' style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                  </button>
                </div>
              </div>

              <h3 className='catalog-area__title'>{typeOption.label}</h3>
              <p className='catalog-area__desc'>{typeOption.description}</p>

              <div className='catalog-area__meta'>
                <span className='catalog-area__tag' style={{ color: typeOption.color }}>
                  <span className='material-symbols-rounded' style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                  {typeOption.value}
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}

export default CatalogTypes
