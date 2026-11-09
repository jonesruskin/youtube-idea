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
  | 'SCIENTIST';

export type Line = {
  speaker: Speaker;
  text: string;
  /** Seconds of silence after the line (dramatic beat). */
  pause?: number;
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
  hud?: {day: number; temp: number} | {place: string; time: string};
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

export type Episode = {
  id: string;
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
