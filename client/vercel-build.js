// Custom build script for Vercel deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running custom Vercel build script...');

// Ensure we're in the client directory
const currentDir = process.cwd();
console.log(`Current directory: ${currentDir}`);

// Check if we need to install TypeScript dependencies
const requiredTypeDeps = [
  '@types/react',
  '@types/react-dom',
  '@types/node'
];

try {
  // Ensure all required TypeScript type definitions are installed
  console.log('Checking TypeScript dependencies...');
  
  // First check if package.json exists and read it
  const packageJsonPath = path.join(currentDir, 'package.json');
  let packageJson = {};
  
  if (fs.existsSync(packageJsonPath)) {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } else {
    // Create a basic package.json if it doesn't exist
    packageJson = {
      name: "millikit-client",
      version: "1.0.0",
      private: true,
      dependencies: {},
      devDependencies: {}
    };
    
    // We'll write it after adding the dependencies
  }
  
  // Combine both dependencies and devDependencies for checking
  const allDeps = {
    ...packageJson.dependencies || {},
    ...packageJson.devDependencies || {}
  };
  
  // Check which type dependencies are missing
  const missingDeps = requiredTypeDeps.filter(dep => !allDeps[dep]);
  
  if (missingDeps.length > 0) {
    console.log(`Installing missing TypeScript dependencies: ${missingDeps.join(', ')}`);
    
    // Install missing dependencies
    execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    console.log('TypeScript dependencies installed successfully');
  } else {
    console.log('All required TypeScript dependencies are already installed');
  }
  
  // Write updated package.json if we created one
  if (!fs.existsSync(packageJsonPath)) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
  
  // Run the Next.js build process
  console.log('Building Next.js application...');
  execSync('next build', { stdio: 'inherit' });
  
  // Verify the build output directory exists
  const distDir = path.join(currentDir, 'dist');
  if (fs.existsSync(distDir)) {
    console.log(`Build successful! Output directory: ${distDir}`);
  } else {
    console.error(`Error: Build directory ${distDir} not found`);
    process.exit(1);
  }
  
  // Additional post-build steps can be added here
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}