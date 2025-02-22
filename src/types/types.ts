export interface GeoRuleBase {
  conditions: GeoCondition[];
  operator: "AND" | "OR";
  action: "show" | "hide";
}

export interface GeoCondition {
  type: "continent" | "country" | "region" | "city" | "ip";
  value: string;
  operator: "is" | "is not";
}

export interface GlobalGeoRule extends GeoRuleBase {
  id: string;
  name: string;
  ruleType: "global";
}

export interface LocalGeoRule extends GeoRuleBase {
  ruleType: "local";
}

export type GeoRule = GlobalGeoRule | LocalGeoRule;

export interface BlockAttributes {
  ruleType: "local" | "global";
  localRule: LocalGeoRule | null;
  globalRuleId: string | null;
}

export interface LocationData {
  continent: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  ip: string;
  language?: string;
}

declare global {
  interface Window {
    makiGeoData?: {
      globalRules: GlobalGeoRule[];
      nonce: string;
      settings: AdminSettings;
    };
  }
}
