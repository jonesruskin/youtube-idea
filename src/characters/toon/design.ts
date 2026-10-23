/**
 * THE FILES toon cast — the genre's proven look: big round head, huge expressive eyes, thin smooth limbs,
 * one signature item each. Every size comes from HEIGHT (fraction of the hero's height), so a character can
 * never appear at the wrong size relative to another: scenes only choose a depth, never a per-character scale.
 */
export type Outfit = 'home' | 'cold' | 'coat';
export type Hair = 'tuft' | 'pigtails' | 'bald' | 'short' | 'afro' | 'bun' | 'long' | 'ponytail' | 'curly' | 'cap' | 'beanie' | 'scarf' | 'buzz';

export type ToonDesign = {
  id: string;
  /** Height as a fraction of the hero (the hero is 1.0 = 300 px at depth scale 1). */
  height: number;
  /** Head radius as a fraction of total height. Kids have bigger heads. */
  head: number;
  /** Body width multiplier. */
  build: number;
  skin: string;
  skinShade: string;
  hair: Hair;
  hairColor: string;
  /** Colours per outfit: [top, top accent, legs, shoes]. */
  outfits: Partial<Record<Outfit, [string, string, string, string]>>;
  hat?: string;
  glasses?: boolean;
  beard?: boolean;
  mustache?: string;
  /** Elderly: slight hunch, slower walk. */
  elder?: boolean;
  /** Script speaker that drives this character's lip-sync. */
  speaker?: string;
  /** Rim-light colour (signature). */
  rim: string;
  watch?: boolean;
};

export const CAST: Record<'you' | 'mira' | 'ito', ToonDesign> = {
  you: {
    id: 'you',
    height: 1,
    head: 0.2,
    build: 1,
    skin: '#A06A44',
    skinShade: '#7E4F30',
    hair: 'tuft',
    hairColor: '#1A1210',
    outfits: {
      home: ['#F08A2C', '#C96A18', '#2E3A5C', '#F4EFE6'], // orange tee
      cold: ['#F08A2C', '#C96A18', '#26304F', '#3A2A22'], // orange parka
    },
    rim: '#FFB547',
    watch: true,
  },
  mira: {
    id: 'mira',
    height: 0.6,
    head: 0.27,
    build: 0.85,
    skin: '#A87048',
    skinShade: '#86553A',
    hair: 'pigtails',
    hairColor: '#21160F',
    hat: '#D9443A',
    outfits: {
      home: ['#F2C94C', '#D4A72C', '#5B6C8F', '#D9443A'], // yellow tee, red shoes
      cold: ['#4F86C6', '#356AA6', '#3A3F5C', '#D9443A'], // blue parka + red beanie
    },
    rim: '#FF8A7A',
    speaker: 'MIRA',
  },
  ito: {
    id: 'ito',
    height: 0.93,
    head: 0.19,
    build: 0.95,
    skin: '#E8C4A2',
    skinShade: '#C9A07E',
    hair: 'bald',
    hairColor: '#E8E8EE',
    glasses: true,
    mustache: '#E8E8EE',
    outfits: {
      home: ['#8A6A4A', '#6E5236', '#4A4E5C', '#2A2A2A'], // brown cardigan
      cold: ['#3E5C4A', '#2E4638', '#3A3A44', '#2A2A2A'], // green wool coat
    },
    elder: true,
    rim: '#9FD8FF',
    speaker: 'ITO',
  },
};

const SKINS: [string, string][] = [
  ['#F1D2B6', '#D4B092'],
  ['#E0B48E', '#C29470'],
  ['#C68A5E', '#A56E46'],
  ['#A06A44', '#7E4F30'],
  ['#7A4A2E', '#5E3620'],
  ['#5A3420', '#432616'],
  ['#D9A77E', '#B98860'],
];
const HAIRS: Hair[] = ['short', 'afro', 'bun', 'long', 'ponytail', 'curly', 'cap', 'beanie', 'scarf', 'buzz', 'bald', 'short', 'long', 'curly'];
const HAIR_COLORS = ['#1A1210', '#2E1E14', '#5A3A22', '#8A6A3A', '#C9C3B8', '#A0522D', '#14100E'];
const TOPS = ['#3E7CB1', '#C2464F', '#3C8D6E', '#8E6BBF', '#E07A5F', '#5B6C8F', '#D9A441', '#2A9D8F', '#6D597A', '#B56576', '#4D908E', '#9A8C98'];
const LEGS = ['#2B3A67', '#3B3B3B', '#5A4632', '#4A5568', '#22303C', '#6B4F3A'];

/** Deterministic, varied extras: age, height, build, skin, hair, hats, glasses, beards. Never the same template twice in a row. */
export const extra = (seed: number): ToonDesign => {
  const r = (n: number) => {
    const x = Math.sin(seed * 9301.7 + n * 49297.3) * 233280;
    return x - Math.floor(x);
  };
  const kid = r(1) < 0.16;
  const elder = !kid && r(2) < 0.18;
  const [skin, skinShade] = SKINS[Math.floor(r(3) * SKINS.length)];
  const hair = HAIRS[(seed * 5 + Math.floor(r(4) * HAIRS.length)) % HAIRS.length];
  const top = TOPS[(seed * 7 + Math.floor(r(5) * 3)) % TOPS.length];
  const top2 = TOPS[(seed * 3 + 5) % TOPS.length];
  return {
    id: `extra-${seed}`,
    height: kid ? 0.55 + r(6) * 0.1 : 0.88 + r(6) * 0.22,
    head: kid ? 0.26 : 0.19 + r(7) * 0.025,
    build: kid ? 0.85 : 0.82 + r(8) * 0.45,
    skin,
    skinShade,
    hair: elder && r(9) < 0.5 ? 'bald' : hair,
    hairColor: elder ? '#D8D8DE' : HAIR_COLORS[Math.floor(r(10) * HAIR_COLORS.length)],
    hat: ['#C2464F', '#3E7CB1', '#2A9D8F', '#E9C46A', '#6D597A'][Math.floor(r(11) * 5)],
    glasses: r(12) < 0.22,
    beard: !kid && r(13) < 0.25,
    elder,
    outfits: {
      home: [top, top, LEGS[Math.floor(r(14) * LEGS.length)], '#2A2A2A'],
      cold: [top2, top2, LEGS[Math.floor(r(15) * LEGS.length)], '#2A2A2A'],
      coat: [top2, top2, LEGS[Math.floor(r(15) * LEGS.length)], '#2A2A2A'],
    },
    rim: '#9FD8FF',
  };
};

/** Base pixel height of the hero at depth scale 1. */
export const HERO_PX = 300;
