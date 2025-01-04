import { evaluateGeoRule } from "../geo-content";
import { GeoRuleBase, LocationData } from "../../types";

describe("evaluateGeoRules", () => {
  const mockLocationData: LocationData = {
    continent: "North America",
    country: "United States",
    region: "California",
    city: "San Francisco",
    ip: "192.168.1.1",
  };

  it("should return the action when no conditions are present", () => {
    const rule: GeoRuleBase = {
      conditions: [],
      operator: "AND",
      action: "show",
    };
    expect(evaluateGeoRule(rule, mockLocationData)).toBe(true);
    const rule2: GeoRuleBase = {
      conditions: [],
      operator: "AND",
      action: "hide",
    };
    expect(evaluateGeoRule(rule2, mockLocationData)).toBe(false);
  });

  it('should evaluate a single "is" condition correctly', () => {
    const rule: GeoRuleBase = {
      conditions: [{ type: "country", operator: "is", value: "United States" }],
      operator: "AND",
      action: "show",
    };
    expect(evaluateGeoRule(rule, mockLocationData)).toBe(true);
  });

  it('should evaluate a single "is not" condition correctly', () => {
    const rule: GeoRuleBase = {
      conditions: [{ type: "country", operator: "is not", value: "Canada" }],
      operator: "AND",
      action: "show",
    };
    expect(evaluateGeoRule(rule, mockLocationData)).toBe(true);
  });

  it("should handle multiple conditions with AND operator", () => {
    const rule: GeoRuleBase = {
      conditions: [
        { type: "country", operator: "is", value: "United States" },
        { type: "region", operator: "is", value: "California" },
      ],
      operator: "AND",
      action: "show",
    };
    expect(evaluateGeoRule(rule, mockLocationData)).toBe(true);
  });

  it("should handle multiple conditions with OR operator", () => {
    const rule: GeoRuleBase = {
      conditions: [
        { type: "country", operator: "is", value: "Canada" },
        { type: "region", operator: "is", value: "California" },
      ],
      operator: "OR",
      action: "show",
    };
    expect(evaluateGeoRule(rule, mockLocationData)).toBe(true);
  });

  it("should handle hide action correctly", () => {
    const rule: GeoRuleBase = {
      conditions: [{ type: "country", operator: "is", value: "United States" }],
      operator: "AND",
      action: "hide",
    };
    expect(evaluateGeoRule(rule, mockLocationData)).toBe(false);
  });

  it("should handle case-insensitive comparisons", () => {
    const rule: GeoRuleBase = {
      conditions: [
        { type: "country", operator: "is", value: "UNITED STATES" },
        { type: "city", operator: "is", value: "san francisco" },
      ],
      operator: "AND",
      action: "show",
    };
    expect(evaluateGeoRule(rule, mockLocationData)).toBe(true);
  });

  it("should handle complex AND/OR combinations", () => {
    const rule: GeoRuleBase = {
      conditions: [
        { type: "country", operator: "is", value: "United States" },
        { type: "region", operator: "is not", value: "Texas" },
        { type: "city", operator: "is", value: "San Francisco" },
      ],
      operator: "AND",
      action: "show",
    };
    expect(evaluateGeoRule(rule, mockLocationData)).toBe(true);

    const rule2: GeoRuleBase = {
      conditions: [
        { type: "country", operator: "is", value: "Canada" },
        { type: "region", operator: "is", value: "California" },
        { type: "city", operator: "is", value: "Vancouver" },
      ],
      operator: "OR",
      action: "show",
    };
    expect(evaluateGeoRule(rule2, mockLocationData)).toBe(true);
  });

  it("should handle IP address conditions", () => {
    const rule: GeoRuleBase = {
      conditions: [{ type: "ip", operator: "is", value: "192.168.1.1" }],
      operator: "AND",
      action: "show",
    };
    expect(evaluateGeoRule(rule, mockLocationData)).toBe(true);

    const rule2: GeoRuleBase = {
      conditions: [{ type: "ip", operator: "is not", value: "10.0.0.1" }],
      operator: "AND",
      action: "show",
    };
    expect(evaluateGeoRule(rule2, mockLocationData)).toBe(true);
  });

  it("should handle opposite actions when conditions are not met", () => {
    const rule: GeoRuleBase = {
      conditions: [{ type: "country", operator: "is", value: "Canada" }],
      operator: "AND",
      action: "show",
    };
    expect(evaluateGeoRule(rule, mockLocationData)).toBe(false);

    const rule2: GeoRuleBase = {
      conditions: [{ type: "country", operator: "is", value: "Canada" }],
      operator: "AND",
      action: "hide",
    };
    expect(evaluateGeoRule(rule2, mockLocationData)).toBe(true);
  });
});
