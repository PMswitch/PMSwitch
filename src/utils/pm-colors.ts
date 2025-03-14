import chalk from 'chalk';
import { PackageManager } from '../types';

/**
 * Color definitions for each package manager
 */
export const PM_COLORS: Record<PackageManager, chalk.ChalkFunction> = {
  npm: chalk.blue,     // Blue for npm
  yarn: chalk.yellow,  // Yellow for yarn
  pnpm: chalk.magenta, // Magenta for pnpm
  bun: chalk.cyan,     // Cyan for bun
};

/**
 * Returns the package manager name styled with its color
 * @param packageManager Package manager to style
 * @returns Styled package manager name
 */
export function colorizePackageManager(packageManager: PackageManager): string {
  return PM_COLORS[packageManager](packageManager);
}

/**
 * Returns the command styled with the package manager's color
 * @param packageManager Package manager to use for styling
 * @param command Command to style
 * @returns Styled command
 */
export function colorizeCommand(packageManager: PackageManager, command: string): string {
  return PM_COLORS[packageManager](`${packageManager} ${command}`);
}
