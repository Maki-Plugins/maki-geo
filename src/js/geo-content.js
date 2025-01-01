// frontend.js
async function initGeoTargeting() {
  try {
    const response = await wp.apiFetch({
      path: "geoutils/v1/location",
    });
    console.log(`API response: ${JSON.stringify(response)}`);

    const blocks = document.querySelectorAll(".gu-geo-target-block");
    blocks.forEach((block) => {
      const localRules = JSON.parse(block.dataset.localRules || '[]');
      const globalRuleIds = JSON.parse(block.dataset.globalRuleIds || '[]');
      const globalRules = window.geoUtilsSettings?.globalRules || [];
      
      const rules = [
        ...localRules,
        ...globalRules.filter(rule => globalRuleIds.includes(rule.id))
      ];
      const shouldShow = evaluateGeoRules(rules, response);
      block.style.display = shouldShow ? "block" : "none";
    });
  } catch (error) {
    console.error("Geo targeting error:", error);
    // Show all blocks on error
    document
      .querySelectorAll(".gu-geo-target-block")
      .forEach((block) => (block.style.display = "block"));
  }
}

function evaluateGeoRules(rules, locationData) {
  console.log(`Rules: ${JSON.stringify(rules)}`);
  console.log(`Location data: ${JSON.stringify(locationData)}`);
  
  if (!rules.length) return true;

  // Find first matching rule
  const matchingRule = rules.find(rule => {
    // Evaluate all conditions based on the operator (AND/OR)
    const results = rule.conditions.map(condition => {
      switch (condition.type) {
        case 'country':
          return condition.value.toLowerCase() === locationData.country.toLowerCase();
        case 'city':
          return condition.value.toLowerCase() === locationData.city.toLowerCase();
        case 'continent':
          return condition.value.toLowerCase() === locationData.continent.toLowerCase();
        default:
          return false;
      }
    });

    return rule.operator === 'OR' 
      ? results.some(result => result) // OR: any condition true
      : results.every(result => result); // AND: all conditions true
  });

  console.log(`Matching rule: ${JSON.stringify(matchingRule)}`);
  return matchingRule ? matchingRule.action === "show" : true;
}

document.addEventListener("DOMContentLoaded", initGeoTargeting);
