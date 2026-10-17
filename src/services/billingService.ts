import { PaymentMethod } from '../types';
import { formatCurrencyBRL } from '../core/utils/currencyFormatter';

export interface BillingCalculationInput {
  baseValue: number;
  discountValue?: number;
  additionalValue?: number;
  paymentMethod: PaymentMethod;
}

export interface BillingCalculationResult {
  baseValue: number;
  discountValue: number;
  additionalValue: number;
  finalValue: number;
  formattedFinalValue: string;
}

export function calculateWorkOrderTotal(input: BillingCalculationInput): BillingCalculationResult {
  const base = Math.max(0, input.baseValue || 0);
  const discount = Math.max(0, input.discountValue || 0);
  const additional = Math.max(0, input.additionalValue || 0);

  const finalVal = Math.max(0, base - discount + additional);

  return {
    baseValue: base,
    discountValue: discount,
    additionalValue: additional,
    finalValue: finalVal,
    formattedFinalValue: formatCurrencyBRL(finalVal),
  };
}
