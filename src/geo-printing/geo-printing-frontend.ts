import { LocationData } from "../types/types";

async function initGeoPrinting(): Promise<void> {
  const placeholders = document.querySelectorAll<HTMLElement>(
    "span[data-mgeo-print='true']",
  );

  if (placeholders.length === 0) {
    return; // No placeholders found
  }

  try {
    const locationData = await window.wp.apiFetch({
      path: "maki-geo/v1/location",
    });

    if (!locationData) {
      console.warn("Maki Geo: Could not fetch location data.");
      // Optionally display default values if API fails
      placeholders.forEach((placeholder) => {
        const defaultValue = placeholder.dataset.mgeoDefault || "";
        placeholder.textContent = defaultValue;
        placeholder.style.visibility = "visible"; // Make visible after attempting update
      });
      return;
    }

    placeholders.forEach((placeholder) => {
      const field = placeholder.dataset.mgeoField as keyof LocationData | "flag";
      const defaultValue = placeholder.dataset.mgeoDefault || "";
      let outputValue = defaultValue;

      if (field === "flag") {
        const countryCode = locationData.country_code?.toLowerCase();
        const countryName = locationData.country || "Unknown";
        const size = placeholder.dataset.mgeoSize || "24px";
        const pluginUrl = window.makiGeoPrintingData?.pluginUrl || "";

        if (countryCode && countryCode !== "unknown" && pluginUrl) {
          const flagUrl = `${pluginUrl}src/assets/flags/${countryCode}.svg`;
          const img = document.createElement("img");
          img.src = flagUrl;
          img.alt = `${countryName} flag`;
          img.className = "mgeo-country-flag";
          img.style.width = size;
          img.style.height = "auto";
          // Replace placeholder content with the image
          placeholder.innerHTML = "";
          placeholder.appendChild(img);
          outputValue = ""; // Clear text content if flag is shown
        } else {
          placeholder.textContent = ""; // No flag, no default text for flags unless specified
        }
      } else if (
        field &&
        locationData[field] &&
        locationData[field] !== "Unknown"
      ) {
        outputValue = locationData[field];
        placeholder.textContent = outputValue;
      } else {
        placeholder.textContent = defaultValue;
      }

      // Make the element visible after processing
      placeholder.style.visibility = "visible";
    });
  } catch (error) {
    console.error("Maki Geo printing error:", error);
    // Display default values on error
    placeholders.forEach((placeholder) => {
      const defaultValue = placeholder.dataset.mgeoDefault || "";
      placeholder.textContent = defaultValue;
      placeholder.style.visibility = "visible"; // Make visible after error
    });
  }
}

// Use DOMContentLoaded to ensure elements are available
if (
  document.readyState === "interactive" ||
  document.readyState === "complete"
) {
  initGeoPrinting();
} else {
  document.addEventListener("DOMContentLoaded", initGeoPrinting);
}
