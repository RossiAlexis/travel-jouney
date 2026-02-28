# Package Manager

This project uses **pnpm** as its package manager. Always use pnpm for all package management tasks.

## Rules

- Always use `pnpm` instead of `npm` or `yarn`
- Never create or modify `package-lock.json` or `yarn.lock`
- The lockfile is `pnpm-lock.yaml` — do not delete it

## Common Commands

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Add a dependency | `pnpm add <package>` |
| Add a dev dependency | `pnpm add -D <package>` |
| Remove a dependency | `pnpm remove <package>` |
| Run a script | `pnpm <script>` |
| Execute a package binary | `pnpm exec <binary>` |
| Run a one-off package | `pnpm dlx <package>` |

## Configuration

- `.npmrc` sets `node-linker=hoisted` for broad package compatibility
- Approved build scripts are listed under `pnpm.onlyBuiltDependencies` in `package.json`
