#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { PackageManager, CommandOptions } from './types';
import { detectPackageManager, getAllDetectedPackageManagers, isPackageManagerInstalled } from './detector';
import { executeCommand, COMMON_COMMANDS } from './command-proxy';
import { loadConfig, setDefaultPackageManager } from './config-manager';
import { promptPackageManager, promptDefaultPackageManager, promptInstallPackageManager, promptSaveAsDefault } from './prompt';
import { debug, info, warn, error, success, setLogLevel, LogLevel } from './utils/logger';
import { NoLockfileError, PackageManagerNotInstalledError } from './errors';

// Get package version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const VERSION = packageJson.version;

// Create CLI program
const program = new Command();

program
  .name('pms')
  .description('Zero-config CLI tool that automatically detects and uses the right package manager based on lockfiles')
  .version(VERSION, '-v, --version', 'Output the current version')
  .option('--force-pnpm', 'Force using pnpm')
  .option('--force-bun', 'Force using bun')
  .option('--force-yarn', 'Force using yarn')
  .option('--force-npm', 'Force using npm')
  .option('--default <packageManager>', 'Set default package manager (pnpm, yarn, npm, bun)')
  .option('--no-interactive', 'Disable interactive prompts')
  .option('--debug', 'Show debug information')
  .helpOption('-h, --help', 'Display help for command');

// Add common commands
COMMON_COMMANDS.forEach(cmd => {
  program
    .command(cmd)
    .description(`Run '${cmd}' with the detected package manager`)
    .allowUnknownOption()
    .action(async (options, command) => {
      await runCommand(cmd, command.args, {
        force: getForcedPackageManager(program.opts()),
        noInteractive: program.opts().noInteractive,
        debug: program.opts().debug
      });
    });
});

// Default command for any other command not explicitly defined
program
  .arguments('[command] [args...]')
  .action(async (command, args, options) => {
    // Handle setting default package manager
    const opts = program.opts();
    if (opts.default) {
      const packageManager = opts.default.toLowerCase();
      if (!['pnpm', 'yarn', 'npm', 'bun'].includes(packageManager)) {
        error(`Invalid package manager: ${packageManager}. Must be one of: pnpm, yarn, npm, bun`);
        process.exit(1);
      }
      
      await setDefaultPackageManager(packageManager as PackageManager);
      success(`Set ${packageManager} as the default package manager`);
      return;
    }
    
    if (!command) {
      program.help();
      return;
    }
    
    await runCommand(command, args, {
      force: getForcedPackageManager(opts),
      noInteractive: opts.noInteractive,
      debug: opts.debug
    });
  });

/**
 * Gets the forced package manager from command options
 * @param options Command options
 * @returns Forced package manager or undefined
 */
function getForcedPackageManager(options: any): PackageManager | undefined {
  if (options.forcePnpm) return 'pnpm';
  if (options.forceBun) return 'bun';
  if (options.forceYarn) return 'yarn';
  if (options.forceNpm) return 'npm';
  return undefined;
}

/**
 * Runs a command with the detected package manager
 * @param command Command to run
 * @param args Command arguments
 * @param options Command options
 */
async function runCommand(command: string, args: string[], options: CommandOptions): Promise<void> {
  try {
    // Set log level based on debug flag
    if (options.debug) {
      setLogLevel(LogLevel.DEBUG);
    }
    
    debug(`Running command: ${command} ${args.join(' ')}`);
    debug(`Options: ${JSON.stringify(options)}`);
    
    // Load config
    const config = await loadConfig();
    debug(`Loaded config: ${JSON.stringify(config)}`);
    
    // Determine package manager to use
    let packageManager: PackageManager = 'npm'; // Default to npm initially
    
    // Use forced package manager if specified
    if (options.force) {
      packageManager = options.force;
      debug(`Using forced package manager: ${packageManager}`);
    } else {
      try {
        // Try to detect package manager from lockfiles
        const detectedPMs = await getAllDetectedPackageManagers();
        debug(`Detected package managers: ${detectedPMs.join(', ') || 'none'}`);
        
        if (detectedPMs.length > 1) {
          // Multiple lockfiles detected
          if (config.interactive && !options.noInteractive) {
            // Use interactive prompt
            packageManager = await promptPackageManager(detectedPMs);
          } else {
            // Use priority order from config
            for (const pm of config.priority || []) {
              if (detectedPMs.includes(pm)) {
                packageManager = pm;
                break;
              }
            }
            
            // If no match in priority, use first detected
            if (!packageManager) {
              packageManager = detectedPMs[0];
            }
          }
        } else if (detectedPMs.length === 1) {
          // Single lockfile detected
          packageManager = detectedPMs[0];
        } else {
          // No lockfiles detected
          if (config.defaultPackageManager) {
            // Use default from config
            packageManager = config.defaultPackageManager;
            debug(`Using default package manager: ${packageManager}`);
          } else if (config.interactive && !options.noInteractive) {
            // Use interactive prompt
            packageManager = await promptDefaultPackageManager();
            
            // Ask if user wants to save as default
            const saveAsDefault = await promptSaveAsDefault(packageManager);
            if (saveAsDefault) {
              await setDefaultPackageManager(packageManager);
              success(`Saved ${packageManager} as default package manager`);
            }
          } else {
            // No default and no interactive, use npm
            packageManager = 'npm';
            warn('No lockfile detected and no default package manager configured. Using npm.');
          }
        }
      } catch (err) {
        if (err instanceof NoLockfileError) {
          // No lockfiles detected
          if (config.defaultPackageManager) {
            // Use default from config
            packageManager = config.defaultPackageManager;
            debug(`Using default package manager: ${packageManager}`);
          } else if (config.interactive && !options.noInteractive) {
            // Use interactive prompt
            packageManager = await promptDefaultPackageManager();
          } else {
            // No default and no interactive, use npm
            packageManager = 'npm';
            warn('No lockfile detected and no default package manager configured. Using npm.');
          }
        } else {
          throw err;
        }
      }
    }
    
    // Check if package manager is installed
    const isInstalled = await isPackageManagerInstalled(packageManager);
    if (!isInstalled) {
      if (config.autoInstall || (config.interactive && !options.noInteractive && await promptInstallPackageManager(packageManager))) {
        // Install package manager
        info(`Installing ${packageManager}...`);
        // Use npm to install other package managers
        await executeCommand('npm', 'install', ['-g', packageManager]);
        success(`Successfully installed ${packageManager}`);
      } else {
        throw new PackageManagerNotInstalledError(packageManager);
      }
    }
    
    // Execute command
    info(`Using package manager: ${packageManager}`);
    await executeCommand(packageManager, command, args);
    
  } catch (err: unknown) {
    error(err instanceof Error ? err.message : String(err));
    debug(err instanceof Error && err.stack ? err.stack : 'No stack trace available');
    process.exit(1);
  }
}

// Parse command line arguments
program.parse(process.argv);
