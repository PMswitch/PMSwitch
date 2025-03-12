import fs from 'fs-extra';
import path from 'path';
import findUp from 'find-up';
import execa from 'execa';
import { PackageManager } from './types';
import { NoLockfileError } from './errors';

/**
 * Lockfile names for supported package managers
 */
export const LOCKFILES = {
  pnpm: 'pnpm-lock.yaml',
  bun: 'bun.lockb',
  yarn: 'yarn.lock',
  npm: 'package-lock.json',
};

/**
 * Default priority order for package managers
 */
export const DEFAULT_PRIORITY: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];

/**
 * Detects available lockfiles in the current directory or parent directories
 * @param cwd Current working directory
 * @returns Object with detected lockfiles and their paths
 */
export async function detectLockfiles(cwd: string = process.cwd()): Promise<Record<PackageManager, string | null>> {
  const result: Record<PackageManager, string | null> = {
    pnpm: null,
    bun: null,
    yarn: null,
    npm: null,
  };

  // Only look in the current directory, not in parent directories
  await Promise.all(
    Object.entries(LOCKFILES).map(async ([pm, lockfile]) => {
      const lockfilePath = path.join(cwd, lockfile);
      if (await fs.pathExists(lockfilePath)) {
        result[pm as PackageManager] = lockfilePath;
      }
    })
  );

  return result;
}

/**
 * Determines the package manager to use based on detected lockfiles and priority
 * @param cwd Current working directory
 * @param priority Priority order for package managers
 * @param throwOnMissing Whether to throw an error if no lockfile is found
 * @returns Selected package manager or null if none found and throwOnMissing is false
 */
export async function detectPackageManager(
  cwd: string = process.cwd(),
  priority: PackageManager[] = DEFAULT_PRIORITY,
  throwOnMissing: boolean = true
): Promise<PackageManager | null> {
  const lockfiles = await detectLockfiles(cwd);
  
  // Find the first package manager in the priority list that has a lockfile
  for (const pm of priority) {
    if (lockfiles[pm]) {
      return pm;
    }
  }

  if (throwOnMissing) {
    throw new NoLockfileError('No lockfile detected in the current directory or its parents');
  }

  return null;
}

/**
 * Gets all detected package managers in the current directory
 * @param cwd Current working directory
 * @returns Array of detected package managers
 */
export async function getAllDetectedPackageManagers(cwd: string = process.cwd()): Promise<PackageManager[]> {
  const lockfiles = await detectLockfiles(cwd);
  return Object.entries(lockfiles)
    .filter(([_, path]) => path !== null)
    .map(([pm, _]) => pm as PackageManager);
}

/**
 * Checks if a package manager is installed globally
 * @param packageManager Package manager to check
 * @returns Whether the package manager is installed
 */
export async function isPackageManagerInstalled(packageManager: PackageManager): Promise<boolean> {
  try {
    // Use 'which' on Unix-like systems or 'where' on Windows
    const command = process.platform === 'win32' ? 'where' : 'which';
    await execa(command, [packageManager]);
    return true;
  } catch (error) {
    return false;
  }
}
