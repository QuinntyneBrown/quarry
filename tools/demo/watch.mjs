import { resolve, join } from 'node:path';
import { startDisplay } from './harness.mjs';
const display = await startDisplay({ mediaDir: join(resolve(process.argv[2]), 'staging') });
for (const slug of ['quarry-indexing-worker', 'quarry-api', 'quarry', 'quarry-previews']) console.log(`${slug}: ${display.url}/watch?video=${slug}`);
const shutdown = async () => { await display.close(); process.exit(); };
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
setTimeout(shutdown, 20 * 60_000);
