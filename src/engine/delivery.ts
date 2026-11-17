import type {Line} from './schema';

/**
 * Delivery: how a line is SAID, not only what it says (CEO v5.2: "the dialogues have no emotion… some words need to
 * be stressed, some need a pause"). Written in the script like a screenplay parenthetical plus two marks:
 *
 *     MUM('(grateful) Thank you. / For keeping them *alive*. And for looking after them.')
 *
 *   (feel)   the feeling the character has right now: required on every line (lint), drives the voice and must
 *            match their face in the shot.
 *   *word*   stressed word(s): louder, a touch longer, a pitch lift (Kokoro); CAPS for ElevenLabs.
 *   /        a beat (≈0.35 s with the phrase edges); `//` a long beat (≈0.7 s): a breath, a swallow, a hesitation.
 *
 * `text` (captions, lip-sync, review) is always the plain sentence; `say` keeps the marks for the voice.
 */
export type Feel =
  | 'warm' | 'grateful' | 'tender' | 'joyful' | 'excited' | 'relieved' | 'amused' | 'teasing' | 'dry' | 'proud' | 'hopeful'
  | 'curious' | 'awed' | 'wistful' | 'calm' | 'firm' | 'determined'
  | 'worried' | 'scared' | 'urgent' | 'shocked' | 'pleading' | 'sad' | 'grieving' | 'guilty' | 'tired' | 'frustrated' | 'cross'
  | 'broadcast';

type Voice = {speed: number; pitch: number; level: number; tag: string; faces: string[]};
const ANY = ['neutral', 'smile', 'laugh', 'worried', 'scared', 'surprised', 'sad', 'awe', 'relieved', 'focused', 'determined', 'cold', 'sleepy', 'angry', 'alert', 'uneasy'];

