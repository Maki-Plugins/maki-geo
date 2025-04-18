import { GeoRule, LocationData } from "../types/types";

async function initGeoTargeting(): Promise<void> {
  try {
    const blocksClass = "mgeo-geo-target-block";
    const blocks = document.querySelectorAll<HTMLElement>(`.${blocksClass}`);

    if (blocks.length > 0) {
      const response = await window.wp.apiFetch({
        path: "maki-geo/v1/location",
      });
      // console.log(`API response: ${JSON.stringify(response)}`);

      blocks.forEach((block) => {
        let rule: GeoRule | null = null;
        rule = JSON.parse(block.dataset.rule || "null");

        const shouldShow = rule ? evaluateGeoContent(rule, response) : true;

        if (shouldShow) {
          block.style.display = "block";
        } else {
          block.style.display = "none";
        }
      });
    }
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
export function evaluateGeoContent(
  rule: GeoRule,
  locationData: LocationData,
): boolean {
  // console.log(`Rules: ${JSON.stringify(rule)}`);
  // console.log(`Location data: ${JSON.stringify(locationData)}`);

  // Evaluate each condition within the rule
  let ruleResult: boolean = evaluateGeoConditions(
    rule.conditions,
    rule.operator,
    locationData,
  );

  // Apply rule action
  if (ruleResult) {
    return rule.action === "show";
  }
  // If no rules match, do the opposite
  return rule.action === "hide";
}

function evaluateGeoConditions(
  conditions: GeoRule["conditions"],
  operator: GeoRule["operator"],
  locationData: LocationData,
): boolean {
  // Apply rule action if there are no conditions
  if (!conditions.length) {
    return true;
  }

  const conditionResults = conditions.map((condition) => {
    const locationValue = locationData[condition.type].toLowerCase();
    const conditionValue = condition.value.toLowerCase();

    if (condition.operator === "is") {
      if (condition.type === "country") {
        const locationCountryCode = locationData.country_code.toLowerCase();
        return (
          locationValue === conditionValue ||
          locationCountryCode === conditionValue
        );
      }
      return locationValue === conditionValue;
    } else {
      // "is not"
      if (condition.type === "country") {
        const locationCountryCode = locationData.country_code.toLowerCase();
        return (
          locationValue !== conditionValue &&
          locationCountryCode !== conditionValue
        );
      }
      return locationValue !== conditionValue;
    }
  });

  // Combine conditions based on operator
  let ruleResult: boolean;
  if (operator === "AND") {
    ruleResult = conditionResults.every((result) => result);
  } else {
    // "OR"
    ruleResult = conditionResults.some((result) => result);
  }

  return ruleResult;
}

document.addEventListener("DOMContentLoaded", initGeoTargeting);
