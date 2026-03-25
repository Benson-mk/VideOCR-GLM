const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'node_modules');
const targetDir = path.join(__dirname, '..', 'dist-electron', 'win-unpacked', 'resources', 'app', 'node_modules');

// Backend dependencies to copy
const dependencies = [
  'cors',
  'express',
  'iconv-lite',
  'multer',
  'uuid',
  'ws',
  // Express dependencies
  'accepts',
  'array-flatten',
  'body-parser',
  'content-disposition',
  'content-type',
  'cookie',
  'cookie-signature',
  'debug',
  'depd',
  'encodeurl',
  'escape-html',
  'etag',
  'finalhandler',
  'fresh',
  'http-errors',
  'media-typer',
  'merge-descriptors',
  'methods',
  'mime',
  'mime-db',
  'mime-types',
  'ms',
  'negotiator',
  'on-finished',
  'parseurl',
  'path-to-regexp',
  'proxy-addr',
  'qs',
  'range-parser',
  'raw-body',
  'safe-buffer',
  'send',
  'serve-static',
  'setprototypeof',
  'statuses',
  'type-is',
  'utils-merge',
  'vary'
];

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

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

console.log('Copying backend dependencies to build...');

for (const dep of dependencies) {
  const srcPath = path.join(sourceDir, dep);
  const destPath = path.join(targetDir, dep);

  if (fs.existsSync(srcPath)) {
    console.log(`Copying ${dep}...`);
    copyDir(srcPath, destPath);
  } else {
    console.warn(`Warning: ${dep} not found in node_modules`);
  }
}

console.log('Dependencies copied successfully!');