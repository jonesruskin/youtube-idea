import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

/**
 * The real Earth: NASA Blue Marble (day) and Black Marble (night lights) textures, public domain, reprojected
 * per pixel onto an orthographic sphere on a canvas. Story controls: where the Sun is (or that there is none),
 * how many city lights are still on, how far the ice has spread, and a slow spin.
 */
type Tex = {w: number; h: number; d: Uint8ClampedArray};
const cache: Record<string, Tex | Promise<Tex>> = {};
const load = (name: string): Promise<Tex> => {
  const hit = cache[name];
  if (hit) return Promise.resolve(hit);
  const p = new Promise<Tex>((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d')!;
      g.drawImage(img, 0, 0);
      const t = {w: img.width, h: img.height, d: g.getImageData(0, 0, img.width, img.height).data};
      cache[name] = t;
      res(t);
    };
    img.onerror = rej;
    img.src = staticFile(`earth/${name}.jpg`);
  });
  cache[name] = p;
  return p;
};

export type PhotoGlobeProps = {
  /** Diameter in px of the canvas. */
  size: number;
  /** View centre [lon, lat] (the point facing the camera). */
  center: [number, number];
  /** Sub-solar point [lon, lat]; null = the Sun is gone (night everywhere). */
  sun: [number, number] | null;
  /** 0..1 fraction of city lights still on. */
  lights?: number;
  /** Latitude (abs degrees) the ice has reached; 90 = none. */
  ice?: number;
  /** 0..1 darkening of the day side (the light switching off). */
  dim?: number;
  /** Extra brightness for the night side so the planet still reads at night (0.0–1). */
  nightLift?: number;
  clouds?: number;
};

export const PhotoGlobe: React.FC<PhotoGlobeProps> = ({size, center, sun, lights = 1, ice = 90, dim = 0, nightLift = 0.45, clouds = 0.7}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tex, setTex] = useState<{day: Tex; night: Tex; cl: Tex} | null>(null);
  const [handle] = useState(() => delayRender('earth textures'));
  useEffect(() => {
    Promise.all([load('day'), load('night'), load('clouds')]).then(([day, night, cl]) => {
      setTex({day, night, cl});
    });
  }, []);
  useLayoutEffect(() => {
    if (!tex || !ref.current) return;
    const S = Math.round(size);
    const g = ref.current.getContext('2d')!;
    const out = g.createImageData(S, S);
    const o = out.data;
    const rad = Math.PI / 180;
    const lam0 = center[0] * rad;
    const phi0 = center[1] * rad;
    const sp0 = Math.sin(phi0);
    const cp0 = Math.cos(phi0);
    let sx = 0;
    let sy = 0;
    let sz = 0;
    if (sun) {
      const sl = sun[0] * rad;
      const sp = sun[1] * rad;
      sx = Math.cos(sp) * Math.cos(sl);
      sy = Math.cos(sp) * Math.sin(sl);
      sz = Math.sin(sp);
    }
    const {day, night, cl} = tex;
    const R = S / 2;
    for (let py = 0; py < S; py++) {
      const y = (R - py - 0.5) / R;
      for (let px = 0; px < S; px++) {
        const x = (px + 0.5 - R) / R;
        const rr = x * x + y * y;
        if (rr > 1) continue;
        const z = Math.sqrt(1 - rr);
        // inverse orthographic
        const phi = Math.asin(z * sp0 + y * cp0);
        const lam = lam0 + Math.atan2(x, z * cp0 - y * sp0);
        const lat = phi / rad;
        let lon = lam / rad;
        lon = ((((lon + 180) % 360) + 360) % 360) - 180;
        const u = (lon + 180) / 360;
        const v = (90 - lat) / 180;
        const di = (Math.min(day.h - 1, (v * day.h) | 0) * day.w + Math.min(day.w - 1, (u * day.w) | 0)) * 4;
        const ni = (Math.min(night.h - 1, (v * night.h) | 0) * night.w + Math.min(night.w - 1, (u * night.w) | 0)) * 4;
        const ci = Math.min(cl.h - 1, (v * cl.h) | 0) * cl.w + Math.min(cl.w - 1, (u * cl.w) | 0);
        let r = day.d[di];
        let gg = day.d[di + 1];
        let b = day.d[di + 2];
        // spreading ice: whiten everything poleward of `ice`, with a ragged edge from the cloud texture
        const edge = Math.abs(lat) - ice + (cl.d[ci * 4] / 255) * 6;
        if (edge > 0) {
          const k = Math.min(1, edge / 4);
          r += (232 - r) * k;
          gg += (240 - gg) * k;
          b += (248 - b) * k;
        }
        const c = (cl.d[ci * 4] / 255) * clouds;
        r += (255 - r) * c;
        gg += (255 - gg) * c;
        b += (255 - b) * c;
        // lighting
        let lit = 0;
        if (sun) {
          const cl2 = Math.cos(phi);
          const nx = cl2 * Math.cos(lam);
          const ny = cl2 * Math.sin(lam);
          const nz = Math.sin(phi);
          const dot = nx * sx + ny * sy + nz * sz;
          lit = Math.max(0, Math.min(1, dot * 4 + 0.15)) * (1 - dim);
        }
        // night: the Black Marble land/ocean tones (faint) + city lights (scaled by `lights`)
        const nr = night.d[ni];
        const ng = night.d[ni + 1];
        const nb = night.d[ni + 2];
        const lum = (nr + ng + nb) / 3;
        const city = Math.max(0, lum - 60) / 195; // bright pixels are cities
        // night: a cool, starlit version of the day texture so continents, clouds and ice still read
        const base = 0.42 * nightLift;
        let qr = r * base * 0.62 + nr * 0.15;
        let qg = gg * base * 0.8 + ng * 0.15;
        let qb = b * base * 1.25 + nb * 0.2 + 18 * nightLift;
        const cityOn = Math.min(1, city * 1.6) * lights;
        qr += 255 * cityOn * 1.2;
        qg += 196 * cityOn * 1.2;
        qb += 110 * cityOn;
        // limb darkening
        const limb = 0.55 + 0.45 * Math.pow(z, 0.6);
        const idx = (py * S + px) * 4;
        o[idx] = Math.min(255, (r * lit + qr * (1 - lit)) * limb);
        o[idx + 1] = Math.min(255, (gg * lit + qg * (1 - lit)) * limb);
        o[idx + 2] = Math.min(255, (b * lit + qb * (1 - lit)) * limb);
        o[idx + 3] = 255;
      }
    }
    g.putImageData(out, 0, 0);
    // city-light bloom
    if (lights > 0.02 && (!sun || dim > 0.5)) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.filter = `blur(${Math.max(2, S / 160)}px)`;
      g.globalAlpha = 0.55 * Math.min(1, lights * 1.5);
      g.drawImage(ref.current, 0, 0);
      g.restore();
    }
    continueRender(handle);
  }, [tex, size, center[0], center[1], sun?.[0], sun?.[1], lights, ice, dim, nightLift, clouds]);
  return <canvas ref={ref} width={Math.round(size)} height={Math.round(size)} style={{width: size, height: size, borderRadius: '50%'}} />;
};
