export class Cache {
  private data: Record<string, string> = {};
  
  get(key: string): string | undefined {
    return this.data[key];
  }
  
  set(key: string, value: string): void {
    this.data[key] = value;
  }
}

export const ActionPanel = {
  Section: ({ children }: any) => children,
};

export const List = {
  Item: ({ title, subtitle, actions }: any) => ({ title, subtitle, actions }),
};

export const Action = {
  CopyToClipboard: ({ content }: any) => ({ content }),
  ShowInFinder: ({ path }: any) => ({ path }),
};

export const environment = {
  assetsPath: '/mock/assets/path',
};

export const closeMainWindow = jest.fn();
export const getPreferenceValues = jest.fn(() => ({
  projectBasePath: '/mock/projects',
  level: 5,
  showFullPath: false,
}));