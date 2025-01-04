import { GeoRuleBase, GlobalGeoRule } from "../types";

interface LocationData {
  country: string;
  city: string;
  continent: string;
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
      const ruleType = block.dataset.ruleType;
      let rule: GeoRuleBase | null = null;

      if (ruleType === "local") {
        rule = JSON.parse(block.dataset.localRule || "null");
      } else if (ruleType === "global") {
        const globalRuleId = block.dataset.globalRuleId;
        rule = globalRules.find((r) => r.id === globalRuleId) || null;
      }

      console.log(JSON.stringify(block.dataset));

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

  // Find first matching rule
  const matchingRule = rules.find((rule) => {
    // Evaluate all conditions based on the operator (AND/OR)
    const results = rule.conditions.map((condition) => {
      let matches = false;
      switch (condition.type) {
        case "country":
          matches =
            condition.value.toLowerCase() ===
            locationData.country.toLowerCase();
          break;
        case "city":
          matches =
            condition.value.toLowerCase() === locationData.city.toLowerCase();
          break;
        case "continent":
          matches =
            condition.value.toLowerCase() ===
            locationData.continent.toLowerCase();
          break;
        default:
          return false;
      }
      return condition.operator === "is" ? matches : !matches;
    });

    return rule.operator === "OR"
      ? results.some((result) => result) // OR: any condition true
      : results.every((result) => result); // AND: all conditions true
  });

  console.log(`Matching rule: ${JSON.stringify(matchingRule)}`);
  return matchingRule ? matchingRule.action === "show" : true;
}

document.addEventListener("DOMContentLoaded", initGeoTargeting);
