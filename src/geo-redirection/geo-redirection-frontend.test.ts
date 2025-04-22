/**
 * @jest-environment jsdom
 */

// Mock wp.apiFetch before importing the script
const mockApiFetch = jest.fn();
global.wp = {
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
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock window.location.href
const originalLocation = window.location;
delete (window as any).location;
window.location = { ...originalLocation, href: '' };
const locationHrefSpy = jest.spyOn(window.location, 'href', 'set');


describe('Geo Redirection Frontend Script', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockApiFetch.mockClear();
    mockSessionStorage.clear();
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.setItem.mockClear();
    locationHrefSpy.mockClear();
    // Reset window.location.href if needed, though spy handles assignment checks
    window.location.href = 'http://initial.test/';

    // Reset modules to ensure script runs fresh for each test
    jest.resetModules();
  });

  // Helper function to wait for promises to settle
  const flushPromises = () => new Promise(setImmediate);

  it('should perform redirect when API returns redirect: true', async () => {
    const redirectUrl = 'http://new.location/path';
    mockApiFetch.mockResolvedValue({ redirect: true, url: redirectUrl });

    // Require the script to execute it
    require('../geo-redirection-frontend');

    // Wait for the apiFetch promise to resolve
    await flushPromises();

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith({ path: 'maki-geo/v1/redirection' });
    expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(1);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('mgeo_redirected', '1');
    expect(locationHrefSpy).toHaveBeenCalledTimes(1);
    expect(locationHrefSpy).toHaveBeenCalledWith(redirectUrl);
  });

  it('should not redirect when API returns redirect: false', async () => {
    mockApiFetch.mockResolvedValue({ redirect: false });

    // Require the script
    require('../geo-redirection-frontend');

    // Wait for the apiFetch promise to resolve
    await flushPromises();

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith({ path: 'maki-geo/v1/redirection' });
    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    expect(locationHrefSpy).not.toHaveBeenCalled();
  });

  it('should not call API or redirect if sessionStorage flag is set', () => {
    // Set the flag *before* the script runs
    mockSessionStorage.setItem('mgeo_redirected', '1');

    // Require the script
    require('../geo-redirection-frontend');

    // No need to wait for promises here as apiFetch shouldn't be called

    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(locationHrefSpy).not.toHaveBeenCalled();
    // Check that setItem wasn't called *again*
    expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(1); // Only the initial call
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('mgeo_redirected', '1');
  });

  it('should handle API fetch error gracefully', async () => {
    const error = new Error('Network failed');
    mockApiFetch.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console output during test

    // Require the script
    require('../geo-redirection-frontend');

    // Wait for the apiFetch promise to reject
    await flushPromises();

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith({ path: 'maki-geo/v1/redirection' });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Geo redirection error:', error);
    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    expect(locationHrefSpy).not.toHaveBeenCalled();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
