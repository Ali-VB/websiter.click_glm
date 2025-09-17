import { cn } from '../utils';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      // Arrange
      const inputs = ['class1', 'class2', 'class3'];
      
      // Act
      const result = cn(...inputs);
      
      // Assert
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle empty inputs', () => {
      // Arrange
      const inputs: string[] = [];
      
      // Act
      const result = cn(...inputs);
      
      // Assert
      expect(result).toBe('');
    });

    it('should handle undefined and null inputs', () => {
      // Arrange
      const inputs = ['class1', undefined, null, 'class2'] as (string | undefined | null)[];
      
      // Act
      const result = cn(...inputs);
      
      // Assert
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional class names with clsx', () => {
      // Arrange
      const condition = true;
      const inputs = [
        'base-class',
        condition && 'conditional-class',
        !condition && 'not-included-class',
      ];
      
      // Act
      const result = cn(...inputs);
      
      // Assert
      expect(result).toBe('base-class conditional-class');
    });

    it('should handle object inputs with clsx', () => {
      // Arrange
      const inputs = [
        'base-class',
        {
          'active-class': true,
          'inactive-class': false,
        },
      ];
      
      // Act
      const result = cn(...inputs);
      
      // Assert
      expect(result).toBe('base-class active-class');
    });

    it('should handle duplicate class names with tailwind-merge', () => {
      // Arrange
      const inputs = ['p-4', 'p-2'];
      
      // Act
      const result = cn(...inputs);
      
      // Assert
      expect(result).toBe('p-2'); // tailwind-merge should resolve conflicts
    });

    it('should handle complex tailwind class conflicts', () => {
      // Arrange
      const inputs = ['bg-red-500', 'bg-blue-500', 'text-white', 'text-black'];
      
      // Act
      const result = cn(...inputs);
      
      // Assert
      expect(result).toBe('bg-blue-500 text-black'); // tailwind-merge should resolve conflicts
    });
  });
});