// Dev runner: starts Vite dev server, then Electron pointed at it (hot reload).
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const vite = await createServer({ configFile: 'vite.config.mjs' });
await vite.listen();
const url = `http://localhost:${vite.config.server.port}`;
console.log(`[dev] vite ready at ${url}`);

const electron = spawn('../../node_modules/.bin/electron', ['.'], {
  stdio: 'inherit',
  env: { ...process.env, VCORV_DEV_URL: url }
});
electron.on('exit', async (code) => {
  await vite.close();
  process.exit(code ?? 0);
});
