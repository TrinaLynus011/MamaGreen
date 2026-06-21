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
} from "../utils/calculators";

describe("Calculators Unit Tests", () => {
  test("emissions calculation for walking and car", () => {
    expect(calculateEmissions("walking", 5)).toBe(0);
    expect(calculateEmissions("car", 10)).toBeGreaterThan(0);
  });

  test("carbon saved vs car", () => {
    expect(calculateCarbonSaved("walking", 5)).toBeGreaterThan(0);
    expect(calculateCarbonSaved("car", 5)).toBe(0);
  });

  test("calories burned calculation", () => {
    expect(calculateCalories("walking", 5)).toBeGreaterThan(0);
    expect(calculateCalories("car", 5)).toBe(0);
  });

  test("cost and money saved vs car", () => {
    const walkingCost = calculateCost("walking", 5);
    const carCost = calculateCost("car", 5);
    expect(walkingCost).toBe(0);
    expect(carCost).toBeGreaterThan(0);
    expect(calculateMoneySaved("walking", 5)).toBe(carCost);
  });

  test("estimate duration", () => {
    expect(estimateDuration("walking", 5)).toBeGreaterThan(0);
  });

  test("score to ecohealth level translation", () => {
    expect(scoreToEcoHealthLevel(95)).toBe("Transit Champion");
    expect(scoreToEcoHealthLevel(25)).toBe("Smart Commuter");
  });

  test("calculate level from total xp", () => {
    const levelStats = calculateLevelFromXp(250);
    expect(levelStats.level).toBeGreaterThanOrEqual(1);
  });

  test("co2 to trees equivalent", () => {
    expect(co2ToTrees(40)).toBeGreaterThanOrEqual(0);
  });
});
