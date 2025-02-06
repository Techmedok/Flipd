## Run Code
node server.js

## Update the version in package.json using npm:
### Patch update (e.g., 1.0.0 → 1.0.1)
npm version patch

### Minor update (e.g., 1.0.0 → 1.1.0)
npm version minor

### Major update (e.g., 1.0.0 → 2.0.0)
npm version major

## Find Unused Packages
depcheck

## Use npm prune to Auto-Clean
npm prune
This removes packages in node_modules that aren’t in package.json.

