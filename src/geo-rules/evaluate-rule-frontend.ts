import { GeoRuleBase, GlobalGeoRule, LocationData } from "../types/types";

declare global {
  interface Window {
    makiGeoData?: {
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
      path: "maki-geo/v1/location",
    });
    console.log(`API response: ${JSON.stringify(response)}`);

    const blocksClass = "mgeo-geo-target-block";

    const blocks = document.querySelectorAll<HTMLElement>(
      `.${blocksClass}`
    );
    const globalRules = window.makiGeoData?.globalRules || [];

    blocks.forEach((block) => {
      const ruleType = block.dataset.ruletype;
      let rule: GeoRuleBase | null = null;

      if (ruleType === "local") {
        rule = JSON.parse(block.dataset.rule || "null");
      } else if (ruleType === "global") {
        const globalRuleId = JSON.parse(block.dataset.rule || "null");
        rule = globalRules.find((r) => r.id === globalRuleId) || null;
      }

      const shouldShow = rule ? evaluateGeoRule(rule, response) : true;


      if (shouldShow) {
        block.style.display = 'block';
      } else {
        block.style.display = 'none';
      }
    });
  } catch (error) {
    console.error("Geo targeting error:", error);
  }
}

/**
 * Evaluates the given rule and location and returns if the content that is governed by this rule should be shown for this location.
 * 
 * @param rule The geo rule to evaluate
 * @param locationData The location to evaluate and see if it fits the geo rule
 * @returns Boolean value indicating if the content should be shown (true) or hidden (false)
 */
export function evaluateGeoRule(
  rule: GeoRuleBase,
  locationData: LocationData
): boolean {
  // console.log(`Rules: ${JSON.stringify(rule)}`);
  // console.log(`Location data: ${JSON.stringify(locationData)}`);

  // Apply rule action if there are no conditions
  if (!rule.conditions.length) {
    return rule.action === "show";
  }

  // Evaluate each condition within the rule
  const conditionResults = rule.conditions.map((condition) => {
    const locationValue = locationData[condition.type].toLowerCase();
    const conditionValue = condition.value.toLowerCase();

    if (condition.operator === "is") {
      if (condition.type === "country") {
        const locationCountryCode = locationData.country_code.toLowerCase();
        return locationValue === conditionValue || locationCountryCode === conditionValue;
      }
      return locationValue === conditionValue;
    } else {
      // "is not"
      if (condition.type === "country") {
        const locationCountryCode = locationData.country_code.toLowerCase();
        return locationValue !== conditionValue && locationCountryCode !== conditionValue;
      }
      return locationValue !== conditionValue;
    }
  });

  // Combine conditions based on operator
  let ruleResult: boolean;
  if (rule.operator === "AND") {
    ruleResult = conditionResults.every((result) => result);
  } else {
    // "OR"
    ruleResult = conditionResults.some((result) => result);
  }

  // Apply rule action
  if (ruleResult) {
    return rule.action === "show";
  }

  // If no rules match, do the opposite
  return rule.action === "hide";
}

document.addEventListener("DOMContentLoaded", initGeoTargeting);
