import {
  formatRupees,
  formatCarbon,
  formatDistance,
  formatDuration,
  formatCalories,
  formatSteps,
  truncate,
  formatShortDate,
  formatPercent,
  sanitizeString,
  isValidAge,
  isValidDistance,
} from "./formatters";

describe("Display Formatters", () => {
  describe("formatRupees", () => {
    it("should format amounts in ₹ with Indian numbering system", () => {
      expect(formatRupees(150)).toBe("₹150");
      expect(formatRupees(120000)).toBe("₹1,20,000");
      expect(formatRupees(-5)).toBe("₹0");
    });
  });

  describe("formatCarbon", () => {
    it("should format small carbon values in grams", () => {
      expect(formatCarbon(0.045)).toBe("45 g CO₂");
    });

    it("should format larger carbon values in kg", () => {
      expect(formatCarbon(1.5)).toBe("1.50 kg CO₂");
      expect(formatCarbon(10)).toBe("10.00 kg CO₂");
    });
  });

  describe("formatDistance", () => {
    it("should format sub-km distances in meters", () => {
      expect(formatDistance(0.45)).toBe("450 m");
    });

    it("should format km distances", () => {
      expect(formatDistance(2.34)).toBe("2.3 km");
    });
  });

  describe("formatDuration", () => {
    it("should format durations under 1 hour in minutes", () => {
      expect(formatDuration(45)).toBe("45 min");
    });

    it("should format durations over 1 hour", () => {
      expect(formatDuration(90)).toBe("1 hr 30 min");
      expect(formatDuration(120)).toBe("2 hr");
    });
  });

  describe("formatCalories", () => {
    it("should format positive calories in kcal", () => {
      expect(formatCalories(120)).toBe("120 kcal");
    });

    it("should return a placeholder for zero or negative calories", () => {
      expect(formatCalories(0)).toBe("—");
      expect(formatCalories(-10)).toBe("—");
    });
  });

  describe("formatSteps", () => {
    it("should format step counts with commas", () => {
      expect(formatSteps(4200)).toBe("4,200 steps");
    });
  });

  describe("truncate", () => {
    it("should truncate long strings with ellipsis", () => {
      expect(truncate("Hello World", 8)).toBe("Hello W…");
      expect(truncate("Short", 10)).toBe("Short");
    });
  });

  describe("formatShortDate", () => {
    it("should format dates in DD-MM-YYYY or ISO format to DD Month", () => {
      expect(formatShortDate("2026-06-19")).toContain("19");
      expect(formatShortDate("invalid")).toBe("invalid");
    });
  });

  describe("formatPercent", () => {
    it("should format percentages correctly", () => {
      expect(formatPercent(50, 100)).toBe("50%");
      expect(formatPercent(2, 3)).toBe("67%");
      expect(formatPercent(0, 0)).toBe("0%");
    });
  });

  describe("sanitizeString", () => {
    it("should strip HTML and dangerous characters", () => {
      expect(sanitizeString("<script>alert('xss')</script>Hello")).toBe("alert(xss)Hello");
      expect(sanitizeString("Hello & World")).toBe("Hello  World");
    });
  });

  describe("isValidAge", () => {
    it("should validate age boundaries", () => {
      expect(isValidAge(25)).toBe(true);
      expect(isValidAge(4)).toBe(false);
      expect(isValidAge(121)).toBe(false);
      expect(isValidAge(25.5)).toBe(false);
    });
  });

  describe("isValidDistance", () => {
    it("should validate distance ranges", () => {
      expect(isValidDistance(10)).toBe(true);
      expect(isValidDistance(0)).toBe(false);
      expect(isValidDistance(501)).toBe(false);
    });
  });
});
