import {continueRender, delayRender, staticFile} from 'remotion';

// Fonts are vendored in public/fonts (SIL Open Font License) so renders never depend on the network.
const FACES: [family: string, file: string, weight: string][] = [
  ['Cormorant Garamond', 'CormorantGaramond.woff2', '300 700'],
  ['Space Grotesk', 'SpaceGrotesk.woff2', '300 700'],
  ['Unbounded', 'Unbounded.woff2', '200 900'],
  ['IBM Plex Mono', 'IBMPlexMono-400.woff2', '400'],
  ['IBM Plex Mono', 'IBMPlexMono-600.woff2', '600'],
];

if (typeof document !== 'undefined') {
  const handle = delayRender('Loading fonts');
  Promise.all(
    FACES.map(([family, file, weight]) =>
      new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, {weight}).load().then((f) => document.fonts.add(f)),
    ),
  ).then(() => continueRender(handle));
}

// Will text (the Vey's voice), UI text, display titles, ledger/terminal.
export const fonts = {
  will: "'Cormorant Garamond', serif",
  ui: "'Space Grotesk', sans-serif",
  display: "'Unbounded', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

/** Channel palette: "Night Ink & Pearl". Navy ink outlines, pearl Vey tech, coral case-file accents. */
export const C = {
  ink: '#0B1026',
  ink2: '#141B3D',
  night: '#070A1C',
  dusk: '#1E2A5E',
  violet: '#3B2E6E',
  pearl: '#F4EFE6',
  pearlShade: '#CFC6B8',
  gold: '#E8C27A',
  goldDeep: '#B8893E',
  coral: '#FF6B57',
  stamp: '#E2483D',
  sky: '#7FD6FF',
  white: '#FFFFFF',
  star: '#FFF6E0',
  betelgeuse: '#FF7A3D',
};

export const W = 1920;
export const H = 1080;
