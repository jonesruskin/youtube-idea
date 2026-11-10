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
  /** Facial hair style (always drawn with the mouth clearly on top). */
  beard?: 'full' | 'goatee' | 'chinstrap';
  mustache?: string;
  /** Elderly: slight hunch, slower walk. */
  elder?: boolean;
  /** Script speaker that drives this character's lip-sync. */
  speaker?: string;
  /** Rim-light colour (signature). */
  rim: string;
  watch?: boolean;
};

export const CAST: Record<'you' | 'mira' | 'ito' | 'itoYoung' | 'itoMid' | 'mum' | 'tomas' | 'lola' | 'rosa' | 'captain' | 'officer' | 'ana' | 'lui' | 'sione' | 'mele' | 'teacher' | 'kaur' | 'wren' | 'nana' | 'tess' | 'pell', ToonDesign> = {
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
    speaker: 'KAI',
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
  // Mr. Ito in 1982, age 30: the same round glasses and the same brown wool (the cardigan he still wears), black
  // hair, taller and unstooped. Never named on screen until the reveal.
  itoYoung: {
    id: 'itoYoung',
    height: 1.0,
    head: 0.19,
    build: 0.92,
    skin: '#E8C4A2',
    skinShade: '#C9A07E',
    hair: 'short',
    hairColor: '#17120F',
    glasses: true,
    outfits: {
      home: ['#8A6A4A', '#6E5236', '#3A3F52', '#2A2A2A'], // brown jumper
      cold: ['#8A6A4A', '#6E5236', '#3A3F52', '#2A2A2A'],
    },
    rim: '#FFD08A',
  },
  /** Mr. Ito in his fifties (the "44 years of sunrises" memory): greying, the cardigan already, not yet stooped. */
  itoMid: {
    id: 'itoMid',
    height: 0.97,
    head: 0.19,
    build: 0.95,
    skin: '#E8C4A2',
    skinShade: '#C9A07E',
    hair: 'short',
    hairColor: '#8A8890',
    glasses: true,
    mustache: '#6E6C74',
    outfits: {
      home: ['#8A6A4A', '#6E5236', '#4A4E5C', '#2A2A2A'],
      cold: ['#3E5C4A', '#2E4638', '#3A3A44', '#2A2A2A'],
    },
    rim: '#FFD08A',
  },
  // Grace Okafor, Mira and Kai's mum: a nurse, scrubs under a navy coat
  mum: {
    id: 'mum',
    height: 0.97,
    head: 0.19,
    build: 1.0,
    skin: '#9A6440',
    skinShade: '#7A4C2E',
    hair: 'bun',
    hairColor: '#17120F',
    outfits: {
      home: ['#3FA69A', '#2E867C', '#3FA69A', '#F4EFE6'], // scrubs
      cold: ['#2E3A5C', '#22304F', '#3FA69A', '#2A2A2A'], // navy coat over scrubs
    },
    rim: '#FFB547',
    speaker: 'MUM',
  },
  // ── File 002 · Manila ──────────────────────────────────────────────────────────────────────────
  // Tomás Reyes, 12: the boy File 001 shows missing his bus at 1:51 PM (extra 17's skin, hair and clothes kept, so
  // both Files match), drawn at his true size: between Mira (8, 0.6) and Kai (16, 1.0)
  tomas: {
    id: 'tomas',
    height: 0.8,
    head: 0.24,
    build: 0.85,
    skin: '#7A4A2E',
    skinShade: '#5E3620',
    hair: 'short',
    hairColor: '#2E1E14',
    outfits: {
      home: ['#9A8C98', '#9A8C98', '#3B3B3B', '#2A2A2A'], // grey school polo, dark trousers
      cold: ['#6D597A', '#6D597A', '#4A5568', '#2A2A2A'], // purple parka (as File 001's Day 365 shot)
    },
    rim: '#9FD8FF',
    speaker: 'TOMAS',
  },
  // Lola Pilar Reyes, 76: retired coast-guard radio operator; small, upright, reading glasses, grey bun
  lola: {
    id: 'lola',
    height: 0.86,
    head: 0.2,
    build: 0.92,
    skin: '#B57E56',
    skinShade: '#93623E',
    hair: 'bun',
    hairColor: '#D8D6DC',
    glasses: true,
    outfits: {
      home: ['#C2577A', '#9E3F5E', '#4A4E5C', '#2A2A2A'], // rose blouse
      cold: ['#7A3A4A', '#5E2A38', '#3A3A44', '#2A2A2A'], // maroon coat
    },
    elder: true,
    rim: '#FFB58A',
    speaker: 'LOLA',
  },
  // Rosa Reyes, 38: Second Officer, merchant navy: white uniform shirt, navy trousers; navy watch jacket in the cold
  rosa: {
    id: 'rosa',
    height: 0.96,
    head: 0.19,
    build: 0.98,
    skin: '#9A6440',
    skinShade: '#7A4C2E',
    hair: 'ponytail',
    hairColor: '#17120F',
    outfits: {
      home: ['#F4F1EA', '#D9C38A', '#1F2A44', '#1A1A1A'],
      cold: ['#22304F', '#D9C38A', '#1F2A44', '#1A1A1A'],
    },
    rim: '#FFD08A',
    speaker: 'ROSA',
  },
  captain: {
    id: 'captain',
    height: 1.02,
    head: 0.19,
    build: 1.15,
    skin: '#C68A5E',
    skinShade: '#A56E46',
    hair: 'short',
    hairColor: '#8A8890',
    beard: 'full',
    outfits: {
      home: ['#F4F1EA', '#D9C38A', '#1F2A44', '#1A1A1A'],
      cold: ['#2A3550', '#D9C38A', '#1F2A44', '#1A1A1A'],
    },
    rim: '#9FD8FF',
    speaker: 'CAPTAIN',
  },
  // Commander Joy Santos, 45: coast guard; trained under Lola
  officer: {
    id: 'officer',
    height: 0.95,
    head: 0.19,
    build: 1.0,
    skin: '#A87048',
    skinShade: '#86553A',
    hair: 'bun',
    hairColor: '#17120F',
    outfits: {
      home: ['#E8EEF4', '#3A5A8A', '#22304F', '#1A1A1A'],
      cold: ['#22304F', '#3A5A8A', '#22304F', '#1A1A1A'],
    },
    rim: '#9FD8FF',
    speaker: 'OFFICER',
  },
  // ── File 002 (vol02) · Auckland: the Tupou family ─────────────────────────────────────────────────
  // Ana, 12: curly hair in a high puff, a yellow raincoat over her school polo, always a notebook
  ana: {
    id: 'ana',
    height: 0.76,
    head: 0.25,
    build: 0.86,
    skin: '#9A6440',
    skinShade: '#7A4C2E',
    hair: 'curly',
    hairColor: '#1A1210',
    outfits: {
      home: ['#2E7D6E', '#24665A', '#2A3550', '#F4EFE6'], // green school polo
      cold: ['#F2C94C', '#D4A72C', '#2A3550', '#2A2A2A'], // yellow raincoat
    },
    rim: '#FFD27A',
    speaker: 'ANA',
  },
  // Lui, 7: small, big head, a dinosaur T-shirt
  lui: {
    id: 'lui',
    height: 0.52,
    head: 0.3,
    build: 0.85,
    skin: '#9A6440',
    skinShade: '#7A4C2E',
    hair: 'buzz',
    hairColor: '#1A1210',
    outfits: {
      home: ['#E07A5F', '#C2464F', '#3B3B3B', '#3E7CB1'],
      cold: ['#3E7CB1', '#2E5A9A', '#3B3B3B', '#3E7CB1'],
    },
    rim: '#FF8A7A',
    speaker: 'LUI',
  },
  // Sione, 41: bus driver; navy uniform shirt with a yellow stripe
  sione: {
    id: 'sione',
    height: 1.06,
    head: 0.19,
    build: 1.25,
    skin: '#8A5838',
    skinShade: '#6E4428',
    hair: 'short',
    hairColor: '#17120F',
    beard: 'goatee',
    outfits: {
      home: ['#22304F', '#E9C46A', '#2A2A2A', '#1A1A1A'],
      cold: ['#22304F', '#E9C46A', '#2A2A2A', '#1A1A1A'],
    },
    rim: '#9FD8FF',
    speaker: 'SIONE',
  },
  // Dr. Mele Tupou, 40: volcano scientist; red fleece, ID lanyard, hair tied back
  mele: {
    id: 'mele',
    height: 0.96,
    head: 0.19,
    build: 1.0,
    skin: '#9A6440',
    skinShade: '#7A4C2E',
    hair: 'ponytail',
    hairColor: '#17120F',
    glasses: true,
    outfits: {
      home: ['#C2464F', '#9E3A42', '#2A3550', '#1A1A1A'],
      cold: ['#C2464F', '#9E3A42', '#2A3550', '#1A1A1A'],
    },
    rim: '#FFB58A',
    speaker: 'MELE',
  },
  teacher: {
    id: 'teacher',
    height: 1.0,
    head: 0.19,
    build: 1.05,
    skin: '#E0B48E',
    skinShade: '#C29470',
    hair: 'short',
    hairColor: '#8A6A3A',
    glasses: true,
    outfits: {home: ['#3C8D6E', '#2E6E56', '#4A5568', '#2A2A2A'], cold: ['#3C8D6E', '#2E6E56', '#4A5568', '#2A2A2A']},
    rim: '#9FD8FF',
    speaker: 'TEACHER',
  },
  // Mrs. Kaur, 79: the Tupous' neighbour; small, grey plait, purple cardigan over a long kurta, and a cat
  // ── File 002 (moon02), Saltmouth ──
  // Wren, 10: yellow raincoat and red wellies every day of the story (the town's weather; her signature)
  wren: {
    id: 'wren',
    height: 0.66,
    head: 0.26,
    build: 0.85,
    skin: '#C99570',
    skinShade: '#A87650',
    hair: 'short',
    hairColor: '#8A3B1E',
    outfits: {home: ['#F2C230', '#D4A72C', '#3A4A6A', '#C2464F'], cold: ['#F2C230', '#D4A72C', '#3A4A6A', '#C2464F']},
    rim: '#FFE08A',
    speaker: 'WREN',
  },
  // Nana Odile, 72: keeper of the family tide log; navy fisherman's jumper
  nana: {
    id: 'nana',
    height: 0.84,
    head: 0.2,
    build: 0.95,
    skin: '#C99570',
    skinShade: '#A87650',
    hair: 'bun',
    hairColor: '#E4E2E6',
    glasses: true,
    elder: true,
    outfits: {home: ['#2B4A6F', '#1E3552', '#6B5A4A', '#2A2A2A'], cold: ['#2B4A6F', '#1E3552', '#6B5A4A', '#2A2A2A']},
    rim: '#BFD8FF',
    speaker: 'NANA',
  },
  // Tess, 38: Wren's mum, lifeboat coxswain; orange sea jacket
  tess: {
    id: 'tess',
    height: 0.97,
    head: 0.19,
    build: 1.0,
    skin: '#C99570',
    skinShade: '#A87650',
    hair: 'ponytail',
    hairColor: '#5A2E1A',
    outfits: {home: ['#F08A24', '#F2C230', '#1F2A44', '#2A2A2A'], cold: ['#F08A24', '#F2C230', '#1F2A44', '#2A2A2A']},
    rim: '#FFC08A',
    speaker: 'TESS',
  },
  // Mr. Pell, 60: chairman of the harbour board; tweed jacket
  pell: {
    id: 'pell',
    height: 0.98,
    head: 0.19,
    build: 1.18,
    skin: '#F1D2B6',
    skinShade: '#D4B092',
    hair: 'short',
    hairColor: '#B8BCC4',
    mustache: '#B8BCC4',
    outfits: {home: ['#7A6A4A', '#5E5038', '#3A3A44', '#2A2A2A'], cold: ['#7A6A4A', '#5E5038', '#3A3A44', '#2A2A2A']},
    rim: '#FFD9AE',
    speaker: 'PELL',
  },
  kaur: {
    id: 'kaur',
    height: 0.82,
    head: 0.2,
    build: 0.95,
    skin: '#B57E56',
    skinShade: '#93623E',
    hair: 'bun',
    hairColor: '#D8D6DC',
    glasses: true,
    elder: true,
    outfits: {home: ['#8E6BBF', '#6D4F9A', '#D9A441', '#2A2A2A'], cold: ['#8E6BBF', '#6D4F9A', '#D9A441', '#2A2A2A']},
    rim: '#FFB58A',
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
  // seeds 300–399 are small children (4–6): clearly younger and shorter than Mira (8, height 0.6)
  const small = seed >= 300 && seed < 400;
  const kid = small || r(1) < 0.16;
  const elder = !kid && r(2) < 0.18;
  const [skin, skinShade] = SKINS[Math.floor(r(3) * SKINS.length)];
  const pick = HAIRS[(seed * 5 + Math.floor(r(4) * HAIRS.length)) % HAIRS.length];
  // kids never go bald or wear flat caps; they get the playful cuts
  const hair: Hair = kid && (pick === 'bald' || pick === 'cap' || pick === 'scarf' || pick === 'buzz') ? (['ponytail', 'curly', 'afro'] as Hair[])[seed % 3] : pick;
  const top = TOPS[(seed * 7 + Math.floor(r(5) * 3)) % TOPS.length];
  const top2 = TOPS[(seed * 3 + 5) % TOPS.length];
  return {
    id: `extra-${seed}`,
    height: small ? 0.42 + r(6) * 0.06 : kid ? 0.55 + r(6) * 0.1 : 0.88 + r(6) * 0.22,
    head: small ? 0.3 : kid ? 0.26 : 0.19 + r(7) * 0.025,
    build: kid ? 0.85 : 0.82 + r(8) * 0.45,
    skin,
    skinShade,
    hair: elder && r(9) < 0.5 ? 'bald' : hair,
    // grey/silver only for adults; kids get dark, brown, auburn or blond
    hairColor: elder ? '#D8D8DE' : kid ? ['#1A1210', '#2E1E14', '#5A3A22', '#A0522D', '#C9963A'][Math.floor(r(10) * 5)] : HAIR_COLORS[Math.floor(r(10) * HAIR_COLORS.length)],
    hat: ['#C2464F', '#3E7CB1', '#2A9D8F', '#E9C46A', '#6D597A'][Math.floor(r(11) * 5)],
    glasses: !kid && r(12) < 0.22,
    beard: !kid && r(13) < 0.25 ? (['full', 'goatee', 'chinstrap'] as const)[seed % 3] : undefined,
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
