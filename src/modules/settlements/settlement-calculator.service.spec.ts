import { SettlementCalculatorService } from './settlement-calculator.service';

describe('SettlementCalculatorService', () => {
  let calculator: SettlementCalculatorService;

  beforeEach(() => {
    calculator = new SettlementCalculatorService();
  });

  const assertSumEqualsRevenue = (
    songRevenue: number,
    result: ReturnType<SettlementCalculatorService['calculate']>,
  ) => {
    expect(result.creatorPool + result.cmo + result.platform).toBe(songRevenue);
    expect(result.totalAllocated).toBe(songRevenue);
  };

  describe('Largest Remainder Method', () => {
    it('allocates 1 KRW', () => {
      const result = calculator.calculate(1);

      expect(result).toEqual({
        creatorPool: 0,
        cmo: 0,
        platform: 1,
        totalAllocated: 1,
      });
      assertSumEqualsRevenue(1, result);
    });

    it('allocates 2 KRW', () => {
      const result = calculator.calculate(2);

      expect(result).toEqual({
        creatorPool: 1,
        cmo: 0,
        platform: 1,
        totalAllocated: 2,
      });
      assertSumEqualsRevenue(2, result);
    });

    it('allocates 3 KRW', () => {
      const result = calculator.calculate(3);

      expect(result).toEqual({
        creatorPool: 1,
        cmo: 1,
        platform: 1,
        totalAllocated: 3,
      });
      assertSumEqualsRevenue(3, result);
    });

    it('allocates 100 KRW with no remainder', () => {
      const result = calculator.calculate(100);

      expect(result).toEqual({
        creatorPool: 40,
        cmo: 15,
        platform: 45,
        totalAllocated: 100,
      });
      assertSumEqualsRevenue(100, result);
    });

    it('allocates 101 KRW — remainder goes to highest fractional share', () => {
      const result = calculator.calculate(101);

      expect(result).toEqual({
        creatorPool: 40,
        cmo: 15,
        platform: 46,
        totalAllocated: 101,
      });
      assertSumEqualsRevenue(101, result);
    });

    it('allocates 999 KRW', () => {
      const result = calculator.calculate(999);

      expect(result).toEqual({
        creatorPool: 400,
        cmo: 150,
        platform: 449,
        totalAllocated: 999,
      });
      assertSumEqualsRevenue(999, result);
    });

    it('allocates 100000 KRW with no remainder', () => {
      const result = calculator.calculate(100_000);

      expect(result).toEqual({
        creatorPool: 40_000,
        cmo: 15_000,
        platform: 45_000,
        totalAllocated: 100_000,
      });
      assertSumEqualsRevenue(100_000, result);
    });
  });

  describe('guarantees', () => {
    it('sum of allocations always equals original revenue across a range', () => {
      for (let revenue = 0; revenue <= 500; revenue++) {
        const result = calculator.calculate(revenue);
        assertSumEqualsRevenue(revenue, result);
      }
    });

    it('produces identical results on repeated calls (deterministic)', () => {
      const first = calculator.calculate(101);
      const second = calculator.calculate(101);

      expect(first).toEqual(second);
    });

    it('uses integer-only arithmetic — no floating-point in output', () => {
      const result = calculator.calculate(101);

      expect(Number.isInteger(result.creatorPool)).toBe(true);
      expect(Number.isInteger(result.cmo)).toBe(true);
      expect(Number.isInteger(result.platform)).toBe(true);
      expect(Number.isInteger(result.totalAllocated)).toBe(true);
    });
  });

  describe('validation', () => {
    it('rejects negative revenue', () => {
      expect(() => calculator.calculate(-1)).toThrow(
        'songRevenue must be a non-negative integer',
      );
    });

    it('rejects non-integer revenue', () => {
      expect(() => calculator.calculate(10.5)).toThrow(
        'songRevenue must be a non-negative integer',
      );
    });

    it('accepts zero revenue', () => {
      const result = calculator.calculate(0);

      expect(result).toEqual({
        creatorPool: 0,
        cmo: 0,
        platform: 0,
        totalAllocated: 0,
      });
    });
  });
});
