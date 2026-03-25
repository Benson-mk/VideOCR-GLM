import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const rcedit = require('rcedit').default || require('rcedit');

/**
 * Inject icon into Windows executable
 * This script is called by electron-builder's afterPack hook
 */

export default async function(context) {
  const iconPath = path.join(__dirname, '../assets/icon.ico');
  
  // Check if icon file exists
  if (!fs.existsSync(iconPath)) {
    console.error('[Icon Injection] ERROR: Icon file not found:', iconPath);
    throw new Error('Icon file not found');
  }
  
  console.log('[Icon Injection] Starting icon injection...');
  console.log('[Icon Injection] Icon file:', iconPath);
  
  // Get the executable path from electron-builder context
  const appOutDir = context.appOutDir;
  
  if (!appOutDir) {
    console.error('[Icon Injection] ERROR: No appOutDir provided');
    throw new Error('No appOutDir provided');
  }
  
  const executablePath = path.join(appOutDir, 'VideOCR-GLM.exe');
  
  console.log('[Icon Injection] Executable path:', executablePath);
  
  // Check if executable exists
  if (!fs.existsSync(executablePath)) {
    console.error('[Icon Injection] ERROR: Executable not found:', executablePath);
    throw new Error('Executable not found');
  }
  
  try {
    console.log('[Icon Injection] Injecting icon into executable...');
    
    await rcedit(executablePath, {
      icon: iconPath
    });
    
    console.log('[Icon Injection] ✓ Icon successfully injected!');
    console.log('[Icon Injection] ✓ Executable:', executablePath);
  } catch (error) {
    console.error('[Icon Injection] ERROR: Failed to inject icon:', error.message);
    console.error('[Icon Injection] Stack:', error.stack);
    throw error;
  }
}