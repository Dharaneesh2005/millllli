// Simple build script for Vercel deployment
console.log('Starting Vercel build process...');

// Run the frontend build first
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
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

  // Copy TypeScript definitions to client directory if needed
  console.log('Ensuring client directory has TypeScript definitions...');
  const clientDir = path.join(process.cwd(), 'client');
  const clientPackageJsonPath = path.join(clientDir, 'package.json');
  
  if (fs.existsSync(clientDir)) {
    if (!fs.existsSync(clientPackageJsonPath)) {
      // Create a basic package.json in client directory
      const clientPackageJson = {
        name: "millikit-client",
        version: "1.0.0",
        private: true,
        dependencies: {},
        devDependencies: {}
      };
      
      // Add required type dependencies
      requiredTypeDeps.forEach(dep => {
        clientPackageJson.devDependencies[dep] = packageJson.devDependencies[dep] || "latest";
      });
      
      // Write the package.json to client directory
      fs.writeFileSync(clientPackageJsonPath, JSON.stringify(clientPackageJson, null, 2));
      console.log('Created package.json in client directory with TypeScript dependencies');
    } else {
      // Update existing package.json in client directory
      const clientPackageJson = JSON.parse(fs.readFileSync(clientPackageJsonPath, 'utf8'));
      clientPackageJson.devDependencies = clientPackageJson.devDependencies || {};
      
      let updated = false;
      requiredTypeDeps.forEach(dep => {
        if (!clientPackageJson.devDependencies[dep]) {
          clientPackageJson.devDependencies[dep] = packageJson.devDependencies[dep] || "latest";
          updated = true;
        }
      });
      
      if (updated) {
        fs.writeFileSync(clientPackageJsonPath, JSON.stringify(clientPackageJson, null, 2));
        console.log('Updated package.json in client directory with TypeScript dependencies');
      }
    }
  }
  
  console.log('Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('Frontend build completed successfully.');

  // Create a .vercel/output/static directory if it doesn't exist
  const outputDir = path.join(process.cwd(), '.vercel', 'output', 'static');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
  }

  // Copy the dist directory to .vercel/output/static
  console.log('Copying build files to output directory...');
  execSync(`cp -r dist/* ${outputDir}/`, { stdio: 'inherit' });
  console.log('Build files copied successfully.');

  console.log('Vercel build completed successfully!');
} catch (error) {
  console.error('Build error:', error);
  process.exit(1);
}