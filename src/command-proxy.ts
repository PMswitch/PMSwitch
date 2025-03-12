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
 * Maps pmswitch commands to package manager specific commands
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
  run: {
    pnpm: 'run',
    bun: 'run',
    yarn: 'run',
    npm: 'run',
  },
  // Special commands that don't need 'run' in npm
  start: {
    pnpm: 'start',
    bun: 'run start',
    yarn: 'start',
    npm: 'start',
  },
  test: {
    pnpm: 'test',
    bun: 'run test',
    yarn: 'test',
    npm: 'test',
  },
  // Add more command mappings as needed
  exec: {
    pnpm: 'dlx',
    bun: 'x',
    yarn: 'exec',
    npm: 'exec',
  },
  dlx: {
    pnpm: 'dlx',
    bun: 'x',
    yarn: 'exec',
    npm: 'exec',
  },
  npx: {
    pnpm: 'dlx',
    bun: 'x',
    yarn: 'exec',
    npm: 'exec',
  },
  create: {
    pnpm: 'create',
    bun: 'create',
    yarn: 'create',
    npm: 'create',
  }
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
 * Maps a pmswitch command to the appropriate package manager command
 * @param command pmswitch command
 * @param packageManager Package manager to use
 * @returns Mapped command for the package manager
 */
export function mapCommand(command: string, packageManager: PackageManager): string {
  if (COMMAND_MAPPING[command] && COMMAND_MAPPING[command][packageManager]) {
    return COMMAND_MAPPING[command][packageManager];
  }
  
  // Special handling for npm scripts that aren't in the mapping
  // For npm, any command that's not explicitly mapped should be prefixed with 'run'
  // except for 'start' and 'test' which can be used directly
  if (packageManager === 'npm' && command !== 'start' && command !== 'test' && !COMMON_COMMANDS.includes(command)) {
    return `run ${command}`;
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
  // Special handling for npx-style commands in Yarn 1.x
  if (packageManager === 'yarn' && (command === 'exec' || command === 'dlx' || command === 'npx') && args.length > 0) {
    // Extract package name and version
    const packageWithVersion = args[0];
    const packageName = packageWithVersion.split('@')[0];
    const packageArgs = args.slice(1);
    
    console.log(chalk.blue(`[INFO] Using package manager: ${packageManager}`))
    console.log(`Executing: yarn add --dev ${packageWithVersion} && yarn exec ${packageName} ${packageArgs.join(' ')}`);
    
    try {
      // First install the package temporarily
      await execa('yarn', ['add', '--dev', packageWithVersion], { stdio: 'inherit' });
      
      // Then execute it - use only the package name without version for exec
      await execa('yarn', ['exec', packageName, ...packageArgs], { stdio: 'inherit' });
      
      // Finally remove it
      await execa('yarn', ['remove', packageName], { stdio: 'inherit' });
      
      return;
    } catch (error: any) {
      throw new CommandExecutionError(`Command 'yarn add --dev ${packageWithVersion} && yarn exec ${packageName} ${packageArgs.join(' ')}' failed with exit code ${error.exitCode || 1}: ${error.message}`, error.exitCode || 1, error.message);
    }
  }
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
  
  // Check if the command is a script command that needs special handling for npm
  const isNpmScriptCommand = packageManager === 'npm' && 
                           mappedCommand.startsWith('run ') && 
                           !COMMON_COMMANDS.includes(command);
  
  if (isNpmScriptCommand) {
    // For npm script commands, we need to split 'run' and the script name
    const scriptName = mappedCommand.split(' ')[1];
    console.log(chalk.blue(`Executing: ${packageManager} run ${scriptName} ${args.join(' ')}`));
    
    try {
      // Execute with 'run' and the script name as separate arguments
      await execa(packageManager, ['run', scriptName, ...args], { stdio: 'inherit' });
      return;
    } catch (error: any) {
      throw new CommandExecutionError(
        `${packageManager} run ${scriptName} ${args.join(' ')}`,
        error.exitCode || 1,
        error.stderr || ''
      );
    }
  }
  
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
