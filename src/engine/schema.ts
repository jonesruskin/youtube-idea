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
  | 'RADIO';

export type Line = {
  speaker: Speaker;
  text: string;
  /** Seconds of silence after the line (dramatic beat). */
  pause?: number;
};

export type Mood =
  | 'wonder'
  | 'warm'
  | 'mystery'
  | 'comic'
  | 'tension'
  | 'triumph'
  | 'silence';

export type Sfx = 'whoosh' | 'impact' | 'riser' | 'chime' | 'decloak' | 'thunder' | 'powercut' | 'stamp' | 'float' | 'crash' | 'sneeze' | 'cheer' | 'horn' | 'siren';

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
  transition?: 'cut' | 'fade' | 'whip' | 'flash' | 'pullback' | 'zoomThrough' | 'iris' | 'frost' | 'fog';
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
  callout?: {text: string; at?: number | string; pos?: 'center' | 'top' | 'low' | 'left' | 'right'; color?: string};
  /** Corner tag that marks a jump in time: Day N and the outside temperature. */
  hud?: {day: number; temp: number};
  /** Plot development delivered by this shot (the linter enforces one at least every 30 s). */
  dev?: string;
  /** Marks one of the episode's reveals (1..n). */
  twist?: number;
};

export type Episode = {
  id: string;
  file: string; // "FILE 01"
  title: string;
  youtubeTitle: string;
  thumbnailText: string;
  commentPrompt: string;
  /** Description opener, tags and pinned comment for YouTube (scripts/metadata.ts). */
  logline: string;
  tags: string[];
  pinnedComment: string;
  fps: number;
  /** 'cinema' = narrated File format: Kokoro voice, cinematic score, letterbox and transitions. */
  style?: 'cinema';
  shots: Shot[];
};
