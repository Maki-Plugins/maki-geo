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

  // Evaluate each rule
  for (const rule of rules) {
    // Evaluate each condition within the rule
    const conditionResults = rule.conditions.map(condition => {
      const locationValue = locationData[condition.type].toLowerCase();
      const conditionValue = condition.value.toLowerCase();
      
      if (condition.operator === "is") {
        return locationValue === conditionValue;
      } else { // "is not"
        return locationValue !== conditionValue;
      }
    });

    // Combine conditions based on operator
    let ruleResult: boolean;
    if (rule.operator === "AND") {
      ruleResult = conditionResults.every(result => result);
    } else { // "OR"
      ruleResult = conditionResults.some(result => result);
    }

    // Apply rule action
    if (ruleResult) {
      return rule.action === "show";
    }
  }

  // If no rules match, show by default
  return true;
}

document.addEventListener("DOMContentLoaded", initGeoTargeting);
