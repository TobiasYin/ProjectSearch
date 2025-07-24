// Jest setup file for the project

// Mock Raycast API
jest.mock('@raycast/api', () => ({
  ActionPanel: {
    Section: ({ children }: any) => children,
  },
  List: {
    Item: ({ title, subtitle, actions }: any) => ({ title, subtitle, actions }),
  },
  Action: {
    CopyToClipboard: ({ content }: any) => ({ content }),
    ShowInFinder: ({ path }: any) => ({ path }),
  },
  environment: {
    assetsPath: '/mock/assets/path',
  },
  closeMainWindow: jest.fn(),
  getPreferenceValues: () => ({
    projectBasePath: '/mock/projects',
    level: 5,
    showFullPath: false,
  }),
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// Mock open
jest.mock('open', () => jest.fn());

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// 添加空导出使其成为模块
export {};