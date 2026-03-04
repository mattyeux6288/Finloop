import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

const server = await createServer({
  configFile: resolve(__dirname, 'vite.config.ts'),
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});

await server.listen();
server.printUrls();
