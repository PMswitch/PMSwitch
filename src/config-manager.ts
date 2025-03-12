import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { PMSwitchConfig, PackageManager } from './types';
import { DEFAULT_PRIORITY } from './detector';

// Default configuration
const DEFAULT_CONFIG: PMSwitchConfig = {
  defaultPackageManager: 'npm',
  priority: DEFAULT_PRIORITY,
  interactive: true,
  autoInstall: false,
};

// Global config file path
const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.pmswitchrc');

/**
 * Loads configuration from global and project-specific sources
 * @param cwd Current working directory
 * @returns Merged configuration
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<PMSwitchConfig> {
  // Start with default config
  let config: PMSwitchConfig = { ...DEFAULT_CONFIG };
  
  // Try to load global config
  try {
    if (await fs.pathExists(GLOBAL_CONFIG_PATH)) {
      const globalConfig = await fs.readJson(GLOBAL_CONFIG_PATH);
      config = { ...config, ...globalConfig };
    }
  } catch (error: unknown) {
    console.warn(`Failed to load global config: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Try to load project-specific config from package.json
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      if (packageJson.pmswitchConfig) {
        config = { ...config, ...packageJson.pmswitchConfig };
      }
    }
  } catch (error: unknown) {
    console.warn(`Failed to load project config: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return config;
}

/**
 * Saves configuration to the global config file
 * @param config Configuration to save
 */
export async function saveGlobalConfig(config: Partial<PMSwitchConfig>): Promise<void> {
  // Load existing config first
  let existingConfig: PMSwitchConfig = { ...DEFAULT_CONFIG };
  
  try {
    if (await fs.pathExists(GLOBAL_CONFIG_PATH)) {
      existingConfig = await fs.readJson(GLOBAL_CONFIG_PATH);
    }
  } catch (error) {
    // Ignore errors, we'll create a new config
  }
  
  // Merge with new config
  const mergedConfig = { ...existingConfig, ...config };
  
  // Save to file
  await fs.writeJson(GLOBAL_CONFIG_PATH, mergedConfig, { spaces: 2 });
}

/**
 * Sets the default package manager in the global config
 * @param packageManager Package manager to set as default
 */
export async function setDefaultPackageManager(packageManager: PackageManager): Promise<void> {
  await saveGlobalConfig({ defaultPackageManager: packageManager });
}

/**
 * Sets the priority order for package managers in the global config
 * @param priority Priority order for package managers
 */
export async function setPriorityOrder(priority: PackageManager[]): Promise<void> {
  await saveGlobalConfig({ priority });
}
