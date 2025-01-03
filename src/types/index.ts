export interface GeoRule {
  conditions: GeoCondition[];
  operator: "AND" | "OR";
  action: "show" | "hide";
}

export interface GeoCondition {
  type: "country" | "city" | "continent";
  value: string;
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
