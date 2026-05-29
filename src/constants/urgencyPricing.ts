export const URGENCY_SURCHARGE_PERCENT: Record<string, number> = {
  LOW: 0,
  NORMAL: 0,
  HIGH: 0.15,
  URGENT: 0.3,
};

export const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Baja', percent: 0 },
  { value: 'NORMAL', label: 'Normal', percent: 0 },
  { value: 'HIGH', label: 'Alta', percent: 0.15 },
  { value: 'URGENT', label: 'Urgente', percent: 0.3 },
] as const;

export const getUrgencySurchargePercent = (urgency?: string | null) =>
  URGENCY_SURCHARGE_PERCENT[urgency ?? 'NORMAL'] ?? 0;

export const getUrgencySurchargeLabel = (urgency?: string | null) => {
  const percent = getUrgencySurchargePercent(urgency);
  return percent > 0 ? `+${Math.round(percent * 100)}%` : 'Sin cargo extra';
};

export const calculateSaleTotals = (
  subtotal: number,
  discount: number,
  urgency?: string | null,
  ivaRate = 0.16,
) => {
  const roundMoney = (value: number) =>
    Math.round((value + Number.EPSILON) * 100) / 100

  const discountValue = Math.max(0, discount || 0)
  const baseAfterDiscount = Math.max(0, subtotal - discountValue)
  const urgencyPercent = getUrgencySurchargePercent(urgency)
  const urgencySurcharge = roundMoney(baseAfterDiscount * urgencyPercent)
  const taxable = roundMoney(baseAfterDiscount + urgencySurcharge)
  const iva = roundMoney(taxable * ivaRate)
  const total = roundMoney(taxable + iva)

  return {
    subtotal: roundMoney(subtotal),
    discountValue: roundMoney(discountValue),
    baseAfterDiscount: roundMoney(baseAfterDiscount),
    urgencyPercent,
    urgencySurcharge,
    taxable,
    iva,
    total,
  }
}
