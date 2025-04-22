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

  // --- Test cases will be added below ---

});
