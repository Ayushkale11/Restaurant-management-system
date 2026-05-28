import { spawn } from 'child_process';

console.log(' Gypsy dev helper: Starting both dev servers...\n');

// Spawn Customer Menu Server on default config (Port 5174)
const menu = spawn('npx', ['vite', '--host'], { 
  shell: true, 
  stdio: 'inherit' 
});

// Spawn Owner Dashboard Server on custom dashboard config (Port 5175)
const dashboard = spawn('npx', ['vite', '--config', 'vite.dashboard.config.ts', '--port', '5175', '--host'], { 
  shell: true, 
  stdio: 'inherit' 
});

// Handle termination signals cleanly
const cleanup = () => {
  console.log('\nStopping servers...');
  menu.kill();
  dashboard.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
