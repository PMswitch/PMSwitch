// Export all modules for library usage
export * from './types';
export * from './detector';
export * from './command-proxy';
export * from './config-manager';
export * from './prompt';
export * from './errors';
export * from './utils/logger';

// Main entry point for programmatic usage
import { detectPackageManager } from './detector';
import { executeCommand } from './command-proxy';
import { loadConfig } from './config-manager';

/**
 * Main function to run a command with the detected package manager
 * @param command Command to run
 * @param args Command arguments
 * @param cwd Current working directory
 * @returns Promise that resolves when the command completes
 */
export async function run(command: string, args: string[] = [], cwd: string = process.cwd()): Promise<void> {
  const config = await loadConfig(cwd);
  const packageManager = await detectPackageManager(cwd, config.priority, false);
  
  if (packageManager === null) {
    throw new Error('No package manager detected and no default configured');
  }
  
  await executeCommand(packageManager, command, args, config.autoInstall);
}
