import { GeoRuleBase, GlobalGeoRule } from "../types";

interface LocationData {
  continent: string;
  country: string;
  region: string;
  city: string;
  ip: string;
}

declare global {
  interface Window {
    geoUtilsSettings?: {
      globalRules: GlobalGeoRule[];
    };
    wp: {
      apiFetch: (options: { path: string }) => Promise<LocationData>;
    };
  }
}

async function initGeoTargeting(): Promise<void> {
  try {
    const response = await window.wp.apiFetch({
      path: "geoutils/v1/location",
    });
    console.log(`API response: ${JSON.stringify(response)}`);

    const blocks = document.querySelectorAll<HTMLElement>(
      ".gu-geo-target-block, .geo-popup-overlay"
    );
    const globalRules = window.geoUtilsSettings?.globalRules || [];

    blocks.forEach((block) => {
      console.log(`Block: ${JSON.stringify(block.dataset)}`);
      const ruleType = block.dataset.ruleType;
      let rule: GeoRuleBase | null = null;

      if (ruleType === "local") {
        rule = JSON.parse(block.dataset.localRule || "null");
      } else if (ruleType === "global") {
        const globalRuleId = block.dataset.globalRuleId;
        rule = globalRules.find((r) => r.id === globalRuleId) || null;
      }

      const shouldShow = rule ? evaluateGeoRules([rule], response) : true;
      block.style.display = shouldShow ? "block" : "none";
    });
  } catch (error) {
    console.error("Geo targeting error:", error);
    // Show all blocks on error
    document
      .querySelectorAll<HTMLElement>(".gu-geo-target-block")
      .forEach((block) => (block.style.display = "block"));
  }
}

function evaluateGeoRules(
  rules: GeoRuleBase[],
  locationData: LocationData
): boolean {
  console.log(`Rules: ${JSON.stringify(rules)}`);
  console.log(`Location data: ${JSON.stringify(locationData)}`);

  if (!rules.length) return true;
}

document.addEventListener("DOMContentLoaded", initGeoTargeting);
