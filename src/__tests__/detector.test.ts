import mockFs from 'mock-fs';
import { detectPackageManager, getAllDetectedPackageManagers, isPackageManagerInstalled } from '../detector';
import { PackageManager } from '../types';
import execa from 'execa';

// Mock execa
jest.mock('execa');

describe('Package Manager Detector', () => {
  afterEach(() => {
    mockFs.restore();
    jest.clearAllMocks();
  });

  describe('detectPackageManager', () => {
    test('should detect pnpm when pnpm-lock.yaml exists', async () => {
      mockFs({
        'pnpm-lock.yaml': 'content',
        'package.json': '{}'
      });

      const result = await detectPackageManager();
      expect(result).toBe('pnpm');
    });

    test('should detect yarn when yarn.lock exists', async () => {
      mockFs({
        'yarn.lock': 'content',
        'package.json': '{}'
      });

      const result = await detectPackageManager();
      expect(result).toBe('yarn');
    });

    test('should detect npm when package-lock.json exists', async () => {
      mockFs({
        'package-lock.json': '{}',
        'package.json': '{}'
      });

      const result = await detectPackageManager();
      expect(result).toBe('npm');
    });

    test('should detect bun when bun.lockb exists', async () => {
      mockFs({
        'bun.lockb': Buffer.from([0]),
        'package.json': '{}'
      });

      const result = await detectPackageManager();
      expect(result).toBe('bun');
    });

    test('should throw NoLockfileError when no lockfile exists', async () => {
      mockFs({
        'package.json': '{}'
      });

      await expect(detectPackageManager()).rejects.toThrow();
    });
  });

  describe('getAllDetectedPackageManagers', () => {
    test('should return all detected package managers in priority order', async () => {
      mockFs({
        'pnpm-lock.yaml': 'content',
        'yarn.lock': 'content',
        'package-lock.json': '{}',
        'package.json': '{}'
      });

      const result = await getAllDetectedPackageManagers();
      expect(result).toEqual(['pnpm', 'bun', 'yarn', 'npm']);
    });

    test('should return empty array when no lockfiles exist', async () => {
      mockFs({
        'package.json': '{}'
      });

      const result = await getAllDetectedPackageManagers();
      expect(result).toEqual([]);
    });
  });

  describe('isPackageManagerInstalled', () => {
    test('should return true when package manager is installed', async () => {
      // Use a simpler approach with type assertion
      jest.mocked(execa).mockResolvedValue({ exitCode: 0 } as any);
      
      const result = await isPackageManagerInstalled('pnpm');
      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('pnpm', ['--version'], { stdio: 'ignore' });
    });

    test('should return false when package manager is not installed', async () => {
      jest.mocked(execa).mockRejectedValue(new Error('Command not found'));
      
      const result = await isPackageManagerInstalled('pnpm');
      expect(result).toBe(false);
      expect(execa).toHaveBeenCalledWith('pnpm', ['--version'], { stdio: 'ignore' });
    });
  });
});
