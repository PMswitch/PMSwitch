import { prompt } from 'enquirer';
import chalk from 'chalk';
import { PackageManager } from './types';

/**
 * Prompts the user to choose a package manager when multiple lockfiles are detected
 * @param packageManagers List of detected package managers
 * @returns Selected package manager
 */
export async function promptPackageManager(packageManagers: PackageManager[]): Promise<PackageManager> {
  if (packageManagers.length === 0) {
    throw new Error('No package managers provided for selection');
  }
  
  if (packageManagers.length === 1) {
    return packageManagers[0];
  }
  
  const result = await prompt<{ packageManager: PackageManager }>({
    type: 'select',
    name: 'packageManager',
    message: 'Multiple lockfiles detected. Which package manager would you like to use?',
    choices: packageManagers.map(pm => ({
      name: pm,
      value: pm,
      message: pm
    }))
  });
  
  return result.packageManager;
}

/**
 * Prompts the user to choose a package manager when no lockfiles are detected
 * @returns Selected package manager
 */
export async function promptDefaultPackageManager(): Promise<PackageManager> {
  const result = await prompt<{ packageManager: PackageManager }>({
    type: 'select',
    name: 'packageManager',
    message: 'No lockfile detected. Which package manager would you like to use?',
    choices: [
      { name: 'pnpm', value: 'pnpm', message: 'pnpm' },
      { name: 'bun', value: 'bun', message: 'bun' },
      { name: 'yarn', value: 'yarn', message: 'yarn' },
      { name: 'npm', value: 'npm', message: 'npm' }
    ]
  });
  
  return result.packageManager;
}

/**
 * Prompts the user to confirm installation of a missing package manager
 * @param packageManager Package manager to install
 * @returns Whether to install the package manager
 */
export async function promptInstallPackageManager(packageManager: PackageManager): Promise<boolean> {
  const result = await prompt<{ install: boolean }>({
    type: 'confirm',
    name: 'install',
    message: `${packageManager} is not installed. Would you like to install it globally?`,
    initial: true
  });
  
  return result.install;
}

/**
 * Prompts the user to save the selected package manager as default
 * @param packageManager Selected package manager
 * @returns Whether to save as default
 */
export async function promptSaveAsDefault(packageManager: PackageManager): Promise<boolean> {
  const result = await prompt<{ save: boolean }>({
    type: 'confirm',
    name: 'save',
    message: `Would you like to save ${packageManager} as your default package manager?`,
    initial: false
  });
  
  return result.save;
}
