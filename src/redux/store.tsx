// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { UserInfo } from "../models/user.model";
import userSliceReducer from "./state/user";
import modalsSliceReducer from "./state/modals";
import Sales from './state/Sales'
import Categories from './state/Categories'
import selectReducer from './state/general/Select';
import loginReducer from './state/login/Login';
import companiesReducer from './state/Configurations/Companies';
import branchReducer from './state/Configurations/Branch';
import storeReducer from './state/store/Store';
import unitsReducer from './state/catalogos/Units'
import inventoryReducer from './state/store/Inventory'

import seriesReducer from './state/Configurations/Series'
import areasReducer from './state/Configurations/Areas'
import Services from './state/Services'
import Articles from './state/Articles'

export interface AppStore {
    user: UserInfo;
    modals: string;
    categories: any;
    sales: any;
    select: any;
    login: any;
    companies: any;
    branch: any;
    store: any;
    units: any;
    inventory: any;
    series: any;
    areas: any;
    services: any;
    articles: any;
}

export default configureStore<AppStore>({
    reducer: {
        user: userSliceReducer,
        modals: modalsSliceReducer,
        select: selectReducer,
        sales: Sales,
        categories: Categories,
        login: loginReducer,
        companies: companiesReducer,
        branch: branchReducer,
        store: storeReducer,
        units: unitsReducer,
        inventory: inventoryReducer,
        series: seriesReducer,
        areas: areasReducer,
        services: Services,
        articles: Articles
    }
});
