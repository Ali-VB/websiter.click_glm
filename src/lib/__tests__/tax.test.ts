import { calculateTax, formatCurrency, toCents, fromCents, TAX_RATES, TAX_TYPE_DESCRIPTIONS } from '../tax';

describe('Tax Utilities', () => {
  describe('calculateTax', () => {
    it('should calculate tax correctly for Ontario', () => {
      // Arrange
      const subtotal = 10000; // $100.00 in cents
      const provinceCode = 'ON';

      // Act
      const result = calculateTax(subtotal, provinceCode);

      // Assert
      expect(result.taxAmount).toBe(1300); // 13% of $100.00
      expect(result.totalAmount).toBe(11300); // $100.00 + $13.00
      expect(result.taxDetails).toEqual({
        provinceCode: 'ON',
        taxType: 'HST',
        taxRate: 0.13,
        subtotal: 10000,
        taxAmount: 1300,
        totalAmount: 11300,
      });
    });

    it('should calculate tax correctly for Alberta', () => {
      // Arrange
      const subtotal = 10000; // $100.00 in cents
      const provinceCode = 'AB';

      // Act
      const result = calculateTax(subtotal, provinceCode);

      // Assert
      expect(result.taxAmount).toBe(500); // 5% of $100.00
      expect(result.totalAmount).toBe(10500); // $100.00 + $5.00
      expect(result.taxDetails).toEqual({
        provinceCode: 'AB',
        taxType: 'GST',
        taxRate: 0.05,
        subtotal: 10000,
        taxAmount: 500,
        totalAmount: 10500,
      });
    });

    it('should calculate tax correctly for Quebec', () => {
      // Arrange
      const subtotal = 10000; // $100.00 in cents
      const provinceCode = 'QC';

      // Act
      const result = calculateTax(subtotal, provinceCode);

      // Assert
      expect(result.taxAmount).toBe(1498); // 14.975% of $100.00, rounded to nearest cent
      expect(result.totalAmount).toBe(11498); // $100.00 + $14.98
      expect(result.taxDetails).toEqual({
        provinceCode: 'QC',
        taxType: 'GST + QST',
        taxRate: 0.14975,
        subtotal: 10000,
        taxAmount: 1498,
        totalAmount: 11498,
      });
    });

    it('should use default tax rate for unknown province', () => {
      // Arrange
      const subtotal = 10000; // $100.00 in cents
      const provinceCode = 'XX';

      // Act
      const result = calculateTax(subtotal, provinceCode);

      // Assert
      expect(result.taxAmount).toBe(1300); // Default 13% of $100.00
      expect(result.totalAmount).toBe(11300); // $100.00 + $13.00
      expect(result.taxDetails).toEqual({
        provinceCode: 'XX',
        taxType: 'HST',
        taxRate: 0.13,
        subtotal: 10000,
        taxAmount: 1300,
        totalAmount: 11300,
      });
    });

    it('should use default tax rate when no province code is provided', () => {
      // Arrange
      const subtotal = 10000; // $100.00 in cents

      // Act
      const result = calculateTax(subtotal);

      // Assert
      expect(result.taxAmount).toBe(1300); // Default 13% of $100.00
      expect(result.totalAmount).toBe(11300); // $100.00 + $13.00
      expect(result.taxDetails).toEqual({
        provinceCode: 'DEFAULT',
        taxType: 'HST',
        taxRate: 0.13,
        subtotal: 10000,
        taxAmount: 1300,
        totalAmount: 11300,
      });
    });

    it('should handle zero subtotal', () => {
      // Arrange
      const subtotal = 0;
      const provinceCode = 'ON';

      // Act
      const result = calculateTax(subtotal, provinceCode);

      // Assert
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it('should handle rounding correctly', () => {
      // Arrange
      const subtotal = 999; // $9.99 in cents
      const provinceCode = 'ON';

      // Act
      const result = calculateTax(subtotal, provinceCode);

      // Assert
      expect(result.taxAmount).toBe(130); // 13% of $9.99 = $1.2987, rounded to $1.30
      expect(result.totalAmount).toBe(1129); // $9.99 + $1.30 = $11.29
    });
  });

  describe('formatCurrency', () => {
    it('should format cents as CAD currency correctly', () => {
      // Arrange
      const amount = 10000; // $100.00 in cents

      // Act
      const result = formatCurrency(amount);

      // Assert
      expect(result).toBe('$100.00');
    });

    it('should format zero cents correctly', () => {
      // Arrange
      const amount = 0;

      // Act
      const result = formatCurrency(amount);

      // Assert
      expect(result).toBe('$0.00');
    });

    it('should format cents with decimals correctly', () => {
      // Arrange
      const amount = 123456; // $1,234.56 in cents

      // Act
      const result = formatCurrency(amount);

      // Assert
      expect(result).toBe('$1,234.56');
    });

    it('should format cents with single digit correctly', () => {
      // Arrange
      const amount = 5; // $0.05 in cents

      // Act
      const result = formatCurrency(amount);

      // Assert
      expect(result).toBe('$0.05');
    });

    it('should format cents with rounding correctly', () => {
      // Arrange
      const amount = 999; // $9.99 in cents

      // Act
      const result = formatCurrency(amount);

      // Assert
      expect(result).toBe('$9.99');
    });
  });

  describe('toCents', () => {
    it('should convert dollars to cents correctly', () => {
      // Arrange
      const amount = 100.5; // $100.50

      // Act
      const result = toCents(amount);

      // Assert
      expect(result).toBe(10050); // $100.50 in cents
    });

    it('should convert zero dollars correctly', () => {
      // Arrange
      const amount = 0;

      // Act
      const result = toCents(amount);

      // Assert
      expect(result).toBe(0);
    });

    it('should round fractional cents correctly', () => {
      // Arrange
      const amount = 100.999; // $100.999

      // Act
      const result = toCents(amount);

      // Assert
      expect(result).toBe(10100); // Rounded to $101.00
    });

    it('should handle negative amounts correctly', () => {
      // Arrange
      const amount = -50.25;

      // Act
      const result = toCents(amount);

      // Assert
      expect(result).toBe(-5025);
    });
  });

  describe('fromCents', () => {
    it('should convert cents to dollars correctly', () => {
      // Arrange
      const cents = 10050; // $100.50 in cents

      // Act
      const result = fromCents(cents);

      // Assert
      expect(result).toBe(100.5);
    });

    it('should convert zero cents correctly', () => {
      // Arrange
      const cents = 0;

      // Act
      const result = fromCents(cents);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle fractional cents correctly', () => {
      // Arrange
      const cents = 1; // 1 cent

      // Act
      const result = fromCents(cents);

      // Assert
      expect(result).toBe(0.01);
    });

    it('should handle negative cents correctly', () => {
      // Arrange
      const cents = -5025; // -$50.25 in cents

      // Act
      const result = fromCents(cents);

      // Assert
      expect(result).toBe(-50.25);
    });
  });

  describe('TAX_RATES and TAX_TYPE_DESCRIPTIONS', () => {
    it('should have consistent tax rates between TAX_RATES and TAX_TYPE_DESCRIPTIONS', () => {
      // Act & Assert
      Object.keys(TAX_RATES).forEach(provinceCode => {
        if (provinceCode !== 'DEFAULT') {
          expect(TAX_RATES[provinceCode as keyof typeof TAX_RATES]).toBe(
            TAX_TYPE_DESCRIPTIONS[provinceCode as keyof typeof TAX_TYPE_DESCRIPTIONS].rate
          );
        }
      });
    });

    it('should have a default tax rate in both objects', () => {
      // Assert
      expect(TAX_RATES.DEFAULT).toBeDefined();
      expect(TAX_TYPE_DESCRIPTIONS.DEFAULT).toBeDefined();
      expect(TAX_RATES.DEFAULT).toBe(TAX_TYPE_DESCRIPTIONS.DEFAULT.rate);
    });

    it('should have all provinces in both objects', () => {
      // Act & Assert
      Object.keys(TAX_RATES).forEach(provinceCode => {
        expect(TAX_TYPE_DESCRIPTIONS).toHaveProperty(provinceCode);
      });

      Object.keys(TAX_TYPE_DESCRIPTIONS).forEach(provinceCode => {
        expect(TAX_RATES).toHaveProperty(provinceCode);
      });
    });
  });
});