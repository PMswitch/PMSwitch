/**
 * Custom error for when no lockfile is detected
 */
export class NoLockfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoLockfileError';
  }
}

/**
 * Custom error for when a package manager is not installed
 */
export class PackageManagerNotInstalledError extends Error {
  constructor(packageManager: string) {
    super(`Package manager '${packageManager}' is not installed`);
    this.name = 'PackageManagerNotInstalledError';
  }
}

/**
 * Custom error for when a command fails
 */
export class CommandExecutionError extends Error {
  constructor(command: string, exitCode: number, stderr: string) {
    super(`Command '${command}' failed with exit code ${exitCode}: ${stderr}`);
    this.name = 'CommandExecutionError';
  }
}
