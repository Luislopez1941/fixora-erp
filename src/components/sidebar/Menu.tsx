import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { PrivateRoutes } from '../../models/routes'
import './Menu.css'

const Menu: React.FC = () => {
    const [status, setStatus] = useState(3)

    const menu = (value: any) => {
        setStatus(value)
    }

    return (
        <div className='menu'>
            <div className='menu__container'>
                <Link to={`/${PrivateRoutes.PRIVATE}/store/inventory`}>
                    <div className={`item ${status == 1 ? 'active' : ''}`} onClick={() => menu(1)} title='Inventario'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-clipboard-text"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M17.997 4.17a3 3 0 0 1 2.003 2.83v12a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 2.003 -2.83a4 4 0 0 0 3.997 3.83h4a4 4 0 0 0 3.98 -3.597zm-2.997 10.83h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m0 -4h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m-1 -9a2 2 0 1 1 0 4h-4a2 2 0 1 1 0 -4z" /></svg>
                    </div>
                </Link>
                <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.CATALOGOS}/${PrivateRoutes.ARTICLES}`}>
                    <div className={`item ${status == 2 ? 'active' : ''}`} onClick={() => menu(2)} title='Artículos'>
                        <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 -960 960 960" width="30" fill="currentColor"><path d="M440-91v-366L120-642v321q0 22 10.5 40t29.5 29L440-91Zm80 0 280-161q19-11 29.5-29t10.5-40v-321L520-457v366Zm159-550 118-69-277-159q-19-11-40-11t-40 11l-79 45 318 183ZM480-526l119-68-317-184-120 69 318 183Z" /></svg>
                    </div>
                </Link>
                <Link to={`/${PrivateRoutes.PRIVATE}`}>
                    <div className={`item ${status == 3 ? 'active' : ''}`} onClick={() => menu(3)}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 -960 960 960" width="30" fill="currentColor"><path d="M160-200v-360q0-19 8.5-36t23.5-28l240-180q21-16 48-16t48 16l240 180q15 11 23.5 28t8.5 36v360q0 33-23.5 56.5T720-120H600q-17 0-28.5-11.5T560-160v-200q0-17-11.5-28.5T520-400h-80q-17 0-28.5 11.5T400-360v200q0 17-11.5 28.5T360-120H240q-33 0-56.5-23.5T160-200Z" /></svg>
                    </div>
                </Link>
                <div className={`item ${status == 4 ? 'active' : ''}`} onClick={() => menu(4)}>
                    <Link to={`${PrivateRoutes.INCOME}`}>
                        <div className={`item ${status == 4 ? 'active' : ''}`} onClick={() => menu(3)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-tag"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M11.172 2a3 3 0 0 1 2.121 .879l7.71 7.71a3.41 3.41 0 0 1 0 4.822l-5.592 5.592a3.41 3.41 0 0 1 -4.822 0l-7.71 -7.71a3 3 0 0 1 -.879 -2.121v-5.172a4 4 0 0 1 4 -4zm-3.672 3.5a2 2 0 0 0 -1.995 1.85l-.005 .15a2 2 0 1 0 2 -2" /></svg>
                        </div>
                    </Link>
                </div>
                <Link to={`/${PrivateRoutes.PRIVATE}/options`}>
                    <div className={`item ${status == 5 ? 'active' : ''}`} onClick={() => menu(5)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-category"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 3h-6a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1 -1v-6a1 1 0 0 0 -1 -1z" /><path d="M20 3h-6a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1 -1v-6a1 1 0 0 0 -1 -1z" /><path d="M10 13h-6a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1 -1v-6a1 1 0 0 0 -1 -1z" /><path d="M17 13a4 4 0 1 1 -3.995 4.2l-.005 -.2l.005 -.2a4 4 0 0 1 3.995 -3.8z" /></svg>
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default Menu
