/**
 * @jest-environment jsdom
 */

import { LocationData } from "../types/types";

// Mock the API fetch function. The global type is defined in src/types/types.ts
// Ensure window.wp is defined for the test environment
if (!window.wp) {
  window.wp = {
    apiFetch: jest.fn(),
  };
} else {
  window.wp.apiFetch = jest.fn();
};

// Mock makiGeoPrintingData
window.makiGeoPrintingData = {
  pluginUrl: "http://localhost/wp-content/plugins/maki-geo/",
import { initGeoPrinting } from "./geo-printing-frontend";

describe("Geo Printing Frontend Script", () => {
  const mockLocationData: LocationData = {
    continent: "North America",
    country: "United States",
    country_code: "US",
    region: "California",
    city: "San Francisco",
    ip: "192.168.1.1",
  };

  // Access the mock, ensuring window.wp exists
  const mockApiFetch = window.wp?.apiFetch;

  beforeEach(() => {
    // Ensure mockApiFetch is defined before using mock methods
    if (!mockApiFetch) {
      throw new Error("window.wp.apiFetch mock is not defined");
    }
    // Reset mocks before each test
    mockApiFetch.mockClear();
    // Set default successful API response
    mockApiFetch.mockResolvedValue(mockLocationData);
    // Reset DOM state
    document.body.innerHTML = "";
  });

  test("should update text placeholders with fetched data", async () => {
    document.body.innerHTML = `
      <span data-mgeo-print="true" data-mgeo-field="country" data-mgeo-default="Fallback" style="visibility: hidden;">Fallback</span>
      <span data-mgeo-print="true" data-mgeo-field="city" style="visibility: hidden;"></span>
    `;

    await initGeoPrinting();

    const countrySpan = document.querySelector(
      "[data-mgeo-field='country']",
    ) as HTMLElement;
    const citySpan = document.querySelector(
      "[data-mgeo-field='city']",
    ) as HTMLElement;

    expect(window.wp?.apiFetch).toHaveBeenCalledWith({
      path: "maki-geo/v1/location",
    });
    expect(countrySpan.textContent).toBe("United States");
    expect(countrySpan.style.visibility).toBe("visible");
    expect(citySpan.textContent).toBe("San Francisco");
    expect(citySpan.style.visibility).toBe("visible");
  });

  test("should update flag placeholders with fetched data", async () => {
    document.body.innerHTML = `
      <span data-mgeo-print="true" data-mgeo-field="flag" data-mgeo-size="32px" style="visibility: hidden;"></span>
    `;

    await initGeoPrinting();

    const flagSpan = document.querySelector(
      "[data-mgeo-field='flag']",
    ) as HTMLElement;
    const img = flagSpan.querySelector("img");

    expect(img).not.toBeNull();
    expect(img?.src).toBe(
      "http://localhost/wp-content/plugins/maki-geo/src/assets/flags/us.svg",
    );
    expect(img?.alt).toBe("United States flag");
    expect(img?.style.width).toBe("32px");
    expect(flagSpan.style.visibility).toBe("visible");
  });

  test("should use default values if API data is missing or 'Unknown'", async () => {
    const partialLocationData: Partial<LocationData> = {
      continent: "North America",
      country: "United States",
      country_code: "US",
      region: "Unknown", // Missing region
      // city is missing
    };
    // Use mock methods directly, ensuring mockApiFetch is defined
    if (mockApiFetch) {
      mockApiFetch.mockResolvedValue(partialLocationData);
    }

    document.body.innerHTML = `
      <span data-mgeo-print="true" data-mgeo-field="region" data-mgeo-default="Default Region" style="visibility: hidden;"></span>
      <span data-mgeo-print="true" data-mgeo-field="city" data-mgeo-default="Default City" style="visibility: hidden;"></span>
    `;

    await initGeoPrinting();

    const regionSpan = document.querySelector(
      "[data-mgeo-field='region']",
    ) as HTMLElement;
    const citySpan = document.querySelector(
      "[data-mgeo-field='city']",
    ) as HTMLElement;

    expect(regionSpan.textContent).toBe("Default Region");
    expect(regionSpan.style.visibility).toBe("visible");
    expect(citySpan.textContent).toBe("Default City");
    expect(citySpan.style.visibility).toBe("visible");
  });

  test("should handle API fetch failure gracefully", async () => {
    // Use mock methods directly, ensuring mockApiFetch is defined
    if (mockApiFetch) {
      mockApiFetch.mockRejectedValue(new Error("API Error"));
    }
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {}); // Suppress console error

    document.body.innerHTML = `
      <span data-mgeo-print="true" data-mgeo-field="country" data-mgeo-default="Fallback" style="visibility: hidden;"></span>
      <span data-mgeo-print="true" data-mgeo-field="flag" data-mgeo-size="20px" style="visibility: hidden;"></span>
    `;

    await initGeoPrinting();

    const countrySpan = document.querySelector(
      "[data-mgeo-field='country']",
    ) as HTMLElement;
    const flagSpan = document.querySelector(
      "[data-mgeo-field='flag']",
    ) as HTMLElement;

    expect(countrySpan.textContent).toBe("Fallback");
    expect(countrySpan.style.visibility).toBe("visible");
    expect(flagSpan.innerHTML).toBe(""); // No flag image, empty content
    expect(flagSpan.style.visibility).toBe("visible");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Maki Geo printing error:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  test("should handle null API response gracefully", async () => {
    // Use mock methods directly, ensuring mockApiFetch is defined
    if (mockApiFetch) {
      mockApiFetch.mockResolvedValue(null);
    }
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {}); // Suppress console warning

    document.body.innerHTML = `
      <span data-mgeo-print="true" data-mgeo-field="country" data-mgeo-default="Fallback" style="visibility: hidden;"></span>
    `;

    await initGeoPrinting();

    const countrySpan = document.querySelector(
      "[data-mgeo-field='country']",
    ) as HTMLElement;

    expect(countrySpan.textContent).toBe("Fallback");
    expect(countrySpan.style.visibility).toBe("visible");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Maki Geo: Could not fetch location data.",
    );

    consoleWarnSpy.mockRestore();
  });

  test("should not fetch API if no placeholders are found", async () => {
    document.body.innerHTML = `<div>No placeholders here</div>`;

    await initGeoPrinting();

    expect(window.wp?.apiFetch).not.toHaveBeenCalled();
  });

  test("should handle missing pluginUrl gracefully for flags", async () => {
    window.makiGeoPrintingData = undefined; // Simulate missing data

    document.body.innerHTML = `
      <span data-mgeo-print="true" data-mgeo-field="flag" data-mgeo-size="24px" style="visibility: hidden;"></span>
    `;

    await initGeoPrinting();

    const flagSpan = document.querySelector(
      "[data-mgeo-field='flag']",
    ) as HTMLElement;

    expect(flagSpan.innerHTML).toBe(""); // No image should be added
    expect(flagSpan.style.visibility).toBe("visible");

    // Restore for other tests
    window.makiGeoPrintingData = {
      pluginUrl: "http://localhost/wp-content/plugins/maki-geo/",
    };
  });

  test("should handle unknown country code for flags", async () => {
    const unknownCountryData: LocationData = {
      ...mockLocationData,
      country_code: "unknown",
    };
    // Use mock methods directly, ensuring mockApiFetch is defined
    if (mockApiFetch) {
      mockApiFetch.mockResolvedValue(unknownCountryData);
    }

    document.body.innerHTML = `
      <span data-mgeo-print="true" data-mgeo-field="flag" data-mgeo-size="24px" style="visibility: hidden;"></span>
    `;

    await initGeoPrinting();

    const flagSpan = document.querySelector(
      "[data-mgeo-field='flag']",
    ) as HTMLElement;

    expect(flagSpan.innerHTML).toBe(""); // No image should be added
    expect(flagSpan.style.visibility).toBe("visible");
  });
});
