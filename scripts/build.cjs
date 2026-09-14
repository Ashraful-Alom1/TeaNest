const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

console.log('🚀 [Production Build] Starting Unified Platform-Independent Build...');

// 1. Run production build for both apps
console.log('📦 [1/4] Building admin and storefront packages...');
execSync('npm run build:apps', { cwd: rootDir, stdio: 'inherit' });

const storefrontDist = path.resolve(rootDir, 'apps/storefront/dist');
const adminDist = path.resolve(rootDir, 'apps/admin/dist');
const targetDist = path.resolve(rootDir, 'dist');

// 2. Prepare unified dist folder
console.log('📂 [2/4] Assembling unified distribution folder at /dist ...');
if (fs.existsSync(targetDist)) {
  fs.rmSync(targetDist, { recursive: true, force: true });
}
fs.mkdirSync(targetDist, { recursive: true });

// Copy directory recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('🌐 [3/4] Copying Storefront and Admin assets...');
copyDir(storefrontDist, targetDist);

// Copy admin build to /dist/admin
const adminTarget = path.join(targetDist, 'admin');
copyDir(adminDist, adminTarget);

// 3. Platform-independent SPA routing fallbacks (works on any static/React hosting provider)
console.log('🔀 [4/4] Generating universal platform-independent SPA routing fallbacks...');

// Universal 404 & 200 fallbacks for GitHub Pages, Surge, AWS S3, Vercel, etc.
const storefrontIndexHtml = path.join(targetDist, 'index.html');
if (fs.existsSync(storefrontIndexHtml)) {
  fs.copyFileSync(storefrontIndexHtml, path.join(targetDist, '404.html'));
  fs.copyFileSync(storefrontIndexHtml, path.join(targetDist, '200.html'));
}

const adminIndexHtml = path.join(adminTarget, 'index.html');
if (fs.existsSync(adminIndexHtml)) {
  fs.copyFileSync(adminIndexHtml, path.join(adminTarget, '404.html'));
}

// Universal SPA redirects file inside dist (supported by Netlify, Cloudflare Pages, Render)
const redirectsContent = `# Universal Single Page Application (SPA) Routing Rules
# 1. Admin ERP Console Route
/admin/*    /admin/index.html   200

# 2. Storefront Client Route
/*          /index.html         200
`;
fs.writeFileSync(path.join(targetDist, '_redirects'), redirectsContent, 'utf8');

console.log('✅ [Production Build] Successfully generated universal production build!');
console.log('   - Storefront Entry: /dist/index.html');
console.log('   - Admin ERP Entry:  /dist/admin/index.html');
console.log('   - Universal Fallbacks: /dist/404.html, /dist/200.html, /dist/_redirects');
console.log('   - Compatible with ANY React / static hosting provider (Build: npm run build | Publish: dist)');
