// Start the web app on the built-in sample events, whatever .env.local says.
// Shell variables win over .env files in Expo, so a stale local Supabase setting
// (data source "supabase" with no database running) cannot empty the Discover list.
// Usage: npm run web:sample [-- --port 8083]
import { spawn } from 'node:child_process';

const env = { ...process.env, EXPO_PUBLIC_MOVA_DATA_SOURCE: 'sample' };
const args = ['expo', 'start', '--web', ...process.argv.slice(2)];
const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 0));
