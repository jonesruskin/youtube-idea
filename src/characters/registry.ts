/**
 * THE single source of truth for character design. Every episode draws characters from
 * here, so Jonah in episode 1 is pixel-identical to Jonah in episode 12.
 * See docs/04-characters.md for the design sheet behind each entry.
 */
export type HairStyle =
  | 'afro'
  | 'shortCrop'
  | 'slick'
  | 'bald'
  | 'headwrap'
  | 'gele'
  | 'curlsGrey'
  | 'bob'
  | 'ponytail'
  | 'braids'
  | 'bun'
  | 'cap';

export type TopStyle = 'jacket' | 'tee' | 'suit' | 'wrapper' | 'cardigan' | 'vest' | 'blouse';

export type CharacterDesign = {
  id: string;
  name: string;
  /** Heir number in File 01 (0 = not an heir). */
  heir: number;
  /** Overall height multiplier (1 = average adult). */
  height: number;
  /** Body width multiplier. */
  build: number;
  /** Head size multiplier (children/teens read younger with bigger heads). */
  head: number;
  skin: string;
  skinShade: string;
  hair: HairStyle;
  hairColor: string;
  top: TopStyle;
  topColor: string;
  topAccent: string;
  innerColor: string;
  pants: string;
  shoes: string;
  /** Signature color — rim light, gift glow, thumbnail accent. */
  signature: string;
  glasses?: 'round' | 'square';
  beard?: boolean;
  wrinkles?: boolean;
  patches?: boolean;
  tie?: string;
  earrings?: boolean;
};

export const characters = {
  jonah: {
    id: 'jonah',
    name: 'Jonah Okafor',
    heir: 1,
    height: 0.92,
    build: 0.86,
    head: 1.12,
    skin: '#7A4A2E',
    skinShade: '#5E3620',
    hair: 'afro',
    hairColor: '#1A1210',
    top: 'jacket',
    topColor: '#F2873A',
    topAccent: '#C9612A',
    innerColor: '#F4EFE6',
    pants: '#2B3A67',
    shoes: '#F4EFE6',
    signature: '#FF9A3C',
    patches: true,
  },
  grandma: {
    id: 'grandma',
    name: 'Grandma Ada Okafor',
    heir: 0,
    height: 0.86,
    build: 1.08,
    head: 1.02,
    skin: '#6B3F27',
    skinShade: '#52301C',
    hair: 'gele',
    hairColor: '#2EA08A',
    top: 'wrapper',
    topColor: '#2EA08A',
    topAccent: '#F2C14E',
    innerColor: '#F2C14E',
    pants: '#2EA08A',
    shoes: '#8B5A3C',
    signature: '#F2C14E',
    glasses: 'round',
    wrinkles: true,
    earrings: true,
  },
  mrsBello: {
    id: 'mrsBello',
    name: 'Mrs. Bello',
    heir: 0,
    height: 0.84,
    build: 0.95,
    head: 1.0,
    skin: '#5C3521',
    skinShade: '#44261A',
    hair: 'headwrap',
    hairColor: '#7B4FB3',
    top: 'wrapper',
    topColor: '#7B4FB3',
    topAccent: '#E8C27A',
    innerColor: '#E8C27A',
    pants: '#7B4FB3',
    shoes: '#3B2A20',
    signature: '#B794F6',
    wrinkles: true,
  },
  kade: {
    id: 'kade',
    name: 'Desmond Kade',
    heir: 0,
    height: 1.1,
    build: 1.0,
    head: 0.95,
    skin: '#E8C4A8',
    skinShade: '#C9A184',
    hair: 'slick',
    hairColor: '#D8DCE3',
    top: 'suit',
    topColor: '#2A2F3A',
    topAccent: '#1C2029',
    innerColor: '#F4F4F4',
    pants: '#2A2F3A',
    shoes: '#0E0F12',
    signature: '#C0C8D8',
    tie: '#8C1C2B',
  },
  assistant: {
    id: 'assistant',
    name: 'Priya (Kade’s assistant)',
    heir: 0,
    height: 0.95,
    build: 0.9,
    head: 1.0,
    skin: '#B07A55',
    skinShade: '#94613F',
    hair: 'bun',
    hairColor: '#1C1414',
    top: 'blouse',
    topColor: '#E9E4F0',
    topAccent: '#C9C2D6',
    innerColor: '#E9E4F0',
    pants: '#2B2E3A',
    shoes: '#111111',
    signature: '#9AA4C8',
    glasses: 'square',
  },
  anchor: {
    id: 'anchor',
    name: 'News anchor',
    heir: 0,
    height: 1.0,
    build: 1.0,
    head: 1.0,
    skin: '#8A5536',
    skinShade: '#6E4128',
    hair: 'shortCrop',
    hairColor: '#151010',
    top: 'suit',
    topColor: '#2C4A7A',
    topAccent: '#203A63',
    innerColor: '#FFFFFF',
    pants: '#2C4A7A',
    shoes: '#111111',
    signature: '#7FD6FF',
    tie: '#E2483D',
  },
} satisfies Record<string, CharacterDesign>;

export type CharacterId = keyof typeof characters;

const SKINS = ['#7A4A2E', '#5C3521', '#8A5536', '#6B3F27', '#A86E48', '#4E2C1B'];
const TOPS = ['#3E7CB1', '#D9A441', '#C2464F', '#3C8D6E', '#8E6BBF', '#E07A5F', '#5B6C8F'];

/** Deterministic background extras (fishermen, crowds) built from a seed. */
export const extra = (seed: number, opts: Partial<CharacterDesign> = {}): CharacterDesign => {
  const r = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const hairs: HairStyle[] = ['shortCrop', 'bald', 'cap', 'shortCrop', 'braids', 'headwrap'];
  const skin = SKINS[Math.floor(r(1) * SKINS.length)];
  return {
    id: `extra-${seed}`,
    name: 'Extra',
    heir: 0,
    height: 0.9 + r(2) * 0.2,
    build: 0.9 + r(3) * 0.25,
    head: 1,
    skin,
    skinShade: skin,
    hair: hairs[Math.floor(r(4) * hairs.length)],
    hairColor: '#17110F',
    top: 'tee',
    topColor: TOPS[Math.floor(r(5) * TOPS.length)],
    topAccent: '#00000033',
    innerColor: '#FFFFFF',
    pants: ['#2B3A67', '#3B3B3B', '#5A4632'][Math.floor(r(6) * 3)],
    shoes: '#2A2A2A',
    signature: '#7FD6FF',
    beard: r(7) > 0.6,
    ...opts,
  };
};
