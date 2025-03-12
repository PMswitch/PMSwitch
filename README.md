<p align="center">
  <img src="./assets/logo.png" alt="PMSwitch Logo" width="500">
</p>

# PMSwitch 🔄

A zero-config CLI tool that detects a project's package manager (pnpm, yarn, npm, bun) by analyzing lockfiles and proxies commands to the correct package manager. Say goodbye to manually switching between package managers in different projects!

## Features

- **Automatic Detection**: Detects package managers based on lockfiles (pnpm-lock.yaml, yarn.lock, package-lock.json, bun.lockb)
- **Command Proxying**: Forwards commands to the correct package manager
- **Multiple Lockfile Handling**: Interactive prompts for ambiguous scenarios
- **Configuration Options**: Global and project-specific settings
- **Auto-Installation**: Can install missing package managers when needed

## Installation

```bash
npm install -g pmsswitch
```

### From Source

```bash
git clone https://github.com/PMswitch/PMSwitch.git
cd PMSwitch
pnpm install
pnpm build
pnpm link --global
```

## Usage

Instead of switching between different package managers in different projects, simply use `pms` as a universal command:

```bash
# Equivalent to "npm install", "yarn install", or "pnpm install" depending on lockfile
pms install

# Add a dependency
pms add react

# Run a script
pms run start

# Execute with specific flags
pms add lodash --dev
```

### Force a specific package manager

```bash
pms install --force-pnpm
pms add react --force-yarn
pms run build --force-npm
```

### Disable interactive prompts

```bash
pms install --no-interactive
```

### Show debug information

```bash
pms install --debug
```

### Set default package manager

You can set your preferred default package manager directly from the command line:

```bash
pms --default pnpm  # Set pnpm as your default package manager
pms --default yarn  # Set yarn as your default package manager
pms --default npm   # Set npm as your default package manager
```

## Configuration

PMSwitch can be configured globally or per-project:

### Global Configuration

Create a `.pmswitchrc` file in your home directory:

```json
{
  "defaultPackageManager": "pnpm",
  "priority": ["pnpm", "bun", "yarn", "npm"],
  "interactive": true,
  "autoInstall": false
}
```

### Project Configuration

Add a `pmswitchConfig` section to your `package.json`:

```json
{
  "name": "your-project",
  "version": "1.0.0",
  "pmswitchConfig": {
    "defaultPackageManager": "yarn",
    "priority": ["yarn", "pnpm", "npm"],
    "interactive": true
  }
}
```

## How It Works

1. When you run a `pms` command, PMSwitch searches for lockfiles in the current directory
2. It selects the appropriate package manager based on:
   - Detected lockfiles
   - Forced package manager flags
   - Configured priority order
   - User input (if interactive)
3. It executes the equivalent command using the selected package manager

## Supported Commands

PMSwitch supports all common package manager commands:

- `install`
- `add`
- `remove`
- `run`
- `exec`
- `update`
- `init`
- And more!

## Troubleshooting

### Multiple Lockfiles

If multiple lockfiles are detected in a project, PMSwitch will prompt you to choose which package manager to use. You can also force a specific package manager using the `--force-*` flags.

### Missing Package Manager

If the detected package manager is not installed on your system, PMSwitch will notify you and provide instructions for installation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
