# PGHL-MCP Deployment Guide

Complete guide for deploying PGHL-MCP to npm and Vercel.

## Prerequisites

- Node.js 18+ installed
- npm account (https://www.npmjs.com)
- Vercel account (https://vercel.com)
- GitHub repository set up
- Logged in to npm: `npm login`
- Logged in to Vercel: `vercel login`

## Project Structure

```
pghl-mcp/
├── src/                    # STDIO server source (TypeScript)
│   ├── index.ts           # Main entry point
│   ├── server.ts          # MCP server setup
│   ├── tools/             # MCP tool implementations
│   ├── scraper/           # Web scraping logic
│   ├── models/            # Data models
│   └── utils/             # Utilities
├── http/                  # HTTP server (Next.js)
│   └── app/
│       └── api/mcp/route.ts  # HTTP MCP endpoint
├── dist/                  # Compiled TypeScript (git-ignored)
├── package.json           # npm package config
├── tsconfig.json          # TypeScript config (dev)
├── tsconfig.build.json    # TypeScript config (production)
└── vercel.json            # Vercel deployment config
```

## npm Publishing Workflow

### 1. Prepare for Release

```bash
# Ensure you're on main branch
git checkout main
git pull

# Run type check
npm run typecheck

# Build the package
npm run build:stdio

# Test locally
npm test
```

### 2. Version Bump

Choose the appropriate version bump:

```bash
# Patch version (0.1.0 → 0.1.1) - Bug fixes
npm version patch -m "chore: bump to %s - bug fixes"

# Minor version (0.1.0 → 0.2.0) - New features
npm version minor -m "chore: bump to %s - new features"

# Major version (0.1.0 → 1.0.0) - Breaking changes
npm version major -m "chore: bump to %s - breaking changes"
```

This automatically:
- Updates `package.json` version
- Creates a git commit
- Creates a git tag (e.g., `v0.1.1`)

### 3. Push Changes

```bash
git push
git push --tags
```

### 4. Publish to npm

```bash
npm publish --access public
```

**What gets published** (defined in `package.json` `files` array):
- `dist/` - Compiled TypeScript
- `README.md`
- `LICENSE`

**What's excluded** (not in `files` array):
- `src/` - Source TypeScript files
- `http/` - Next.js HTTP server
- `tests/` - Test files
- `.env`, `.vercel`, etc.

### 5. Verify Publication

```bash
# Check npm registry
npm view @joerawr/pghl-mcp

# Test installation
npx @joerawr/pghl-mcp
```

## Vercel Deployment Workflow

### 1. Initial Setup (First Time Only)

```bash
# Link project to Vercel
vercel link

# Answer prompts:
# - Select scope: joe-rogers-projects
# - Link to existing project: No
# - Project name: pghl-mcp
# - Directory: ./
```

This creates `.vercel/` directory with project config.

### 2. Deploy to Production

```bash
# Deploy with confirmation
vercel --prod

# Deploy without confirmation (CI/CD)
vercel --prod --yes
```

### 3. Check Deployment Status

```bash
# List deployments
vercel ls pghl-mcp --prod

# Get deployment URL
vercel inspect <deployment-url> --logs

# Check build logs
vercel inspect <deployment-url> --logs --wait
```

### 4. Environment Variables (if needed)

```bash
# Set environment variable
vercel env add CHROME_EXECUTABLE_PATH

# List environment variables
vercel env ls
```

### 5. Verify Deployment

```bash
# Check landing page
curl https://pghl-mcp.vercel.app

# Test MCP endpoint
curl -X POST https://pghl-mcp.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Vercel Configuration

**File: `vercel.json`**

```json
{
  "buildCommand": "npm run build:http",
  "outputDirectory": "http/.next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

**Key Settings:**
- `buildCommand`: Builds Next.js app in `http/` directory
- `outputDirectory`: Tells Vercel where Next.js output is
- `framework`: Enables Next.js-specific optimizations

## Build Scripts

**STDIO Build** (for npm package):
```bash
npm run build            # Alias for build:stdio
npm run build:stdio      # TypeScript → dist/
```

**HTTP Build** (for Vercel):
```bash
npm run build:http       # Next.js → http/.next/
```

**Build Both**:
```bash
npm run build:all        # Builds STDIO + HTTP
```

## Troubleshooting

### npm publish fails

**Issue**: "You cannot publish over the previously published versions"
```bash
# Solution: Bump version first
npm version patch
npm publish --access public
```

**Issue**: "You do not have permission to publish"
```bash
# Solution: Check you're logged in
npm whoami
npm login
```

### Vercel build fails

**Issue**: "Error: Command failed with exit code 1"
```bash
# Check build locally
npm run build:http

# View build logs
vercel inspect <deployment-url> --logs
```

**Issue**: Puppeteer issues on Vercel
- Uses `@sparticuz/chromium` for serverless Chrome
- Configured in `src/scraper/browser.ts`
- No action needed (handled automatically)

### Schema import warnings

**Issue**: "Attempted import error: 'GetScheduleArgsSchema' is not exported"
- These are non-blocking warnings
- Schemas are used for validation, not required for runtime
- Fixed in commit 204247e

## Rollback Procedure

### Rollback npm package

```bash
# Unpublish version (within 72 hours)
npm unpublish @joerawr/pghl-mcp@0.1.1

# Deprecate version (after 72 hours)
npm deprecate @joerawr/pghl-mcp@0.1.1 "Use version 0.1.0 instead"
```

### Rollback Vercel deployment

```bash
# List deployments
vercel ls pghl-mcp

# Promote previous deployment to production
vercel promote <previous-deployment-url>
```

## CI/CD Integration (Future)

For automated deployments via GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    tags:
      - 'v*'

jobs:
  publish-npm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build:stdio
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  deploy-vercel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g vercel
      - run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Quick Reference

### Publishing Checklist

- [ ] Pull latest changes: `git pull`
- [ ] Type check passes: `npm run typecheck`
- [ ] Build succeeds: `npm run build:stdio`
- [ ] Local test works: `npm test`
- [ ] Version bumped: `npm version patch/minor/major`
- [ ] Changes pushed: `git push && git push --tags`
- [ ] Published to npm: `npm publish --access public`
- [ ] Verified on npm: `npm view @joerawr/pghl-mcp`

### Deployment Checklist

- [ ] Pull latest changes: `git pull`
- [ ] HTTP build succeeds: `npm run build:http`
- [ ] Deploy to Vercel: `vercel --prod --yes`
- [ ] Check deployment status: `vercel ls pghl-mcp --prod`
- [ ] Verify landing page: Visit Vercel URL
- [ ] Test MCP endpoint: `curl` or browser

## Post-Deployment

### Update Documentation

1. **README.md**: Update installation instructions if URLs changed
2. **CHANGELOG.md**: Document what was deployed
3. **GitHub Release**: Create release from tag with notes

### Notify Users

- Update GitHub issue/PR with deployment links
- Post in relevant community channels (if applicable)
- Update any consuming applications (e.g., HockeyGoTime)

## Related Resources

- **npm Package**: https://www.npmjs.com/package/@joerawr/pghl-mcp
- **Vercel Dashboard**: https://vercel.com/joe-rogers-projects/pghl-mcp
- **GitHub Repo**: https://github.com/joerawr/pghl-mcp
- **npm Docs**: https://docs.npmjs.com/
- **Vercel Docs**: https://vercel.com/docs
