import execa from 'execa';
import chalk from 'chalk';
import { PackageManager } from './types';
import { PackageManagerNotInstalledError, CommandExecutionError } from './errors';
import { isPackageManagerInstalled } from './detector';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Common commands that can be proxied to package managers
 */
export const COMMON_COMMANDS = [
  'install',
  'add',
  'remove',
  'run',
  'exec',
  'update',
  'init',
  'uninstall',
  'list',
  'outdated',
  'audit',
  'test',
  'publish',
  'link',
  'unlink',
];

/**
 * Maps lockpick commands to package manager specific commands
 */
const COMMAND_MAPPING: Record<string, Record<PackageManager, string>> = {
  install: {
    pnpm: 'install',
    bun: 'install',
    yarn: 'install',
    npm: 'install',
  },
  add: {
    pnpm: 'add',
    bun: 'add',
    yarn: 'add',
    npm: 'install',
  },
  remove: {
    pnpm: 'remove',
    bun: 'remove',
    yarn: 'remove',
    npm: 'uninstall',
  },
  // Add more command mappings as needed
};

/**
 * Installs a package manager globally
 * @param packageManager Package manager to install
 * @returns Promise that resolves when installation is complete
 */
export async function installPackageManager(packageManager: PackageManager): Promise<void> {
  console.log(chalk.yellow(`Installing ${packageManager} globally...`));
  
  try {
    // Use npm to install other package managers
    await execa('npm', ['install', '-g', packageManager], { stdio: 'inherit' });
    console.log(chalk.green(`Successfully installed ${packageManager}`));
  } catch (error: any) {
    throw new Error(`Failed to install ${packageManager}: ${error.message}`);
  }
}

/**
 * Maps a lockpick command to the appropriate package manager command
 * @param command Lockpick command
 * @param packageManager Package manager to use
 * @returns Mapped command for the package manager
 */
export function mapCommand(command: string, packageManager: PackageManager): string {
  if (COMMAND_MAPPING[command] && COMMAND_MAPPING[command][packageManager]) {
    return COMMAND_MAPPING[command][packageManager];
  }
  
  // If no mapping exists, use the command as-is
  return command;
}

/**
 * Executes a command using the specified package manager
 * @param packageManager Package manager to use
 * @param command Command to execute
 * @param args Arguments to pass to the command
 * @param autoInstall Whether to automatically install the package manager if not found
 * @returns Promise that resolves when the command completes
 */
export async function executeCommand(
  packageManager: PackageManager,
  command: string,
  args: string[] = [],
  autoInstall: boolean = false
): Promise<void> {
  // Check if the package manager is installed
  const isInstalled = await isPackageManagerInstalled(packageManager);
  
  if (!isInstalled) {
    if (autoInstall) {
      await installPackageManager(packageManager);
    } else {
      throw new PackageManagerNotInstalledError(packageManager);
    }
  }
  
  // Special case for yarn install with package names
  // In yarn, 'install' without args installs dependencies from package.json
  // but 'add' is used to add new packages (unlike npm/pnpm where 'install' works for both)
  if (packageManager === 'yarn' && command === 'install' && args.length > 0) {
    // If we're trying to install specific packages with yarn, use 'add' instead
    console.log(chalk.blue(`Executing: ${packageManager} add ${args.join(' ')}`));
    
    try {
      await execa(packageManager, ['add', ...args], { stdio: 'inherit' });
      return;
    } catch (error: any) {
      throw new CommandExecutionError(
        `${packageManager} add ${args.join(' ')}`,
        error.exitCode || 1,
        error.stderr || ''
      );
    }
  }
  
  // Map the command to the appropriate package manager command
  const mappedCommand = mapCommand(command, packageManager);
  
  console.log(chalk.blue(`Executing: ${packageManager} ${mappedCommand} ${args.join(' ')}`));
  
  try {
    // Execute the command and pipe stdout/stderr to the current process
    await execa(packageManager, [mappedCommand, ...args], { stdio: 'inherit' });
  } catch (error: any) {
    throw new CommandExecutionError(
      `${packageManager} ${mappedCommand} ${args.join(' ')}`,
      error.exitCode || 1,
      error.stderr || ''
    );
  }
}
