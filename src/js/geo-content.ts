import { GeoRuleBase, GlobalGeoRule, LocationData } from "../types";

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

    const blocksClass = "gu-geo-target-block";
    const popupsClass = "geo-popup-overlay";

    const blocks = document.querySelectorAll<HTMLElement>(
      `.${blocksClass}, .${popupsClass}`
    );
    const globalRules = window.geoUtilsSettings?.globalRules || [];

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

      if (block.classList.contains(popupsClass)) {
        // For popups, store the evaluation result and mark as ready
        block.dataset.geoAllowed = shouldShow.toString();
        block.dataset.geoReady = "true";
        // Dispatch event to notify popup handler
        block.dispatchEvent(new CustomEvent('geoRuleEvaluated'));
      } else {
        // For regular blocks, set display directly
        block.style.display = shouldShow ? "block" : "none";
      }
    });
  } catch (error) {
    console.error("Geo targeting error:", error);
  }
}

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
      return locationValue === conditionValue;
    } else {
      // "is not"
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
