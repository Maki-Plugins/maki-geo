// frontend.js
async function initGeoTargeting() {
  try {
    const response = await wp.apiFetch({
      path: "geoutils/v1/location",
    });
    console.log(`API response: ${JSON.stringify(response)}`);

    const blocks = document.querySelectorAll(".gu-geo-target-block");
    blocks.forEach((block) => {
      const rules = JSON.parse(block.dataset.rules);
      const shouldShow = evaluateGeoRules(rules, response.country);
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

function evaluateGeoRules(rules, userCountry) {
  console.log(`Rules: ${JSON.stringify(rules)}`);
  console.log(`Country: ${userCountry}`);
  if (!rules.length) return true;

  const matchingRule = rules.find(
    (rule) => rule.country.toLowerCase() === userCountry.toLowerCase()
  );

  console.log(`Show?: ${matchingRule ? matchingRule.action === "show" : true}`);

  return matchingRule ? matchingRule.action === "show" : true;
}

document.addEventListener("DOMContentLoaded", initGeoTargeting);
