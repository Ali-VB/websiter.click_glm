/**
 * Tax calculation utilities for invoices
 */

// Tax rates by province (as decimal values, e.g., 0.13 for 13%)
export const TAX_RATES = {
  // Canadian provinces and territories
  AB: 0.05, // Alberta - GST only
  BC: 0.12, // British Columbia - GST + PST
  MB: 0.12, // Manitoba - GST + RST
  NB: 0.15, // New Brunswick - HST
  NL: 0.15, // Newfoundland and Labrador - HST
  NT: 0.05, // Northwest Territories - GST only
  NS: 0.15, // Nova Scotia - HST
  NU: 0.05, // Nunavut - GST only
  ON: 0.13, // Ontario - HST
  PE: 0.15, // Prince Edward Island - HST
  QC: 0.14975, // Quebec - GST + QST
  SK: 0.11, // Saskatchewan - GST + PST
  YT: 0.05, // Yukon - GST only
  
  // Default tax rate for unknown provinces
  DEFAULT: 0.13, // Default to Ontario HST
};

// Tax type descriptions
export const TAX_TYPE_DESCRIPTIONS = {
  AB: { type: 'GST', rate: 0.05 },
  BC: { type: 'GST + PST', rate: 0.12 },
  MB: { type: 'GST + RST', rate: 0.12 },
  NB: { type: 'HST', rate: 0.15 },
  NL: { type: 'HST', rate: 0.15 },
  NT: { type: 'GST', rate: 0.05 },
  NS: { type: 'HST', rate: 0.15 },
  NU: { type: 'GST', rate: 0.05 },
  ON: { type: 'HST', rate: 0.13 },
  PE: { type: 'HST', rate: 0.15 },
  QC: { type: 'GST + QST', rate: 0.14975 },
  SK: { type: 'GST + PST', rate: 0.11 },
  YT: { type: 'GST', rate: 0.05 },
  DEFAULT: { type: 'HST', rate: 0.13 },
};

/**
 * Calculate tax amount based on subtotal and province code
 * @param subtotal The subtotal amount before tax
 * @param provinceCode The province code (e.g., 'ON', 'BC', etc.)
 * @returns Object containing tax amount and tax details
 */
export function calculateTax(subtotal: number, provinceCode: string = 'DEFAULT') {
  // Get the tax rate for the province, defaulting to the default rate
  const taxRate = TAX_RATES[provinceCode as keyof typeof TAX_RATES] || TAX_RATES.DEFAULT;
  const taxType = TAX_TYPE_DESCRIPTIONS[provinceCode as keyof typeof TAX_TYPE_DESCRIPTIONS] || TAX_TYPE_DESCRIPTIONS.DEFAULT;
  
  // Calculate tax amount (round to nearest cent)
  const taxAmount = Math.round(subtotal * taxRate);
  
  // Calculate total amount
  const totalAmount = subtotal + taxAmount;
  
  // Create tax details object
  const taxDetails = {
    provinceCode,
    taxType: taxType.type,
    taxRate: taxType.rate,
    subtotal,
    taxAmount,
    totalAmount,
  };
  
  return {
    taxAmount,
    taxDetails,
    totalAmount,
  };
}

/**
 * Format a number as currency in CAD
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount / 100); // Convert cents to dollars
}

/**
 * Convert a decimal amount to cents for storage
 * @param amount The amount in dollars
 * @returns Amount in cents
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert cents to decimal amount for display
 * @param cents The amount in cents
 * @returns Amount in dollars
 */
export function fromCents(cents: number): number {
  return cents / 100;
}