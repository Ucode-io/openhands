---
name: package-manager-detection
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
- npm
- yarn
- pnpm
- install dependencies
- npm install
- yarn install
- yarn add
- npm i
- package manager
- node_modules
- package.json
---

# Package Manager Detection and Usage

When working with JavaScript/Node.js projects, **ALWAYS detect and use the correct package manager** for the project.

## Detection Priority (MUST FOLLOW)

Before running ANY package installation command, check for lock files in this order:

1. **`yarn.lock`** → Use **yarn**
2. **`package-lock.json`** → Use **npm**
3. **`pnpm-lock.yaml`** → Use **pnpm**
4. **No lock file found** → Check user's `package_manager` setting, default to **npm**

## How to Detect

Run this command at the project root to detect the package manager:

```bash
if [ -f "yarn.lock" ]; then
    echo "PACKAGE_MANAGER=yarn"
elif [ -f "pnpm-lock.yaml" ]; then
    echo "PACKAGE_MANAGER=pnpm"
elif [ -f "package-lock.json" ]; then
    echo "PACKAGE_MANAGER=npm"
else
    echo "PACKAGE_MANAGER=npm"  # default fallback
fi
```

Or simply check for the existence of lock files:

```bash
ls -la yarn.lock package-lock.json pnpm-lock.yaml 2>/dev/null
```

## Command Mapping

| Action | npm | yarn | pnpm |
|--------|-----|------|------|
| Install all | `npm install` | `yarn` or `yarn install` | `pnpm install` |
| Add package | `npm install <pkg>` | `yarn add <pkg>` | `pnpm add <pkg>` |
| Add dev dep | `npm install -D <pkg>` | `yarn add -D <pkg>` | `pnpm add -D <pkg>` |
| Remove | `npm uninstall <pkg>` | `yarn remove <pkg>` | `pnpm remove <pkg>` |
| Run script | `npm run <script>` | `yarn <script>` | `pnpm <script>` |
| Run dev | `npm run dev` | `yarn dev` | `pnpm dev` |
| Run build | `npm run build` | `yarn build` | `pnpm build` |
| Run test | `npm test` | `yarn test` | `pnpm test` |

## Critical Rules

1. **NEVER mix package managers** - Using npm in a yarn project (or vice versa) creates conflicts
2. **NEVER delete lock files** - They ensure reproducible builds
3. **ALWAYS use the detected package manager** for ALL dependency operations
4. **When creating new projects**, ask the user which package manager they prefer or use their setting

## Examples

### Installing a new dependency

**❌ WRONG:**
```bash
# In a project with yarn.lock, don't do this:
npm install axios
```

**✅ CORRECT:**
```bash
# First detect
ls yarn.lock 2>/dev/null && echo "Using yarn"

# Then use the correct command
yarn add axios
```

### Running scripts

**❌ WRONG:**
```bash
# In a yarn project
npm run dev
```

**✅ CORRECT:**
```bash
# In a yarn project (detected by yarn.lock)
yarn dev
```

## New Project Creation

When creating a new JavaScript/Node.js project:

1. Ask the user which package manager they prefer, OR
2. Check the user's `package_manager` setting in OpenHands settings
3. Initialize with the preferred package manager:
   - npm: `npm init -y`
   - yarn: `yarn init -y`
   - pnpm: `pnpm init`

## Monorepo Considerations

In monorepos, check the **root directory** for the lock file, not individual packages. The lock file at the root determines the package manager for the entire monorepo.

## Troubleshooting

If you encounter dependency issues:

1. **Check which lock file exists** - this tells you which package manager was intended
2. **Do NOT generate a new lock file** with a different package manager
3. **If conflicts exist**, inform the user and ask how to proceed
4. **Consider running** `yarn` or `npm install` to regenerate node_modules from the existing lock file
