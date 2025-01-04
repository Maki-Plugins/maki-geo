// Mock console.log to prevent noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};
