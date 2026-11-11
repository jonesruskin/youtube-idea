// Episode scripts are plain data (no React) so Node scripts — linter, SRT,
// score generator, TTS — can import them as easily as the Remotion renderer.

export type Speaker =
  | 'EXECUTOR'
  | 'JONAH'
  | 'GRANDMA'
  | 'MRS_BELLO'
  | 'KEMI'
  | 'TUNDE'
  | 'CUSTOMER'
  | 'PASSENGER'
  | 'IYA'
  | 'KADE'
  | 'MAGS'
  | 'ANCHOR'
  | 'CAPTAIN'
  | 'FISHERMAN'
  | 'ASSISTANT'
  // File 001 onward
  | 'NARRATOR'
  | 'MIRA'
  | 'ITO'
  | 'RADIO'
  | 'KAI'
  | 'MUM'
  | 'MUM_RADIO'
  | 'MAN'
  | 'SCIENTIST'
  // File 002 onward
  | 'TOMAS'
  | 'LOLA'
  | 'ROSA'
  | 'ROSA_RADIO'
  | 'CAPTAIN'
  | 'OFFICER'
  | 'CLERK'
  // File 002 (vol02)
  | 'ANA'
  | 'LUI'
  | 'SIONE'
  | 'MELE'
  | 'MELE_PHONE'
  | 'TEACHER'
  | 'COLLEAGUE'
  | 'JAZ'
  | 'WREN'
  | 'NANA'
  | 'TESS'
  | 'PELL';

export type Line = {
  speaker: Speaker;
  text: string;
  /** Seconds of silence after the line (dramatic beat). */
  pause?: number;
  /** How it is said: the line with *stress* and / beats marked (src/engine/delivery.ts). `text` stays plain. */
  say?: string;
  /** The feeling behind the line, right now (required: lint). Drives the voice and must match the speaker's face. */
  feel?: import('./delivery').Feel;
  /** A scripted hand gesture for this line (people do not gesture on every line; most lines have none). */
  g?: 'point' | 'palm' | 'shrug' | 'count' | 'chest' | 'rub' | 'up';
};

export type Mood =
  | 'wonder'
  | 'warm'
  | 'mystery'
  | 'comic'
  | 'tension'
  | 'triumph'
  | 'silence';

export type Sfx = 'static' | 'whoosh' | 'impact' | 'riser' | 'chime' | 'decloak' | 'thunder' | 'powercut' | 'stamp' | 'float' | 'crash' | 'sneeze' | 'cheer' | 'horn' | 'siren';

/** Retention beats the linter tracks: something to laugh at, wonder at, feel, or wonder about. */
export type Beat = 'laugh' | 'wow' | 'heart' | 'loop';

export type Shot = {
  id: string;
  /** Key into the scene registry (src/scenes.tsx). */
  scene: string;
  /** Free-form props forwarded to the scene component. */
  props?: Record<string, unknown>;
  lines?: Line[];
  /** Seconds to hold before the first line starts. */
  lead?: number;
  /** Seconds to hold after the last line ends. */
  tail?: number;
  /** Time has passed since the previous shot in the same place (props and positions may differ across this cut). */
  timeJump?: boolean;
  /** Set by src/engine/flow.ts: this shot continues the previous one's take seamlessly (no cut is seen). */
  flow?: boolean;
  /** Keep a cut inside a scene, with the reason (docs/00 P15: a same-scene cut needs one). */
  cut?: string;
  /** Set by flow.ts when it keeps a same-scene cut because the scene really changes (the reason). */
  takeBreak?: string;
  /** Minimum shot length in seconds (for wordless visual beats). */
  min?: number;
  /** Chapter title — starts a YouTube chapter at this shot. */
  chapter?: string;
  /** Place a mid-roll ad break at the END of this shot (after an open loop). */
  midroll?: boolean;
  /** Stage direction — what the viewer SEES. Feeds the screenplay doc and the descriptive SRT cues. */
  action?: string;
  /** Retention beats delivered by this shot. */
  beats?: Beat[];
  /** How we arrive in this shot. Default: cut. Cinema transitions: pullback (out of an extreme close-up), zoomThrough (into a window),
   *  iris (out of the watch face), frost (frost grows over the frame, then thaws), fog (breath fogs the lens). */
  transition?: 'cut' | 'fade' | 'whip' | 'flash' | 'pullback' | 'zoomThrough' | 'iris' | 'frost' | 'fog' | 'match';
  /** Score cue from this shot onward (cinema episodes; scripts/score_cinema.py). */
  cue?: string;
  /** The words in this shot's own line that tell the viewer where/when we now are ("the next morning", "down to the
   *  harbour"). Every change of place needs a place/day tag (`hud`) or this (lint: place gate). */
  bridge?: string;
  /** Slide 2.39:1 letterbox bars in for this shot (reserved for the biggest moments). */
  letterbox?: boolean;
  /** Real science the shot SHOWS visually; the source goes to the YouTube description, never on screen. */
  science?: {text: string; source: string};
  /** Score mood from this shot onward. */
  mood?: Mood;
  /** Sound effect at the start of the shot. */
  sfx?: Sfx;
  /** One bold kinetic word/number on screen (the genre's emphasis device). Used sparingly. */
  /** A countdown clock on screen: mm:ss running from `from` to `to` seconds across the shot. */
  timer?: {from: number; to: number; label?: string; pos?: 'band'}; // 'band': smaller, in the top letterbox band, clear of a 2×2 news wall's labels
  callout?: {text: string; at?: number | string; pos?: 'center' | 'top' | 'low' | 'left' | 'right'; color?: string};
  /** Corner tag that marks a jump in time: Day N and the outside temperature. */
  /** Day tag: with a temperature (File 001), or with a distance in km and the day the count ends (`of`), or a place/time tag. */
  hud?: {day: number; temp: number} | {day: number; km: number; of: number} | {place: string; time: string};
  /** A shot in another timeline (e.g. '1982'): never Day-tagged, never narrated before the reveal, ignored by the year bar. */
  thread?: string;
  /** Plot development delivered by this shot (the linter enforces one at least every 30 s). */
  dev?: string;
  /** Marks one of the episode's reveals (1..n). */
  twist?: number;
  /** Picture treatment for the whole shot: 'flashforward' drains the colour and adds film grain. */
  look?: 'flashforward' | 'memory';
  /** The first shot allowed to show what the episode is hiding (e.g. 'shell'): the linter blocks anything earlier. */
  reveal?: string;
};