/** Kokoro: speed × voice speed (kept within ±8%: Kokoro slowed further drags, and the film's pace is a feature), pitch ratio (formants kept), level after normalising. ElevenLabs v3 audio tag. Faces that can say it. */
export const FEELS: Record<Feel, Voice> = {
  warm: {speed: 1.0, pitch: 1.0, level: 0.95, tag: 'warmly', faces: ['smile', 'neutral', 'relieved', 'focused', 'laugh']},
  grateful: {speed: 0.95, pitch: 1.0, level: 0.9, tag: 'gratefully, voice catching', faces: ['smile', 'relieved', 'sad', 'neutral']},
  tender: {speed: 0.95, pitch: 0.99, level: 0.8, tag: 'tenderly, softly', faces: ['smile', 'sad', 'neutral', 'worried', 'relieved']},
  joyful: {speed: 1.05, pitch: 1.03, level: 1.0, tag: 'joyfully', faces: ['smile', 'laugh', 'awe', 'relieved']},
  excited: {speed: 1.08, pitch: 1.04, level: 1.0, tag: 'excited', faces: ['smile', 'laugh', 'surprised', 'awe', 'alert']},
  relieved: {speed: 0.97, pitch: 1.0, level: 0.9, tag: 'relieved, exhaling', faces: ['smile', 'relieved', 'sad', 'neutral', 'laugh']},
  amused: {speed: 1.01, pitch: 1.01, level: 0.95, tag: 'amused', faces: ['smile', 'laugh', 'neutral']},
  teasing: {speed: 1.03, pitch: 1.01, level: 0.95, tag: 'teasing', faces: ['smile', 'neutral', 'focused', 'laugh']},
  dry: {speed: 1.0, pitch: 0.99, level: 0.92, tag: 'dryly', faces: ['neutral', 'focused', 'smile', 'determined', 'worried', 'uneasy']},
  proud: {speed: 1.0, pitch: 1.01, level: 0.95, tag: 'proudly', faces: ['smile', 'laugh', 'relieved']},
  hopeful: {speed: 0.99, pitch: 1.01, level: 0.9, tag: 'hopeful', faces: ['smile', 'worried', 'awe', 'neutral', 'focused', 'alert']},
  curious: {speed: 1.03, pitch: 1.02, level: 0.95, tag: 'curious', faces: ['neutral', 'focused', 'surprised', 'awe', 'worried', 'alert', 'smile', 'uneasy']},
  awed: {speed: 0.95, pitch: 1.0, level: 0.82, tag: 'in awe, hushed', faces: ['awe', 'surprised', 'smile', 'alert']},
  wistful: {speed: 0.97, pitch: 0.99, level: 0.9, tag: 'wistful', faces: ANY},
  calm: {speed: 1.0, pitch: 1.0, level: 0.92, tag: 'calmly', faces: ['neutral', 'focused', 'smile', 'determined', 'worried', 'relieved']},
  firm: {speed: 0.98, pitch: 0.99, level: 1.0, tag: 'firmly', faces: ['determined', 'focused', 'neutral', 'worried']},
  determined: {speed: 1.0, pitch: 1.0, level: 1.0, tag: 'determined', faces: ['determined', 'focused', 'neutral', 'worried', 'alert']},
  worried: {speed: 1.02, pitch: 1.01, level: 0.92, tag: 'worried', faces: ['worried', 'scared', 'sad', 'focused', 'uneasy', 'alert']},
  scared: {speed: 1.07, pitch: 1.03, level: 0.95, tag: 'scared, breathless', faces: ['scared', 'worried', 'surprised', 'uneasy']},
  urgent: {speed: 1.12, pitch: 1.02, level: 1.0, tag: 'urgently', faces: ['scared', 'worried', 'determined', 'surprised', 'focused', 'alert']},
  shocked: {speed: 1.04, pitch: 1.03, level: 0.95, tag: 'shocked', faces: ['surprised', 'scared', 'awe', 'worried', 'alert']},
  pleading: {speed: 0.98, pitch: 1.02, level: 0.92, tag: 'pleading', faces: ['worried', 'sad', 'scared', 'uneasy']},
  sad: {speed: 0.94, pitch: 0.98, level: 0.82, tag: 'sadly', faces: ['sad', 'worried', 'neutral', 'uneasy']},
  grieving: {speed: 0.92, pitch: 0.97, level: 0.78, tag: 'grieving, quiet', faces: ['sad', 'worried']},
  guilty: {speed: 0.94, pitch: 0.98, level: 0.8, tag: 'guilty, quiet', faces: ['sad', 'worried', 'neutral', 'uneasy']},
  tired: {speed: 0.94, pitch: 0.98, level: 0.85, tag: 'tired', faces: ['sad', 'neutral', 'worried', 'sleepy', 'cold']},
  frustrated: {speed: 1.04, pitch: 1.0, level: 1.0, tag: 'frustrated', faces: ['worried', 'determined', 'angry', 'uneasy', 'focused']},
  cross: {speed: 1.03, pitch: 0.99, level: 1.0, tag: 'cross', faces: ['angry', 'determined', 'worried', 'focused']},
  broadcast: {speed: 1.0, pitch: 1.0, level: 1.0, tag: 'news anchor', faces: ANY},
};

const FEEL_RE = /^\s*\(([a-z]+)\)\s*/;
/** The plain sentence: marks removed, spacing tidied. */
export const plain = (raw: string) =>
  raw
    .replace(FEEL_RE, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+\/{1,2}\s+/g, ' ')
    .replace(/\s+\/{1,2}$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Build a Line from a screenplay-style string: '(feel) words with *stress* / and beats'. */
export const line = (speaker: Line['speaker'], raw: string, pause?: number, g?: Line['g']): Line => {
  const m = FEEL_RE.exec(raw);
  const feel = m ? (m[1] as Feel) : undefined;
  const body = raw.replace(FEEL_RE, '');
  const text = plain(body);
  const marked = /\*|\s\/{1,2}(\s|$)/.test(body);
  return {speaker, text, ...(marked ? {say: body.trim()} : {}), ...(feel ? {feel} : {}), pause, g};
};

/** The voice script for ElevenLabs v3: an audio tag for the feeling, CAPS for stress, ellipses for beats. */
export const elevenText = (l: Line) => {
  const s = (l.say ?? l.text).replace(/\*([^*]+)\*/g, (_, w: string) => w.toUpperCase()).replace(/\s+\/\/\s+/g, ' … … ').replace(/\s+\/\s+/g, ' … ');
  return l.feel ? `[${FEELS[l.feel].tag}] ${s}` : s;
};
