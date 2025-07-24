// 在导入之前设置全局 mock
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
  getPreferenceValues: jest.fn(() => ({
    projectBasePath: '/mock/projects',
    level: 5,
    showFullPath: false,
  })),
  Cache: class MockCache {
    private data: Record<string, string> = {};
    
    get(key: string): string | undefined {
      return this.data[key];
    }
    
    set(key: string, value: string): void {
      this.data[key] = value;
    }
  }
}));

import { search } from './index';
import { realSearch, queryProcess } from './util';
import { exec } from 'child_process';

// Mock 其他依赖
jest.mock('./util');
jest.mock('child_process');

const mockedRealSearch = realSearch as jest.MockedFunction<typeof realSearch>;
const mockedQueryProcess = queryProcess as jest.MockedFunction<typeof queryProcess>;
const mockedExec = exec as jest.MockedFunction<typeof exec>;

describe('search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该处理搜索文本并调用 realSearch', () => {
    const mockText = 'test search';
    const mockProcessedText = 'test,search';
     mockedQueryProcess.mockReturnValue(mockProcessedText);
    mockedExec.mockImplementation((command: string, callback: any) => {
      callback(null, 'mock/output', '');
      return {} as any;
    });

    search(mockText);

    expect(mockedQueryProcess).toHaveBeenCalledWith(mockText);
    expect(mockedRealSearch).toHaveBeenCalledWith(
      mockProcessedText,
      expect.any(Function), // createElement 函数
      expect.any(Function)  // 回调函数
    );
  });

  it('应该正确处理 Python 脚本的输出', () => {
    const mockCreateElement = jest.fn();
    const mockText = 'test search';
    const mockProcessedText = 'test,search';
    const mockOutput = 'mock/output/path';
    
    mockedQueryProcess.mockReturnValue(mockProcessedText);
    mockedExec.mockImplementation((command: string, callback: any) => {
      callback(null, mockOutput, '');
      return {} as any;
    });

    search(mockText);

    // 验证 realSearch 的第三个参数（回调函数）被正确调用
    const execCallback = mockedRealSearch.mock.calls[0][2];
    const mockResHandler = jest.fn();
    
    execCallback(mockResHandler);
    
    expect(mockedExec).toHaveBeenCalledWith(
      expect.stringContaining('python3'),
      expect.any(Function)
    );
    expect(mockResHandler).toHaveBeenCalledWith(mockOutput);
  });

  it('应该处理执行错误', () => {
    const mockText = 'test search';
    const mockProcessedText = 'test,search';
    const mockError = new Error('Command failed');
    
    mockedQueryProcess.mockReturnValue(mockProcessedText);
    mockedExec.mockImplementation((command: string, callback: any) => {
      callback(mockError, '', 'mock error');
      return {} as any;
    });

    search(mockText);

    const execCallback = mockedRealSearch.mock.calls[0][2];
    const mockResHandler = jest.fn();
    
    execCallback(mockResHandler);
    
    // 即使出错，也应该调用 reshandler，但输出为空字符串
    expect(mockResHandler).toHaveBeenCalledWith('');
  });

  it('应该正确处理包含括号的文本', () => {
    const mockText = 'test (search) with (parentheses)';
    const expectedProcessedText = 'test,(search),with,(parentheses)';
    
    // 使用实际的 queryProcess 函数来测试
    mockedQueryProcess.mockImplementation((text: string) => {
      return text.split(' ').filter((t) => !!t).join(',');
    });
    mockedExec.mockImplementation((command: string, callback: any) => {
      // 验证命令是否正确转义了特殊字符
      expect(command).toContain('"test,(search),with,(parentheses)"');
      expect(command).toMatch(/python3.*".*lsall.py.*".*".*test,\(search\),with,\(parentheses\).*"/);
      callback(null, 'mock/output/with/parentheses', '');
      return {} as any;
    });

    search(mockText);

    expect(mockedQueryProcess).toHaveBeenCalledWith(mockText);
    expect(mockedRealSearch).toHaveBeenCalledWith(
      expectedProcessedText,
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('应该正确处理特殊字符', () => {
    const mockText = 'project (test) [brackets] {braces}';
    const expectedProcessedText = 'project,(test),[brackets],{braces}';
    
    mockedQueryProcess.mockImplementation((text: string) => {
      return text.split(' ').filter((t) => !!t).join(',');
    });
    mockedExec.mockImplementation((command: string, callback: any) => {
      expect(command).toContain('"project,(test),[brackets],{braces}"');
      expect(command).toMatch(/python3.*".*lsall.py.*".*".*project,\(test\),\[brackets\],\{braces\}.*"/);
      callback(null, 'mock/output/special/chars', '');
      return {} as any;
    });

    search(mockText);

    expect(mockedQueryProcess).toHaveBeenCalledWith(mockText);
  });
});