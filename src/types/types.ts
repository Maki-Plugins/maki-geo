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
