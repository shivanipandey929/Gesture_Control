const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');

if (!fs.existsSync(enPath)) {
  console.error('Error: en.json does not exist in ' + localesDir);
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    if (k === '_machine_translated') continue;
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getAllKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const masterKeys = getAllKeys(en);
console.log(`\n==================================================`);
console.log(`i18n Multi-Language Diagnostics Report`);
console.log(`Total Master Keys (English): ${masterKeys.length}`);
console.log(`==================================================\n`);

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
let totalLangs = 0;
const langResults = [];

files.forEach(file => {
  totalLangs++;
  const langCode = path.basename(file, '.json');
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const currentKeys = new Set(getAllKeys(data));

  const missing = masterKeys.filter(k => !currentKeys.has(k));
  const coverage = Math.round(((masterKeys.length - missing.length) / masterKeys.length) * 100);

  langResults.push({
    code: langCode,
    totalKeys: currentKeys.size,
    coverage: `${coverage}%`,
    missingCount: missing.length,
    isMachineTranslated: Boolean(data._machine_translated),
  });
});

console.table(langResults.map(r => ({
  Language: r.code,
  Coverage: r.coverage,
  Missing: r.missingCount,
  ReviewNeeded: r.isMachineTranslated ? 'Yes (_machine_translated)' : 'Human Verified'
})));

console.log(`\nVerified ${totalLangs} languages in /src/locales`);

// ============================================================
// PART 2: HARDCODED JSX TEXT SCANNER
// Scans src/pages and src/components for hardcoded JSX text.
// Makes CI fail (process.exit(1)) if any page coverage < 100% or hardcoded > 0.
// ============================================================

console.log(`\n==================================================`);
console.log(`i18n JSX Hardcoded Text & Page Coverage Scanner`);
console.log(`==================================================\n`);

function scanJsxFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');

  // Strip multi-line comments /* ... */ and single-line // ...
  const cleanContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*/g, '$1');

  const hardcoded = [];

  // Count t('...') or t("...") calls
  const tMatches = cleanContent.match(/\bt\(\s*['"][^'"]+['"]/g) || [];
  const tCount = tMatches.length;

  // Search inside return blocks that return JSX
  const returnRegex = /return\s*\(\s*(<[\s\S]*?)\n\s*\);/g;
  let returnMatch;
  const jsxSnippets = [];
  while ((returnMatch = returnRegex.exec(cleanContent)) !== null) {
    jsxSnippets.push({ code: returnMatch[1], offset: returnMatch.index + returnMatch[0].indexOf(returnMatch[1]) });
  }

  for (const snippet of jsxSnippets) {
    // Strip JavaScript expressions inside { ... } before scanning for text nodes
    let strippedCode = snippet.code;
    let prev;
    do {
      prev = strippedCode;
      strippedCode = strippedCode.replace(/\{[^{}]*\}/g, '');
    } while (strippedCode !== prev);

    const regex = />([^<{}]+)</g;
    let m;
    while ((m = regex.exec(strippedCode)) !== null) {
      const raw = m[1];
      const txt = raw.trim();
      if (!txt) continue;
      // Ignore pure numbers, punctuation, icons, common entities
      if (/^[\d\s.,;:!?\-_+*\/\\%&@#$|()\[\]{}–—•→←↑↓➡️⬅️❤️💀✌️✋✊☝️👍👎👉👈☕🍚🍲🍜🍉🍎🍊🥭🍌💣🎈🎯✏️🤏⚔️⭐⏰⏱️🏆]+$/.test(txt)) continue;
      if (['&copy;', '&rarr;', '&larr;', '&quot;', '&apos;', 'OR', '✕', '✓', '•', '...', '01', '02', '03', 'Space', 'R', 'Esc', 'LIVE', 'X: %', 'Y: %'].includes(txt)) continue;
      // Ignore code artifact fragments
      if (txt.includes('=>') || txt.includes('return ') || txt.includes('const ') || txt.includes('useState')) continue;

      const fullIndex = snippet.offset + m.index;
      const line = cleanContent.substring(0, fullIndex).split('\n').length;
      hardcoded.push({ line, text: txt.replace(/\s+/g, ' ') });
    }
  }

  const total = tCount + hardcoded.length;
  const coverage = total === 0 ? 100 : Math.round((tCount / total) * 100);

  return {
    filePath: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
    tCount,
    hardcoded,
    coverage,
  };
}

const targetPages = [
  'src/pages/Landing.tsx',
  'src/pages/LiveStudio.tsx',
  'src/pages/ControlModesHub.tsx',
  'src/pages/workspaces/PresentationWorkspace.tsx',
  'src/pages/workspaces/MediaWorkspace.tsx',
  'src/pages/workspaces/ScrollWorkspace.tsx',
  'src/pages/workspaces/CursorWorkspace.tsx',
  'src/pages/Practice.tsx',
  'src/pages/KitchenMode.tsx',
  'src/pages/GestureChat.tsx',
  'src/pages/Analytics.tsx',
  'src/pages/ProfilePage.tsx',
  'src/pages/Onboarding.tsx',
  'src/pages/Help.tsx',
  'src/pages/Privacy.tsx',
  'src/pages/NotFound.tsx',
  'src/pages/OfflineFallback.tsx',
  'src/components/common/Navbar.tsx',
  'src/components/common/PipCamera.tsx',
];

const pageResults = targetPages.map(scanJsxFile).filter(Boolean);

console.table(pageResults.map(r => ({
  File: r.filePath,
  't() Calls': r.tCount,
  'Hardcoded': r.hardcoded.length,
  'Coverage': `${r.coverage}%`
})));

let hasHardcodedViolations = false;
pageResults.forEach(r => {
  if (r.hardcoded.length > 0 || r.coverage < 100) {
    hasHardcodedViolations = true;
    console.error(`\n❌ i18n violation in ${r.filePath} (Coverage: ${r.coverage}%, Hardcoded items: ${r.hardcoded.length}):`);
    r.hardcoded.forEach(h => console.error(`  Line ${h.line}: "${h.text}"`));
  }
});

if (hasHardcodedViolations) {
  console.error('\n❌ CI Failed: Hardcoded JSX text found or coverage < 100%. Move all text into translation keys.');
  process.exit(1);
} else {
  console.log('\n✅ All target pages and components achieved 100% i18n coverage with 0 hardcoded strings!');
}
