const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

console.log('🚀 [Netlify Build] Starting Tea Nest Unified Production Build...');

// 1. Run production build for both apps
console.log('📦 [1/4] Building admin and storefront packages...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

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

// 3. Write Netlify SPA redirects file
console.log('🔀 [4/4] Writing Netlify SPA redirect rules (_redirects)...');
const redirectsContent = `# Netlify Single Page Application (SPA) Routing Rules
# 1. Admin ERP Console Route
/admin/*    /admin/index.html   200

# 2. Storefront Client Route
/*          /index.html         200
`;

fs.writeFileSync(path.join(targetDist, '_redirects'), redirectsContent, 'utf8');

console.log('✅ [Netlify Build] Successfully generated unified production build!');
console.log('   - Storefront Entry: /dist/index.html');
console.log('   - Admin ERP Entry:  /dist/admin/index.html');
console.log('   - Netlify Routing:  /dist/_redirects');
