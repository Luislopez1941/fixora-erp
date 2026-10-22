/** Nombre y signo de cada tipo de movimiento del kardex (StockMovementType). */
export const MOVEMENT_LABEL: Record<string, string> = {
  OPENING: 'Saldo inicial',
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  SALE: 'Venta',
  SALE_RETURN: 'Devolución',
  TRANSFER_IN: 'Traspaso recibido',
  TRANSFER_OUT: 'Traspaso enviado',
  ADJUSTMENT: 'Ajuste',
  REVERSAL: 'Reversa',
  PRODUCTION_CONSUMPTION: 'Consumo de producción',
  PRODUCTION_OUTPUT: 'Producto terminado',
}
