// Real-bodies gate (docs/00 P13): every Moon, Earth and planet on screen is drawn from a real map, never by hand.
// The CEO caught a hand-drawn Moon ("the craters look weird") and Earth ("weird shape, continents misplaced") on the
// File 002 thumbnails. From now on:
//   1. any component named like a body (Earth, Moon…, Planet, Venus, Jupiter, Mars, Saturn, Mercury, World, Globe)
//      must render a real source: <Body> (src/fx/bodies.tsx), <PhotoGlobe>, <Globe> (Natural Earth outlines) or <MoonDisc>;
//   2. every baked texture the code asks for exists in public/bodies/ (scripts/bake_bodies.py makes them);
//   3. the CEO's second note: "the real image looks odd with the animation". Bodies are real geography drawn in the show's
//      flat style: every texture in public/bodies and public/toon must be the one scripts/bake_bodies.py made (sha256 in
//      public/bodies/manifest.json, style "toon", at most 8 flat colours per map), and no source file may point at the
//      raw photo maps (public/earth/*.jpg, public/planets/*) — those are only the bake's input;
//   4. the gate tests itself on a planted hand-drawn Earth, an inline Moon and a photo texture, and must catch each.
// Usage: npx tsx scripts/real-bodies.ts   (check-episode runs it for every episode)
import {createHash} from 'node:crypto';
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {ROOT} from './load-episode';

const NAME = /^(Earth|Moon|Planet|Venus|Jupiter|Mars|Saturn|Mercury|Neptune|Uranus|World|Globe)[A-Za-z]*$/;
const NOT_A_BODY = /(Scene|Thumbnail|Threads|Tag|Label|Lab|View|Card|Kit|Map|Orbit)$/;
const REAL = /<(Body|PhotoGlobe|Globe|MoonDisc)\b/;

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
  });

/** Component definitions in one source text: name → its body (to the next top-level definition). */
const components = (src: string) => {
  const re = /^(?:export )?const ([A-Z][A-Za-z0-9]*)\s*:\s*React\.FC[^=]*=/gm;
  const hits = [...src.matchAll(re)];
  return hits.map((m, i) => ({name: m[1], body: src.slice(m.index!, i + 1 < hits.length ? hits[i + 1].index : src.length)}));
};

