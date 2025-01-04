export interface GeoRule {
  conditions: GeoCondition[];
  operator: "AND" | "OR";
  action: "show" | "hide";
}

export interface GeoCondition {
  type: "continent" | "country" | "region" | "city" | "ip";
  value: string;
  operator: "is" | "is not";
}

export interface GlobalRule extends GeoRule {
  id: string;
  name: string;
}

export interface BlockAttributes {
  ruleType: "local" | "global";
  localRule: GeoRule | null;
  globalRuleId: string | null;
}

declare global {
  interface Window {
    geoUtilsData?: {
      globalRules: GlobalRule[];
    };
  }
}
