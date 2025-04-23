import { runGeoRedirect } from "./geo-redirection-frontend";
/**
 * @jest-environment jsdom
 */

// Mock wp.apiFetch before importing the script
const mockApiFetch = jest.fn() as jest.Mock; // Cast to jest.Mock for type safety
window.wp = {
  apiFetch: mockApiFetch,
};

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage });

// Mock window.location.href with a setter
let currentHref = "";
const locationMock = {
  // Keep other properties if needed, or mock them as well
  ...window.location,
  // Define href with getter and setter
  get href() {
    return currentHref;
  },
  set href(url: string) {
    currentHref = url;
  },
};
Object.defineProperty(window, "location", {
  value: locationMock,
  writable: true, // Allow reassignment if necessary, though usually not needed for mocks
});
// We won't spy on the setter directly anymore.
// We will check the value of window.location.href after the script runs.

describe("Geo Redirection Frontend Script", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockApiFetch.mockClear();
    mockSessionStorage.clear();
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.setItem.mockClear();
    // Reset the internal state of our mock href
    currentHref = "http://initial.test/";
    // Ensure the window.location.href reflects the reset state
    window.location.href = currentHref;

    // Reset modules to ensure script runs fresh for each test
    jest.resetModules();
  });

  // Helper function to wait for promises to settle
  const flushPromises = () => new Promise(setImmediate);

  it("should perform redirect when API returns redirect: true", async () => {
    const redirectUrl = "http://new.location/path";
    mockApiFetch.mockResolvedValue({ redirect: true, url: redirectUrl });
    runGeoRedirect();

    // Wait for the apiFetch promise to resolve
    await flushPromises();

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith({
      path: "maki-geo/v1/redirection",
    });
    expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(1);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      "mgeo_redirected",
      "1",
    );
    // Check the final URL directly
    expect(window.location.href).toBe(redirectUrl);
  });

  it("should not redirect when API returns redirect: false", async () => {
    mockApiFetch.mockResolvedValue({ redirect: false });
    runGeoRedirect();

    // Wait for the apiFetch promise to resolve
    await flushPromises();

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith({
      path: "maki-geo/v1/redirection",
    });
    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    // Check that the URL hasn't changed
    expect(window.location.href).toBe("http://initial.test/");
  });

  it("should not call API or redirect if sessionStorage flag is set", () => {
    // Set the flag *before* the script runs
    mockSessionStorage.setItem("mgeo_redirected", "1");
    runGeoRedirect();

    // No need to wait for promises here as apiFetch shouldn't be called

    expect(mockApiFetch).not.toHaveBeenCalled();
    // Check that the URL hasn't changed
    expect(window.location.href).toBe("http://initial.test/");
    // Check that setItem wasn't called *again*
    expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(1); // Only the initial call
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      "mgeo_redirected",
      "1",
    );
  });

  it("should handle API fetch error gracefully", async () => {
    const error = new Error("Network failed");
    mockApiFetch.mockRejectedValue(error);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {}); // Suppress console output during test
    runGeoRedirect();

    // Wait for the apiFetch promise to reject
    await flushPromises();

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith({
      path: "maki-geo/v1/redirection",
    });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Geo redirection error:",
      error,
    );
    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    // Check that the URL hasn't changed
    expect(window.location.href).toBe("http://initial.test/");

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
