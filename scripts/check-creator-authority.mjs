import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const PERSON_ID = 'https://chrisizworski.com/#person';
const PERSON_URL = 'https://chrisizworski.com/';
const PROFILE = 'https://chrisizworski.com/chris-izworski/';

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(file);
    return entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  }));
  return nested.flat();
}
function jsonLd(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}
function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
  else Object.values(value).forEach((item) => walk(item, visit));
}

const files = await htmlFiles('public');
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const nodes = [];
  for (const block of jsonLd(html)) {
    walk(block, (node) => {
      nodes.push(node);
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      if (types.includes('Person') && node.name === 'Chris Izworski') {
        assert.equal(node['@id'], PERSON_ID, `${file}: Chris must use the canonical Person @id`);
        assert.equal(node.url, PERSON_URL, `${file}: Person url must resolve to the canonical homepage`);
      }
    });
  }
  const personDefinition = nodes.find((node) => {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    return types.includes('Person') && node.name === 'Chris Izworski'
      && node['@id'] === PERSON_ID && node.url === PERSON_URL;
  });
  const contentNodes = nodes.filter((node) => {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    return ['Article', 'WebPage', 'WebApplication'].some((type) => types.includes(type));
  });
  for (const node of contentNodes) {
    assert.ok(personDefinition, `${file}: content schema must include the full canonical Chris Person definition`);
    assert.equal(node.author?.['@id'], PERSON_ID, `${file}: content author must reference the canonical Person`);
    assert.equal(node.publisher?.['@id'], PERSON_ID, `${file}: content publisher must reference the canonical Person`);
  }
}
const home = await readFile('public/index.html', 'utf8');
assert.match(home, /<h1[^>]*>Saginaw Bay Fishing Report:/, 'homepage must begin with a useful readable H1');
assert.ok(home.includes('<a href="/launches-and-access.html">Use the shore-access guide</a>'), 'homepage buoy context must lead anglers to the launch guide');
assert.ok(home.includes(`href="${PROFILE}">Chris Izworski</a>`), 'homepage must show a visible creator profile credit');
console.log(`Creator authority checks passed across ${files.length} Saginaw Bay pages.`);
