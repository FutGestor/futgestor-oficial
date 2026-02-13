---
name: deploy-lovable
description: Use this skill when deploying, building, or troubleshooting projects on the Lovable platform. Triggers include mentions of Lovable deploy, build errors on Lovable, environment variables in Lovable, custom domain setup, or preparing a project for Lovable deployment.
---

# Deploy to Lovable

## Pre-Deploy Checklist

Before deploying to Lovable, verify:

1. **Environment Variables**: All required env vars are set in Lovable dashboard
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Any other `VITE_*` prefixed variables

2. **Build Check**: Run locally first
   ```bash
   npm run build
   ```
   Fix any TypeScript errors or missing imports.

3. **Dependencies**: Ensure `package.json` has all dependencies (not devDependencies for runtime needs)

4. **Routes**: Verify all routes work with client-side routing (SPA mode)

## Common Build Errors on Lovable

### TypeScript Errors
```
Type error: Property 'x' does not exist on type 'y'
```
**Fix**: Add proper type definitions. Use `as` casting only as last resort.

### Missing Module
```
Module not found: Can't resolve '@/components/...'
```
**Fix**: Check import paths. Lovable uses `@/` alias for `src/`.

### Env Variables Undefined
```
VITE_SUPABASE_URL is undefined
```
**Fix**: All client-side env vars MUST be prefixed with `VITE_`. Set them in Lovable dashboard.

## Instructions

1. Run `npm run build` locally and fix all errors
2. Verify environment variables are configured in Lovable
3. Push changes to trigger auto-deploy
4. Check deploy logs for errors
5. Test the deployed version on mobile and desktop

## Constraints

- Never hardcode API keys or URLs - always use environment variables
- Never use `process.env` - use `import.meta.env` for Vite projects
- All env vars exposed to client must start with `VITE_`
