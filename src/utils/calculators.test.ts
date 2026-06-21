import {
  calculateEmissions,
  calculateCarbonSaved,
  calculateCalories,
  calculateCost,
  calculateMoneySaved,
  estimateDuration,
  scoreToEcoHealthLevel,
  calculateLevelFromXp,
  co2ToTrees,
  getLowestCarbonMode,
  getRecommendedAction,
} from "./calculators";

describe("Carbon & Health Calculators", () => {
  describe("calculateEmissions", () => {
    it("should return 0 emissions for walking and cycling", () => {
      expect(calculateEmissions("walking", 10)).toBe(0);
      expect(calculateEmissions("bicycle", 15)).toBe(0);
    });

    it("should calculate correct emissions for car", () => {
      // car emissions factor: 0.185 kg/km
      expect(calculateEmissions("car", 10)).toBe(1.85);
      expect(calculateEmissions("car", 2.5)).toBe(0.463);
    });

    it("should calculate correct emissions for metro", () => {
      // metro emissions factor: 0.015 kg/km
      expect(calculateEmissions("metro", 10)).toBe(0.15);
    });
  });

  describe("calculateCarbonSaved", () => {
    it("should return correct carbon saved vs car", () => {
      // car = 1.85kg, walking = 0kg, saved = 1.85kg
      expect(calculateCarbonSaved("walking", 10)).toBe(1.85);
      // car = 1.85kg, metro = 0.15kg, saved = 1.70kg
      expect(calculateCarbonSaved("metro", 10)).toBe(1.7);
      // car vs car saved = 0kg
      expect(calculateCarbonSaved("car", 10)).toBe(0);
    });
  });

  describe("calculateCalories", () => {
    it("should calculate calories for active travel", () => {
      // walking: 60 kcal/km
      expect(calculateCalories("walking", 5)).toBe(300);
      // cycling: 40 kcal/km
      expect(calculateCalories("bicycle", 10)).toBe(400);
    });

    it("should return 0 calories for motorized travel", () => {
      expect(calculateCalories("car", 10)).toBe(0);
      expect(calculateCalories("metro", 15)).toBe(0);
    });
  });

  describe("calculateCost", () => {
    it("should calculate cost for walking and cycling as 0", () => {
      expect(calculateCost("walking", 10)).toBe(0);
      expect(calculateCost("bicycle", 5)).toBe(0);
    });

    it("should calculate correct cost for car (₹12/km, flat ₹0)", () => {
      expect(calculateCost("car", 10)).toBe(120);
    });

    it("should calculate correct cost for metro (flat ₹30, ₹2/km)", () => {
      // 30 + 2 * 10 = 50
      expect(calculateCost("metro", 10)).toBe(50);
    });
  });

  describe("calculateMoneySaved", () => {
    it("should calculate correct money saved vs car", () => {
      // car cost = ₹120, walking cost = ₹0, saved = ₹120
      expect(calculateMoneySaved("walking", 10)).toBe(120);
      // car cost = ₹120, metro cost = ₹50, saved = ₹70
      expect(calculateMoneySaved("metro", 10)).toBe(70);
    });
  });

  describe("estimateDuration", () => {
    it("should estimate correct duration based on average speeds", () => {
      // walking speed: 4.5 km/h -> 10km = 2.22 hours = 133 mins
      expect(estimateDuration("walking", 4.5)).toBe(60);
      // car speed: 25 km/h -> 25km = 1 hour = 60 mins
      expect(estimateDuration("car", 25)).toBe(60);
    });
  });

  describe("scoreToEcoHealthLevel", () => {
    it("should map scores to correct levels", () => {
      expect(scoreToEcoHealthLevel(95)).toBe("Transit Champion");
      expect(scoreToEcoHealthLevel(80)).toBe("Carbon Saver");
      expect(scoreToEcoHealthLevel(65)).toBe("Sustainable Traveler");
      expect(scoreToEcoHealthLevel(50)).toBe("Green Explorer");
      expect(scoreToEcoHealthLevel(20)).toBe("Smart Commuter");
    });
  });

  describe("calculateLevelFromXp", () => {
    it("should calculate correct level and remaining XP", () => {
      // Level 1: 0 - 199 XP (200 req)
      // Level 2: 200 - 599 XP (400 req)
      // Total totalXp = 80 XP -> Level 1, remaining 80, next level 200
      expect(calculateLevelFromXp(80)).toEqual({
        level: 1,
        remainingXp: 80,
        xpToNext: 200,
      });

      // totalXp = 250 XP -> Level 2, remaining 50, next level 400
      expect(calculateLevelFromXp(250)).toEqual({
        level: 2,
        remainingXp: 50,
        xpToNext: 400,
      });
    });
  });

  describe("co2ToTrees", () => {
    it("should calculate tree equivalent of saved CO2", () => {
      // 1 tree = 1.75 kg/month
      expect(co2ToTrees(3.5)).toBe(2);
      expect(co2ToTrees(1.5)).toBe(0);
    });
  });

  describe("getLowestCarbonMode", () => {
    it("should find the lowest carbon mode", () => {
      const modes: any[] = ["car", "metro", "bus"];
      expect(getLowestCarbonMode(modes, 10)).toBe("metro");
    });
  });

  describe("getRecommendedAction", () => {
    it("should recommend transit if carbon emitted today is high", () => {
      const stats = {
        carbonToday: 3.5,
        stepsToday: 5000,
        ecohealthScore: 80,
        commutePreference: "mixed",
      };
      const recommendation = getRecommendedAction(stats);
      expect(recommendation.action).toContain("Metro or Bus");
      expect(recommendation.icon).toBe("transit");
    });

    it("should recommend walking if steps today are low", () => {
      const stats = {
        carbonToday: 0.5,
        stepsToday: 1500,
        ecohealthScore: 80,
        commutePreference: "mixed",
      };
      const recommendation = getRecommendedAction(stats);
      expect(recommendation.action).toContain("Walk");
      expect(recommendation.icon).toBe("walk");
    });

    it("should recommend logging green commute if ecohealth score is low", () => {
      const stats = {
        carbonToday: 0.5,
        stepsToday: 4000,
        ecohealthScore: 45,
        commutePreference: "mixed",
      };
      const recommendation = getRecommendedAction(stats);
      expect(recommendation.action).toContain("Log a green commute");
      expect(recommendation.icon).toBe("score");
    });
  });
});
