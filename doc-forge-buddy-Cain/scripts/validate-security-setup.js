#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating Security Setup...\n');

// Files that should exist
const requiredFiles = [
  '.snyk',
  '.snyk.json',
  'scripts/security-scanner.js',
  'scripts/security-scanner.ts',
  '.github/workflows/security.yml',
  '.github/dependabot.yml',
  'src/components/SecurityDashboard.tsx'
];

// Check if files exist
console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const securityScripts = [
    'security:audit',
    'security:fix',
    'security:full-audit',
    'security:check-snyk',
    'security:snyk-monitor',
    'security:update',
    'security:scan',
    'security:report'
  ];
  
  securityScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`  ✅ ${script}: ${packageJson.scripts[script]}`);
    } else {
      console.log(`  ❌ ${script} - MISSING`);
      allFilesExist = false;
    }
  });
  
  // Check for security dependencies
  const requiredDeps = ['snyk', '@snyk/protect', 'license-checker'];
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  console.log('\n🔧 Checking security dependencies...');
  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`  ✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`  ⚠️  ${dep} - not found (optional)`);
    }
  });
} catch (error) {
  console.log(`  ❌ Error reading package.json: ${error.message}`);
  allFilesExist = false;
}

// Check GitHub Actions configuration
console.log('\n⚙️  Checking GitHub Actions workflow...');
try {
  const workflowPath = '.github/workflows/security.yml';
  if (fs.existsSync(workflowPath)) {
    const workflow = fs.readFileSync(workflowPath, 'utf8');
    
    // Check for key sections
    const keySections = [
      'npm audit',
      'snyk',
      'security-scanner',
      'upload-artifact',
      'pull_request'
    ];
    
    keySections.forEach(section => {
      if (workflow.includes(section)) {
        console.log(`  ✅ Contains: ${section}`);
      } else {
        console.log(`  ⚠️  Missing: ${section}`);
      }
    });
  }
} catch (error) {
  console.log(`  ❌ Error checking workflow: ${error.message}`);
}

// Check Dependabot configuration
console.log('\n🤖 Checking Dependabot configuration...');
try {
  const dependabotPath = '.github/dependabot.yml';
  if (fs.existsSync(dependabotPath)) {
    const dependabot = fs.readFileSync(dependabotPath, 'utf8');
    
    const keySections = [
      'package-ecosystem',
      'npm',
      'github-actions',
      'schedule',
      'reviewers'
    ];
    
    keySections.forEach(section => {
      if (dependabot.includes(section)) {
        console.log(`  ✅ Contains: ${section}`);
      } else {
        console.log(`  ⚠️  Missing: ${section}`);
      }
    });
  }
} catch (error) {
  console.log(`  ❌ Error checking dependabot: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 Security setup validation PASSED!');
  console.log('\nNext steps:');
  console.log('1. Set SNYK_TOKEN secret in GitHub repository');
  console.log('2. Install security dependencies: npm install');
  console.log('3. Test the setup: npm run security:scan');
  console.log('4. Configure team members as reviewers in .github/dependabot.yml');
} else {
  console.log('⚠️  Security setup validation completed with issues');
  console.log('Please review the missing items above and fix them.');
}

console.log('\n📚 Available commands:');
console.log('  npm run security:scan      - Run full security scan');
console.log('  npm run security:audit     - Run npm audit');
console.log('  npm run security:fix       - Fix vulnerabilities');
console.log('  npm run security:check-snyk - Run Snyk scan');
console.log('  npm run security:report    - Generate security report');
