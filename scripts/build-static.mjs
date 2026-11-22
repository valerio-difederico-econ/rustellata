// The planner is browser-local: the same source works with Flask and static hosting.
import { mkdir, readFile, copyFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
await mkdir(resolve(output, 'static'), { recursive: true });
const html = await readFile(resolve(root, 'templates/index.html'), 'utf8');
if (html.includes('{{') || html.includes('{%')) {
  throw new Error('The static planner template must not contain Jinja expressions.');
}
await writeFile(resolve(output, 'index.html'), html, 'utf8');
for (const file of ['planner.js', 'planner-engine.js', 'planner.css', 'favicon.svg']) {
  await copyFile(resolve(root, 'static', file), resolve(output, 'static', file));
}
console.log(`Static planner prepared: ${output}`);
