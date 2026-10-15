import React from "react";
import { Route, Routes} from "react-router-dom";
import { PrivateRoutes } from "../../../models/routes";
import Inventory from "../../../components/sidebar/sections/store/Inventories/Inventory";
import Store from "../../../components/sidebar/sections/store/store/Store";
import StockOut from "../../../components/sidebar/sections/store/store/StockOut";
import WarehouseTransfer from "../../../components/sidebar/sections/store/store/WarehouseTransfer";
import Tickets from "../../../components/sidebar/sections/store/tickets/Tickets";
import Orders from "../../../components/sidebar/sections/store/orders/Orders";

const RouteStore: React.FC = () => {
  return (
    <Routes>
      <Route path={'/'} element={<Store />} />
      <Route path={`/${PrivateRoutes.INVENTORY}`} element={<Inventory />} />
      <Route path={`/${PrivateRoutes.DEPARTURES}`} element={<StockOut />} />
      <Route path={`/${PrivateRoutes.TRANSFERS}`} element={<WarehouseTransfer />} />
      <Route path={`/${PrivateRoutes.TICKETS}`} element={<Tickets />} />
      <Route path={`/${PrivateRoutes.ORDERS}`} element={<Orders />} />
    </Routes>
  );
};

export default RouteStore;