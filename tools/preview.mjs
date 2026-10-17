// Builds preview/PureTech-preview.html: the real PureTech page, runnable from a
// local file with no Google account. Run after any change to apps-script/:
//
//   node tools/preview.mjs          (add --open to open it in the browser)
//
// Open it with ?section=scheduling on the end to start on Scheduling.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = name => readFileSync(join(root, 'apps-script', name), 'utf8');

const server = ['Main.gs', 'Code.gs', 'Schedule.gs'].map(src).join('\n');
const fake = readFileSync(join(root, 'tools', 'preview-fake.js'), 'utf8').replace('/* SERVER_CODE */', () => server);

const banner = `<div style="background:#fff4d6;color:#5c3d00;font:15px/1.4 system-ui,sans-serif;padding:6px 16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center">
  <b>PREVIEW</b><span>Demo data only — nothing here reaches Google. Parts to try in Returns: CH8115, BP4471.</span>
  <button onclick="PureTechPreview.reset()" style="margin-left:auto;font:inherit;padding:2px 10px;border:1px solid #5c3d00;border-radius:6px;background:none;cursor:pointer">Reset demo data</button>
</div>`;

// Do what Apps Script does to Index.html: fill in the section and paste in the included files.
let page = src('Index.html')
  .replace('<body data-section="<?= section ?>">', () => '<body data-section="returns">\n'
    + "<script>if (/[?&]section=scheduling/.test(location.search)) document.body.dataset.section = 'scheduling';</script>\n" + banner)
  .replace(/<\?!= include_\('(\w+)'\) \?>/g, (m, name) => src(name + '.html'));
if (page.includes('<?')) throw new Error('Index.html has a <? ?> tag the preview does not know how to fill in.');
page = page.replace('<script>', () => '<script>\n' + fake + '\n</script>\n<script>');

const out = join(root, 'preview', 'PureTech-preview.html');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, page);
console.log('Preview written to ' + out);
if (process.argv.includes('--open')) execFileSync('open', [out]);
