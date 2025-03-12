import { executeCommand, COMMON_COMMANDS } from '../command-proxy';
import execa from 'execa';

// Mock execa
jest.mock('execa');

describe('Command Proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Use a simpler approach with type assertion
    jest.mocked(execa).mockResolvedValue({ exitCode: 0 } as any);
  });

  describe('executeCommand', () => {
    test('should execute install command with correct package manager', async () => {
      await executeCommand('pnpm', 'install', []);
      expect(execa).toHaveBeenCalledWith('pnpm', ['install'], { stdio: 'inherit' });
    });

    test('should execute add command with arguments', async () => {
      await executeCommand('yarn', 'add', ['react', '--dev']);
      expect(execa).toHaveBeenCalledWith('yarn', ['add', 'react', '--dev'], { stdio: 'inherit' });
    });

    test('should execute run command with arguments', async () => {
      await executeCommand('npm', 'run', ['build', '--', '--watch']);
      expect(execa).toHaveBeenCalledWith('npm', ['run', 'build', '--', '--watch'], { stdio: 'inherit' });
    });

    test('should execute custom command', async () => {
      await executeCommand('bun', 'update', ['--force']);
      expect(execa).toHaveBeenCalledWith('bun', ['update', '--force'], { stdio: 'inherit' });
    });

    test('should throw error when command fails', async () => {
      const error = new Error('Command failed');
      jest.mocked(execa).mockRejectedValue(error);
      
      await expect(executeCommand('npm', 'install', [])).rejects.toThrow();
    });
  });

  test('COMMON_COMMANDS should include essential package manager commands', () => {
    expect(COMMON_COMMANDS).toContain('install');
    expect(COMMON_COMMANDS).toContain('add');
    expect(COMMON_COMMANDS).toContain('remove');
    expect(COMMON_COMMANDS).toContain('run');
    expect(COMMON_COMMANDS).toContain('update');
  });
});
