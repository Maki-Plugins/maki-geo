import { AdminSettings } from "./admin-types";

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
  geoRule: GeoRule;
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

// Define the structure for wp.apiFetch, including Jest mock properties
// Use Promise<any> for broader compatibility across different endpoints.
type WpApiFetch = ((options: { path: string }) => Promise<any>) & jest.Mock;

declare global {
  interface Window {
    // Define wp object, making it optional as it might not exist initially
    wp?: {
      apiFetch: WpApiFetch;
    };
    // Central definition for makiGeoData used in admin and blocks
    makiGeoData?: {
      nonce: string;
      settings: AdminSettings;
      redirections?: Redirection[]; // Added from RedirectionTab usage
      globalRules?: GeoRule[]; // Added from admin.php usage
    };
    // Central definition for makiGeoPrintingData used in geo-printing frontend
    makiGeoPrintingData?: {
      pluginUrl: string;
      endpoint?: string; // Added from index.php localization
      nonce?: string;    // Added from index.php localization
    };
  }
}
