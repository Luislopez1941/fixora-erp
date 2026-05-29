import React from 'react'
import { Link } from 'react-router-dom'
import { PrivateRoutes } from '../../models/routes'
import './OptionsMenu.css'

const OptionsMenu: React.FC = () => {
    return (
        <div className='options__menu'>
            <div className='options__menu_container'>
                <div className='row__one'>
                    <div className='item'>
                        <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.MENUSALES}`} title="Payments" className="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="icon_sidebar icon icon-tabler icons-tabler-filled icon-tabler-tag"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M11.172 2a3 3 0 0 1 2.121 .879l7.71 7.71a3.41 3.41 0 0 1 0 4.822l-5.592 5.592a3.41 3.41 0 0 1 -4.822 0l-7.71 -7.71a3 3 0 0 1 -.879 -2.121v-5.172a4 4 0 0 1 4 -4zm-3.672 3.5a2 2 0 0 0 -1.995 1.85l-.005 .15a2 2 0 1 0 2 -2" /></svg>
                            <p>Ventas</p>
                        </Link>
                    </div>
                    <div className='item'>
                        <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.MENUSHOPPING}`} title="Payments" className="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="icon_sidebar icon icon-tabler icons-tabler-filled icon-tabler-shopping-cart"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 2a1 1 0 0 1 .993 .883l.007 .117v1.068l13.071 .935a1 1 0 0 1 .929 1.024l-.01 .114l-1 7a1 1 0 0 1 -.877 .853l-.113 .006h-12v2h10a3 3 0 1 1 -2.995 3.176l-.005 -.176l.005 -.176c.017 -.288 .074 -.564 .166 -.824h-5.342a3 3 0 1 1 -5.824 1.176l-.005 -.176l.005 -.176a3.002 3.002 0 0 1 1.995 -2.654v-12.17h-1a1 1 0 0 1 -.993 -.883l-.007 -.117a1 1 0 0 1 .883 -.993l.117 -.007h2zm0 16a1 1 0 1 0 0 2a1 1 0 0 0 0 -2zm11 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2z" /></svg>
                            <p>Compras</p>
                        </Link>
                    </div>
                    <div className='item'>
                        <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.SHOPPING}`} title="Payments" className="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="icon_sidebar text-brand-400 bg-none mr-3 flex-shrink-0 h-5 w-5"><path fill-rule="evenodd" d="M6.912 3a3 3 0 00-2.868 2.118l-2.411 7.838a3 3 0 00-.133.882V18a3 3 0 003 3h15a3 3 0 003-3v-4.162c0-.299-.045-.596-.133-.882l-2.412-7.838A3 3 0 0017.088 3H6.912zm13.823 9.75l-2.213-7.191A1.5 1.5 0 0017.088 4.5H6.912a1.5 1.5 0 00-1.434 1.059L3.265 12.75H6.11a3 3 0 012.684 1.658l.256.513a1.5 1.5 0 001.342.829h3.218a1.5 1.5 0 001.342-.83l.256-.512a3 3 0 012.684-1.658h2.844z" clip-rule="evenodd"></path></svg>
                            <p>Caja</p>
                        </Link>
                    </div>
                    <div className='item'>
                        <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.PRODUCTION}/${PrivateRoutes.PRODUCTION_CATEGORIES}`} title="Producción" className="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 -960 960 960" fill="currentColor"><path d="M160-80q-33 0-56.5-23.5T80-160v-348q0-24 13-44t36-30l175-74q20-8 38 3t18 33v20l145-58q20-8 37.5 4t17.5 33v61h320v400q0 33-23.5 56.5T800-80H160Zm280-160h80v-160h-80v160Zm-160 0h80v-160h-80v160Zm320 0h80v-160h-80v160Zm272-380H687l29-225q2-15 13.5-25t26.5-10h49q15 0 26 10t13 25l28 225Z" /></svg>
                            <p>Producción</p>
                        </Link>
                    </div>
                    <div className='item'>
                        <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.MENUSTORE}`} title="Payments" className="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 -960 960 960" width="30" fill="currentColor"><path d="M440-91v-366L120-642v321q0 22 10.5 40t29.5 29L440-91Zm80 0 280-161q19-11 29.5-29t10.5-40v-321L520-457v366Zm159-550 118-69-277-159q-19-11-40-11t-40 11l-79 45 318 183ZM480-526l119-68-317-184-120 69 318 183Z" /></svg>
                            <p>Almacén </p>
                        </Link>
                    </div>
                    <div className='item'>
                        <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.MENUCATALOGOS}`} title="Payments" className="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 -960 960 960" width="30" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h207q16 0 30.5 6t25.5 17l57 57h360q17 0 28.5 11.5T880-680q0 17-11.5 28.5T840-640H314q-62 0-108 39t-46 99v262l79-263q8-26 29.5-41.5T316-560h516q41 0 64.5 32.5T909-457l-72 240q-8 26-29.5 41.5T760-160H160Z" /></svg>
                            <p>Catalogo</p>
                        </Link>
                    </div>
                    <div className='item'>
                        <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.SHOPPING}`} title="Payments" className="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-clipboard-text"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M17.997 4.17a3 3 0 0 1 2.003 2.83v12a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 2.003 -2.83a4 4 0 0 0 3.997 3.83h4a4 4 0 0 0 3.98 -3.597zm-2.997 10.83h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m0 -4h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m-1 -9a2 2 0 1 1 0 4h-4a2 2 0 1 1 0 -4z" /></svg>
                            <p>Reportes</p>
                        </Link>

                    </div>
                    <div className='item'>
                        <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.SHOPPING}`} title="Payments" className="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 -960 960 960" width="30" fill="currentColor"><path d="M480-520q150 0 255-47t105-113q0-66-105-113t-255-47q-150 0-255 47T120-680q0 66 105 113t255 47Zm0 100q41 0 102.5-8.5T701-456q57-19 98-49.5t41-74.5v100q0 44-41 74.5T701-356q-57 19-118.5 27.5T480-320q-41 0-102.5-8.5T259-356q-57-19-98-49.5T120-480v-100q0 44 41 74.5t98 49.5q57 19 118.5 27.5T480-420Zm0 200q41 0 102.5-8.5T701-256q57-19 98-49.5t41-74.5v100q0 44-41 74.5T701-156q-57 19-118.5 27.5T480-120q-41 0-102.5-8.5T259-156q-57-19-98-49.5T120-280v-100q0 44 41 74.5t98 49.5q57 19 118.5 27.5T480-220Z" /></svg>
                            <p>Ingresos</p>
                        </Link>
                    </div>
                    <div className='item'>
                        <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.SHOPPING}`} title="Payments" className="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" /><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" /></svg>
                            <p>usuarios</p>
                        </Link>
                    </div>
                    <div className='item'>
                        <Link to={`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.MENUSETTINGS}`} title="Payments" className="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 -960 960 960" width="30" fill="currentColor"><path d="M222-540q-12-5-22.5-10.5T178-564l-29 9q-13 4-25.5-1T104-572l-8-14q-7-12-5-26t13-23l22-19q-2-13-2-26t2-26l-22-19q-11-9-13-22.5t5-25.5l9-15q7-11 19-16t25-1l29 9q11-8 21.5-13.5T222-820l6-29q3-14 13.5-22.5T266-880h16q14 0 24.5 9t13.5 23l6 28q12 5 22.5 10.5T370-796l29-9q13-4 25.5 1t19.5 16l8 14q7 12 5 26t-13 23l-22 19q2 13 2 26t-2 26l22 19q11 9 13 22.5t-5 25.5l-9 15q-7 11-19 16t-25 1l-29-9q-11 8-21.5 13.5T326-540l-6 29q-3 14-13.5 22.5T282-480h-16q-14 0-24.5-9T228-512l-6-28Zm52-60q33 0 56.5-23.5T354-680q0-33-23.5-56.5T274-760q-33 0-56.5 23.5T194-680q0 33 23.5 56.5T274-600Zm300 476q-17-6-31.5-14.5T514-158l-38 12q-18 6-36-.5T412-170l-11-19q-10-17-7-36.5t18-32.5l30-26q-2-18-2-36t2-36l-30-27q-15-13-18-32t7-36l11-19q10-17 28-23.5t36-.5l38 12q14-11 28.5-19.5T574-516l9-41q4-19 18.5-31t34.5-12h24q20 0 34.5 12t18.5 31l9 41q17 6 31.5 14.5T782-482l38-12q18-6 36 .5t28 23.5l11 19q10 17 7 36.5T884-382l-30 26q2 18 2 36t-2 36l30 27q15 13 18 32t-7 36l-11 19q-10 17-28 23.5t-36 .5l-38-12q-14 11-28.5 19.5T722-124l-9 41q-4 19-18.5 31T660-40h-24q-20 0-34.5-12T583-83l-9-41Zm74-76q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Z" /></svg>
                            <p>Configuraciones</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OptionsMenu
