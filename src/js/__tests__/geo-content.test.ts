import { evaluateGeoRules } from '../geo-content';
import { GeoRuleBase, LocationData } from '../../types';

describe('evaluateGeoRules', () => {
  const mockLocationData: LocationData = {
    continent: 'North America',
    country: 'United States',
    region: 'California',
    city: 'San Francisco',
    ip: '192.168.1.1'
  };

  it('should return true when no conditions are present', () => {
    const rule: GeoRuleBase = {
      conditions: [],
      operator: 'AND',
      action: 'show'
    };
    expect(evaluateGeoRules(rule, mockLocationData)).toBe(true);
  });

  it('should evaluate a single "is" condition correctly', () => {
    const rule: GeoRuleBase = {
      conditions: [
        { type: 'country', operator: 'is', value: 'United States' }
      ],
      operator: 'AND',
      action: 'show'
    };
    expect(evaluateGeoRules(rule, mockLocationData)).toBe(true);
  });

  it('should evaluate a single "is not" condition correctly', () => {
    const rule: GeoRuleBase = {
      conditions: [
        { type: 'country', operator: 'is not', value: 'Canada' }
      ],
      operator: 'AND',
      action: 'show'
    };
    expect(evaluateGeoRules(rule, mockLocationData)).toBe(true);
  });

  it('should handle multiple conditions with AND operator', () => {
    const rule: GeoRuleBase = {
      conditions: [
        { type: 'country', operator: 'is', value: 'United States' },
        { type: 'region', operator: 'is', value: 'California' }
      ],
      operator: 'AND',
      action: 'show'
    };
    expect(evaluateGeoRules(rule, mockLocationData)).toBe(true);
  });

  it('should handle multiple conditions with OR operator', () => {
    const rule: GeoRuleBase = {
      conditions: [
        { type: 'country', operator: 'is', value: 'Canada' },
        { type: 'region', operator: 'is', value: 'California' }
      ],
      operator: 'OR',
      action: 'show'
    };
    expect(evaluateGeoRules(rule, mockLocationData)).toBe(true);
  });

  it('should handle hide action correctly', () => {
    const rule: GeoRuleBase = {
      conditions: [
        { type: 'country', operator: 'is', value: 'United States' }
      ],
      operator: 'AND',
      action: 'hide'
    };
    expect(evaluateGeoRules(rule, mockLocationData)).toBe(false);
  });
});