export const scanSource = (src: string, where: string): string[] => {
  const errors: string[] = [];
  if (where.endsWith('fx/bodies.tsx') || where.endsWith('fx/PhotoGlobe.tsx') || where.endsWith('fx/globe.tsx')) return errors;
  for (const c of components(src)) {
    if (!NAME.test(c.name) || NOT_A_BODY.test(c.name)) continue;
    if (!REAL.test(c.body)) errors.push(`Real bodies: ${where} defines <${c.name}> without a real map (use <Body> from src/fx/bodies.tsx, <PhotoGlobe> or <Globe>) (docs/00 P13)`);
  }
  // inline drawings: a comment or label naming a body, followed within 4 lines by hand-drawn circles and no real map
  const lines = src.split('\n');
  lines.forEach((l, i) => {
    if (!/(\/\/|\{\/\*|text=|t=).*\b(the moon|moon|earth|planet|jupiter|venus|mars|saturn|mercury)\b/i.test(l)) return;
    const next = lines.slice(i, i + 5).join('\n');
    const near = lines.slice(Math.max(0, i - 3), i + 5).join('\n');
    if (/<circle\b/.test(next) && !REAL.test(near) && /\b(moon|earth|planet)\b/i.test(l.match(/\/\/.*|\{\/\*.*/)?.[0] ?? '')) errors.push(`Real bodies: ${where}:${i + 1} draws "${l.trim().slice(0, 60)}" by hand (use <Body>) (docs/00 P13)`);
  });
  // raw photo maps are bake input only: on screen, bodies are drawn in the show's style
  for (const m of src.matchAll(/(earth\/(day|night|clouds)\.jpg|planets\/[a-z]+\.jpg|`earth\/\$\{)/g)) errors.push(`Real bodies: ${where} uses the photo map "${m[1]}" on screen; use the toon maps (public/toon, src/fx/bodies.tsx) (docs/00 P13)`);
  for (const m of src.matchAll(/<Body[^>]*name="([a-z-]+)"/g)) {
    if (!existsSync(join(ROOT, 'public', 'bodies', `${m[1]}.png`))) errors.push(`Real bodies: ${where} asks for public/bodies/${m[1]}.png, which is not baked (run scripts/bake_bodies.py)`);
  }
  return errors;
};

export const checkRealBodies = () => {
  const errors: string[] = [];
  // self-test: a planted hand-drawn Earth must be caught, a real one must pass
  const planted = `const Earth: React.FC<{x: number}> = ({x}) => (\n  <circle cx={x} r={40} fill="#2E6FA8" />\n);\n`;
  const real = `const Earth: React.FC<{x: number}> = ({x}) => (\n  <Body name="earth-atlantic" x={x} y={0} r={40} />\n);\n`;
  if (!scanSource(planted, 'selftest.tsx').length) errors.push('Real bodies: the gate missed a planted hand-drawn Earth (gate broken)');
  const inline = `<g>\n  {/* the Moon */}\n  <circle r={60} fill="#D8D4CC" />\n</g>\n`;
  if (!scanSource(inline, 'selftest.tsx').length) errors.push('Real bodies: the gate missed a planted inline hand-drawn Moon (gate broken)');
  if (scanSource(real, 'selftest.tsx').length) errors.push('Real bodies: the gate rejected a real Earth (gate broken)');
  const photo = 'img.src = staticFile(`earth/day.jpg`);\n';
  if (!scanSource(photo, 'selftest.tsx').length) errors.push('Real bodies: the gate missed a planted photo texture (gate broken)');
  // every baked texture is the bake's own output, in the show's flat style
  const manPath = join(ROOT, 'public', 'bodies', 'manifest.json');
  if (!existsSync(manPath)) errors.push('Real bodies: public/bodies/manifest.json missing (run scripts/bake_bodies.py)');
  else {
    const man = JSON.parse(readFileSync(manPath, 'utf8')) as {style: string; files: Record<string, {sha256: string; colours?: number}>};
    if (man.style !== 'toon') errors.push('Real bodies: the bodies are not baked in the show style (manifest style is not "toon")');
    for (const [rel, info] of Object.entries(man.files)) {
      const p = join(ROOT, 'public', rel);
      if (!existsSync(p)) errors.push(`Real bodies: ${rel} is in the manifest but missing`);
      else if (createHash('sha256').update(readFileSync(p)).digest('hex') !== info.sha256) errors.push(`Real bodies: public/${rel} is not the baked toon texture (changed by hand?); re-run scripts/bake_bodies.py`);
      if (info.colours !== undefined && info.colours > 8) errors.push(`Real bodies: ${rel} has ${info.colours} colours; a toon map has at most 8 flat colours`);
    }
    for (const dir of ['bodies', 'toon'])
      for (const f of existsSync(join(ROOT, 'public', dir)) ? readdirSync(join(ROOT, 'public', dir)) : [])
        if (f.endsWith('.png') && !man.files[`${dir}/${f}`]) errors.push(`Real bodies: public/${dir}/${f} was not made by the bake (not in the manifest)`);
  }
  let n = 0;
  for (const f of files(join(ROOT, 'src'))) {
    n++;
    errors.push(...scanSource(readFileSync(f, 'utf8'), relative(ROOT, f)));
  }
  return {errors, files: n};
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const {errors, files: n} = checkRealBodies();
  for (const e of errors) console.log(`  ✖ ${e}`);
  console.log(errors.length ? `${errors.length} problem(s)` : `✔ real bodies: ${n} source files, every Moon, Earth and planet from a real map, drawn in the show's style`);
  process.exit(errors.length ? 1 : 0);
}
