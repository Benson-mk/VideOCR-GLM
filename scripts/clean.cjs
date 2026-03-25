const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const directoriesToDelete = [
  'dist',
  'dist-electron',
  'frontend/dist',
  'backend/dist',
  'VideOCR-GLM-CLI/build',
  'VideOCR-GLM-CLI/dist',
  'VideOCR-GLM-CLI/__pycache__'
];

function deleteDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`[OK] Skipping (not found): ${dirPath}`);
    return;
  }

  try {
    // Use rimraf for directories
    execSync(`npx rimraf "${dirPath}"`, { stdio: 'inherit' });
    console.log(`[OK] Deleted: ${dirPath}`);
  } catch (error) {
    console.error(`[ERROR] Failed to delete ${dirPath}:`, error.message);
  }
}

function deleteFilesByExtension(rootDir, extensions) {
  if (!fs.existsSync(rootDir)) {
    console.log(`[OK] Skipping (not found): ${rootDir}`);
    return;
  }

  let deletedCount = 0;

  function walkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip __pycache__ directories as they're handled separately
        if (file !== '__pycache__') {
          walkDirectory(filePath);
        }
      } else {
        // Check if file matches any of the extensions
        const ext = path.extname(file);
        if (extensions.includes(ext)) {
          try {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log(`  [OK] Deleted: ${filePath}`);
          } catch (error) {
            console.error(`  [ERROR] Failed to delete ${filePath}:`, error.message);
          }
        }
      }
    }
  }

  walkDirectory(rootDir);
  
  if (deletedCount === 0) {
    console.log(`[OK] No files found with extensions: ${extensions.join(', ')} in ${rootDir}`);
  } else {
    console.log(`[OK] Deleted ${deletedCount} file(s) with extensions: ${extensions.join(', ')} in ${rootDir}`);
  }
}

function deleteDirectoriesByPattern(rootDir, pattern) {
  if (!fs.existsSync(rootDir)) {
    console.log(`[OK] Skipping (not found): ${rootDir}`);
    return;
  }

  let deletedCount = 0;

  function walkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Check if directory name matches the pattern
        if (file.endsWith(pattern)) {
          try {
            execSync(`npx rimraf "${filePath}"`, { stdio: 'inherit' });
            deletedCount++;
            console.log(`  [OK] Deleted directory: ${filePath}`);
          } catch (error) {
            console.error(`  [ERROR] Failed to delete ${filePath}:`, error.message);
          }
        } else {
          walkDirectory(filePath);
        }
      }
    }
  }

  walkDirectory(rootDir);
  
  if (deletedCount === 0) {
    console.log(`[OK] No directories found ending with: ${pattern} in ${rootDir}`);
  } else {
    console.log(`[OK] Deleted ${deletedCount} director(ies) ending with: ${pattern} in ${rootDir}`);
  }
}

console.log('Cleaning build artifacts...\n');

// Delete directories
directoriesToDelete.forEach(deleteDirectory);

// Delete Python cache files (.pyc)
console.log('\nDeleting Python cache files (.pyc)...');
deleteFilesByExtension('VideOCR-GLM-CLI', ['.pyc']);

// Delete Python egg-info directories
console.log('\nDeleting Python egg-info directories...');
deleteDirectoriesByPattern('VideOCR-GLM-CLI', '.egg-info');

console.log('\n[OK] Clean completed!');