/**
 * The story contract (docs/00 S13–S16). Every File declares, as data, the five things that make it worth watching, each
 * tied to real shot ids; the linter then proves the film delivers them on time. Written at the treatment stage and
 * approved before anything is built.
 */
export type Story = {
  /** The impossible event, on screen inside the first 30 seconds. */
  hook: {shot: string; image: string};
  /** What the viewer counts (days, distance, depth…) and the shots where it visibly steps on (6 or more). */
  clock: {unit: string; steps: string[]};
  /** The question the audience can't answer, who knows more than they say, where it is planted (3+) and answered. */
  mystery: {question: string; owner: string; plants: string[]; answer: string};
  /** The reversals: "we thought X, but Y" (4 or more; the last one inside the final 2.5 minutes). */
  twists: {shot: string; thought: string; but: string}[];
  /** What the main character wants, what it costs, and the shot that pays it off. */
  heart: {want: string; cost: string; payoff: string};
  /** The last picture the viewer takes away. */
  finalImage: string;
};

export type Episode = {
  id: string;
  /** The story contract; required for every cinema File (lint: Story gate). */
  story?: Story;
  file: string; // "FILE 01"
  title: string;
  youtubeTitle: string;
  /** Other titles for YouTube's Test & Compare (same promise, no spoilers). */
  titleAlternates?: string[];
  thumbnailText: string;
  commentPrompt: string;
  /** Description opener, tags and pinned comment for YouTube (scripts/metadata.ts). */
  logline: string;
  tags: string[];
  pinnedComment: string;
  fps: number;
  /** 'cinema' = narrated File format: Kokoro voice, cinematic score, letterbox and transitions. */
  style?: 'cinema';
  /** Average-shot pacing gate in seconds (default 4.0 for narrated files). */
  pacing?: number;
  /** The episode's world rules (docs/00 S3/S6), checked against every shot by scripts/lint-episode.ts. */
  world?: WorldRules;
  /** Words that give the story away: never in the title, alternates, thumbnail text, logline, tags or pinned comment. */
  spoilers?: string[];
  /** The episode's world model + question bank (docs/00 S3–S4), checked by scripts/check-episode.ts. */
  questionBank?: string;
  /** Who the first-person narrator is: names the narrator may never use for themselves (docs/00 D9). */
  narratorIs?: string[];
  /** Dialogue review ledger (docs/00 D8): every spoken line signed off in context; scripts/dialogue-review.ts. */
  dialogueLedger?: string;
  /** Cast keys of the principal characters (continuity, staging and face gates). Default: File 001's family. */
  mainCast?: string[];
  /** Cast key of the first-person narrator as a child on screen (perspective gate). Default 'mira'. */
  narratorCast?: string;
  /** Speaker → cast key, for the "speaker is in the shot" gate. Default: File 001's speakers. */
  speakerCast?: Record<string, string>;
  /** First Day on which the main cast must wear cold-weather clothes outdoors and in. Default 1. */
  coatsFromDay?: number;
  /** Set false for stories without a cold-by-day rule (costume continuity within a scene still applies). */
  costumeByDay?: boolean;
  /** Characters who must never look angry (the family). Default File 001's kids and Ito. */
  noAngry?: string[];
  shots: Shot[];
};

/** World-state rules: facts that must hold in every scene, written as things that may not appear. */
export type WorldRules = {
  /** One-line statements of the world (shown in reports), e.g. 'power works all year'. */
  facts: string[];
  /** Regular expressions (case-insensitive) no spoken line may match, each with the fact it protects. */
  banLines?: {re: string; why: string; except?: string[]}[];
  /** Props no cast member may hold or leave as an item (optionally only for some characters / outside some shots). */
  banProps?: {prop: string; who?: string[]; why: string; except?: string[]}[];
  /** Sound effects allowed only in the listed shots. */
  onlySfx?: {sfx: string; in: string[]; why: string}[];
  /** Set variants (or set props) that contradict the world. */
  banSets?: {set: string; v?: string; prop?: string; why: string}[];
  /** A character who may not appear before (or after) a given shot. */
  presence?: {who: string; from?: string; until?: string; exceptSets?: string[]; why: string}[];
};
