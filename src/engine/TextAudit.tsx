import React, {useEffect} from 'react';
import {continueRender, delayRender, useCurrentFrame} from 'remotion';

/**
 * Text-safety probe (scripts/text-safe.ts). Only mounted for the audit render: after each frame is laid out it
 * reports every visible piece of text on screen and the letterbox bars, so the gate can fail any label hidden under
 * a bar, cut off by the frame edge, overlapping another label, or covered by something drawn on top of it.
 * Each text is sent as its true outline (a rotated text is a rotated box) plus `cover`: the share of points inside
 * it where an opaque shape is painted above the letters. Draws nothing.
 */
const opaque = (el: Element) => {
  let o = 1;
  for (let e: Element | null = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || '1');
  const cs = getComputedStyle(el);
  if (!(el instanceof SVGElement)) {
    // an HTML layer only hides what is under it if it paints a solid background
    const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor);
    const a = m ? (m[1].split(',')[3] !== undefined ? parseFloat(m[1].split(',')[3]) : 1) : 0;
    return (a >= 0.75 || cs.backgroundImage !== 'none') && o >= 0.75;
  }
  if (el.tagName === 'image') return o >= 0.75;
  // only shapes paint; <svg> and <g> are containers (their inherited fill is not a surface)
  if (!['rect', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'line', 'use'].includes(el.tagName)) return false;
  const fill = cs.fill;
  const painted = fill && fill !== 'none' && !fill.startsWith('url');
  return Boolean(painted) && o * parseFloat(cs.fillOpacity || '1') >= 0.75;
};

export const TextAudit: React.FC = () => {
  const f = useCurrentFrame();
  useEffect(() => {
    const h = delayRender('text audit');
    document.fonts.ready.then(() => {
      // overlays are pointer-events:none, which hit-testing skips: make everything hittable while we measure
      if (!document.getElementById('text-audit-style')) {
        const st = document.createElement('style');
        st.id = 'text-audit-style';
        st.textContent = '* { pointer-events: auto !important; }';
        document.head.appendChild(st);
      }
      const sx = 1920 / window.innerWidth;
      const sy = 1080 / window.innerHeight;
      const alpha = (el: Element | null) => {
        let o = 1;
        for (let e = el; e && e instanceof Element; e = e.parentElement) {
          const cs = getComputedStyle(e);
          if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
          o *= parseFloat(cs.opacity || '1');
          if (o < 0.05) return 0;
        }
        return o;
      };
      const texts: {t: string; q: number[][]; o: number; k: string; cover: number; cols: number; clip: number[][]; by: string; g: number; root: number}[] = [];
      // which drawn label each text belongs to (lines of one tag share a parent group; two labels never do)
      const groups = new Map<Element, number>();
      // the outermost <svg> a text sits in: the scene, a place tag and a callout are separate layers
      const roots = new Map<Element, number>();
      const rootOf = (el: Element) => {
        let r: Element = el;
        for (let e: Element | null = el; e; e = e.parentElement) if (e.tagName.toLowerCase() === 'svg') r = e;
        if (!roots.has(r)) roots.set(r, roots.size);
        return roots.get(r)!;
      };
      const groupOf = (el: Element) => {
        const p = el.parentElement ?? el;
        if (!groups.has(p)) groups.set(p, groups.size);
        return groups.get(p)!;
      };
      document.querySelectorAll('text').forEach((el) => {
        if (el.closest('defs, clipPath, mask, symbol')) return;
        const t = (el.textContent ?? '').trim();
        if (!t) return;
        const o = alpha(el);
        if (o < 0.25) return;
        const g = el as SVGTextElement;
        const b = g.getBBox();
        const m = g.getScreenCTM();
        if (!m || b.width < 1 || b.height < 1) return;
        const pt = (x: number, y: number) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
        const q = [pt(b.x, b.y), pt(b.x + b.width, b.y), pt(b.x + b.width, b.y + b.height), pt(b.x, b.y + b.height)];
        // occlusion: sample the letters' area; an opaque shape above the text at a point = covered
        let n = 0;
        let hid = 0;
        let by = '';
        let cols = 0; // letter columns (of 24) where 2 or 3 of the 3 sample rows are covered: any one means letters are hidden
        // 24 columns from half a column inside each edge: a box hiding the first two letters is caught
        for (let i = 1; i <= 24; i++) {
          let colHid = 0;
          for (let j = 1; j <= 3; j++) {
            const [cx, cy] = pt(b.x + (b.width * (i - 0.5)) / 24, b.y + (b.height * j) / 4);
            if (cx < 0 || cy < 0 || cx >= window.innerWidth || cy >= window.innerHeight) continue;
            n++;
            for (const e of document.elementsFromPoint(cx, cy)) {
              if (e === el || el.contains(e)) break;
              if (e.contains(el)) continue;
              if (opaque(e)) {
                hid++;
                colHid++;
                if (!by) by = `${e.tagName}${e.id ? '#' + e.id : ''} ${(e.getAttribute('class') ?? '').slice(0, 30)} ${e.getAttribute('fill') ?? getComputedStyle(e).backgroundColor} ${e.parentElement?.tagName}`;
                break;
              }
            }
          }
          if (colHid >= 2) cols++;
        }
        // what kind of text: 'set' dressing (signs in a set may be cropped by the frame), 'scroll' (a ticker), or 'info'
        const k = el.closest('[data-text]')?.getAttribute('data-text') ?? 'info';
        // nested <svg> viewports (news-wall panels, inserts) crop what they hold: send them as clip boxes
        const clip: number[][] = [];
        for (let e = el.parentElement; e; e = e.parentElement)
          if (e.tagName.toLowerCase() === 'svg') {
            const r = e.getBoundingClientRect();
            clip.push([Math.round(r.x * sx), Math.round(r.y * sy), Math.round(r.width * sx), Math.round(r.height * sy)]);
          }
        texts.push({t: t.slice(0, 40), q: q.map(([x, y]) => [Math.round(x * sx), Math.round(y * sy)]), o: Math.round(o * 100) / 100, k, cover: n ? hid / n : 0, cols, clip, by, g: groupOf(el), root: rootOf(el)});
      });
      const bars = [...document.querySelectorAll('[data-letterbox]')].map((b) => b.getBoundingClientRect().height * sy);
      console.log('TEXTAUDIT ' + JSON.stringify({f, bar: Math.max(0, ...bars), texts}));
      continueRender(h);
    });
  }, [f]);
  return null;
};
