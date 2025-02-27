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

export interface Redirection {
  id: string;
  isEnabled: boolean;
  name: string;
  locations: RedirectionLocation[];
}

export type PageTargetingType = "all" | "specific";
export type ExclusionType =
  | "url_equals"
  | "url_contains"
  | "query_contains"
  | "hash_contains";

export interface RedirectionLocation {
  id: string;
  conditions: GeoCondition[];
  operator: "AND" | "OR";
  pageTargetingType: PageTargetingType;
  redirectUrl: string;
  redirectMappings: RedirectMapping[];
  exclusions: PageExclusion[];
  passPath: boolean;
  passQuery: boolean;
}

export interface RedirectMapping {
  id: string;
  fromUrl: string;
  toUrl: string;
}

export interface PageExclusion {
  id: string;
  value: string;
  type: ExclusionType;
}

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
