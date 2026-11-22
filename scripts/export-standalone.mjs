// One portable HTML file, usable without Flask, Node or a local HTTP server.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(resolve(root, file), 'utf8');
const target = resolve(process.argv[2] || resolve(root, 'dist/rustellata.html'));
let html = await read('templates/index.html');
const css = await read('static/planner.css');
const favicon = Buffer.from(await read('static/favicon.svg')).toString('base64');
const engine = (await read('static/planner-engine.js')).replace(/^export /gm, '');
const ui = (await read('static/planner.js')).replace(/^import .*?;\s*/s, '');
const script = `const {DEFAULT_PLAN, PRODUCTS, GRILLS, calculatePlan, buildShoppingText} = (() => {\n${engine}\nreturn {DEFAULT_PLAN, PRODUCTS, GRILLS, calculatePlan, buildShoppingText};\n})();\n${ui}`;
html = html.replace('<link rel="stylesheet" href="/static/planner.css">', `<style>\n${css}\n</style>`)
  .replace(/<script type="module" src="\/static\/planner\.js(?:\?[^\"]*)?"><\/script>/, () => `<script type="module">\n${script}\n</script>`)
  .replace('href="/static/favicon.svg"', `href="data:image/svg+xml;base64,${favicon}"`)
  .replaceAll('href="/"', 'href="#"');
await mkdir(dirname(target), { recursive: true });
await writeFile(target, html, 'utf8');
console.log(`Standalone planner exported: ${target}`);
