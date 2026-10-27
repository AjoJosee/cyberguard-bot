import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const apiDir = path.join(rootDir, 'app', 'api');
const apiBackupDir = path.join(rootDir, 'app', '_api_backup');
const outDir = path.join(rootDir, 'out');

console.log('🚀 Preparing GitHub Pages static export...');

let apiMoved = false;
try {
  if (fs.existsSync(apiDir)) {
    console.log('📦 Temporarily moving app/api for static export...');
    fs.renameSync(apiDir, apiBackupDir);
    apiMoved = true;
  }

  console.log('⚡ Running next build with DEPLOY_TARGET=gh-pages...');
  execSync('npx next build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      DEPLOY_TARGET: 'gh-pages',
    },
  });

  // Create .nojekyll in out/ to prevent GitHub Pages from ignoring _next directory
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  console.log('✓ Created .nojekyll in out/');

  // Copy index.html to 404.html for SPA routing fallback on GitHub Pages
  const indexPath = path.join(outDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, path.join(outDir, '404.html'));
    console.log('✓ Created 404.html fallback in out/');
  }

  console.log('🎉 GitHub Pages export ready in out/ directory!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} finally {
  if (apiMoved && fs.existsSync(apiBackupDir)) {
    console.log('🔄 Restoring app/api directory...');
    fs.renameSync(apiBackupDir, apiDir);
  }
}
