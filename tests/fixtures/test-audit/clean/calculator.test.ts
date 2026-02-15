import { Calculator } from '../../../src/calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add', () => {
    it('should add two positive numbers', () => {
      const result = calculator.add(2, 3);
      expect(result).toBe(5);
    });

    it('should handle negative numbers', () => {
      const result = calculator.add(-2, 3);
      expect(result).toBe(1);
    });

    it('should handle zero', () => {
      const result = calculator.add(0, 5);
      expect(result).toBe(5);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      const result = calculator.divide(10, 2);
      expect(result).toBe(5);
    });

    it('should throw on division by zero', () => {
      expect(() => calculator.divide(10, 0)).toThrow('Division by zero');
    });
  });
});
