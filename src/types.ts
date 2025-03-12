/**
 * Supported package managers
 */
export type PackageManager = 'pnpm' | 'bun' | 'yarn' | 'npm';

/**
 * Configuration options for PMSwitch
 */
export interface PMSwitchConfig {
  /**
   * Default package manager to use when no lockfile is found
   */
  defaultPackageManager?: PackageManager;
  
  /**
   * Priority order for package managers
   */
  priority?: PackageManager[];
  
  /**
   * Whether to use interactive prompts
   */
  interactive?: boolean;
  
  /**
   * Whether to automatically install missing package managers
   */
  autoInstall?: boolean;
}

/**
 * Command options for CLI
 */
export interface CommandOptions {
  /**
   * Force using a specific package manager
   */
  force?: PackageManager;
  
  /**
   * Disable interactive prompts
   */
  noInteractive?: boolean;
  
  /**
   * Show debug information
   */
  debug?: boolean;
}
