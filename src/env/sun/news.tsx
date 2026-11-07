import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {extra} from '../../characters/toon/design';
import {FACES} from '../../characters/toon/face';
import {POSES} from '../../characters/toon/poses';
import {Toon} from '../../characters/toon/Toon';
import {visemeAt} from '../../characters/visemes';
import {useShot} from '../../engine/shot-context';
import {Stars} from '../../fx/sky';
import {fonts} from '../../theme';
import {useSetCtx} from './stage';
import {ReplyPicture} from './reply';

/**
 * The world, through a television: how the family (and the viewer) sees that it is happening everywhere.
 * A rolling-news frame (LIVE bug, channel mark, red lower third, ticker) around one of:
 *   world  — a 2×2 wall of live feeds (`panels`: [{place, time, kind}]), each one a different city's chaos
 *   anchor — a newsreader at the desk with a picture-in-picture (`inset` kind)
 *   press  — a press conference: a scientist at a podium in front of the infrared image of the shell
 *   beam   — the beam traced across the sky to a star in Cassiopeia, HD 219134, 21 light-years away
 *   reply  — the decoded reply picture on screen
 * Text props: `headline`, `ticker`.
 */
const INK = '#0B1026';
type Kind =
  | 'crowd' | 'sleep' | 'airport' | 'market' | 'prayer' | 'protest' | 'radar' | 'refuge' | 'rooftops' | 'sunrise' | 'grid' | 'beach' | 'field' | 'bus';

const skyline = (seed: number, base: number, col: string, lit: number) =>
  Array.from({length: 12}, (_, i) => {
    const r = Math.abs(Math.sin(seed * 31.7 + i * 7.13));
    const w = 50 + r * 60;
    const h = 120 + r * 260;
    const x = i * 85 - 40;
    return (
      <g key={i}>
        <rect x={x} y={base - h} width={w} height={h} fill={col} stroke={INK} strokeWidth={2} />
        {lit > 0 &&
          Array.from({length: Math.floor(h / 40)}, (_, k) => (
            <rect key={k} x={x + 10 + ((k * 13) % (w - 24))} y={base - h + 14 + k * 36} width={10} height={12} fill="#FFD27A" opacity={lit * (((k + i) % 3) === 0 ? 0.2 : 0.9)} />
          ))}
      </g>
    );
  });

const people = (n: number, y: number, seed: number, phones = true, up = true) =>
  Array.from({length: n}, (_, i) => {
    const x = 20 + ((i * 97 + seed * 31) % 940);
    const s = 0.7 + ((i * 7) % 5) * 0.08;
    return (
      <g key={i} transform={`translate(${x},${y + (i % 3) * 8}) scale(${s})`}>
        <path d="M-14,0 L-12,-60 Q0,-74 12,-60 L14,0 Z" fill="#141826" />
        <circle cx={0} cy={-76} r={13} fill="#141826" />
        {phones && i % 2 === 0 && <rect x={up ? 4 : 10} y={up ? -120 : -70} width={8} height={14} rx={2} fill="#BFE8FF" />}
        {phones && i % 2 === 0 && <circle cx={up ? 8 : 14} cy={up ? -113 : -63} r={14} fill="#BFE8FF" opacity={0.25} />}
      </g>
    );
  });

/** One live feed, drawn in a 960×540 box. */
const Feed: React.FC<{kind: Kind; frame: number; t: number}> = ({kind, frame, t}) => {
  const night = (top = '#02030C', bot = '#141C40') => (
    <g>
      <defs>
        <linearGradient id={`fd${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
      </defs>
      <rect width={960} height={540} fill={`url(#fd${kind})`} />
      <g transform="scale(0.5)">
        <Stars frame={frame} count={120} w={1920} h={700} seed={kind.length * 7} maxR={2} />
      </g>
    </g>
  );
  switch (kind) {
    case 'crowd':
      return (
        <g>
          {night()}
          {skyline(3, 400, '#1C2342', 1)}
          <rect y={400} width={960} height={140} fill="#2A2E3A" />
          {people(26, 470, 3)}
        </g>
      );
    case 'sleep':
      return (
        <g>
          {night()}
          {skyline(11, 470, '#1A2038', 0.15)}
          <rect y={470} width={960} height={70} fill="#20242E" />
          <text x={480} y={260} textAnchor="middle" fontFamily={fonts.ui} fontWeight={700} fontSize={30} fill="#7F8AB0" opacity={0.6}>
            z z z
          </text>
        </g>
      );
    case 'airport':
      return (
        <g>
          {night('#05070F', '#1A2140')}
          <rect y={380} width={960} height={160} fill="#2E3240" />
          {[180, 520, 820].map((x) => (
            <g key={x} transform={`translate(${x},380)`}>
              <path d="M-120,-10 L120,-10 L140,-30 L-100,-30 Z" fill="#C9CED6" stroke={INK} strokeWidth={3} />
              <path d="M-20,-30 L40,-90 L60,-90 L30,-30 Z" fill="#B8BEC6" stroke={INK} strokeWidth={3} />
            </g>
          ))}
          <rect x={300} y={60} width={360} height={160} rx={8} fill="#111" stroke="#444" strokeWidth={4} />
          {['FLIGHT 212', 'FLIGHT 087', 'FLIGHT 440'].map((f, i) => (
            <g key={f}>
              <text x={320} y={110 + i * 42} fontFamily={fonts.mono} fontSize={24} fill="#FFD27A">{f}</text>
              <text x={640} y={110 + i * 42} textAnchor="end" fontFamily={fonts.mono} fontSize={24} fill="#FF5A4A" opacity={0.6 + 0.4 * Math.sin(frame * 0.3 + i)}>CANCELLED</text>
            </g>
          ))}
        </g>
      );
    case 'market':
      return (
        <g>
          <rect width={960} height={540} fill="#0E1426" />
          <path d={`M40,${120} ${Array.from({length: 24}, (_, i) => `L${40 + i * 38},${120 + i * 14 + Math.sin(i * 1.7) * 18}`).join(' ')}`} stroke="#FF5A4A" strokeWidth={6} fill="none" />
          <text x={60} y={470} fontFamily={fonts.display} fontWeight={900} fontSize={64} fill="#FF5A4A">−31%</text>
          <text x={60} y={510} fontFamily={fonts.mono} fontSize={24} fill="#C9D6F0">ALL MARKETS SUSPENDED</text>
        </g>
      );
    case 'prayer':
      return (
        <g>
          {night('#0A0610', '#2A1830')}
          <path d="M380,420 L380,200 L480,120 L580,200 L580,420 Z" fill="#2A2238" stroke={INK} strokeWidth={3} />
          <rect y={420} width={960} height={120} fill="#1E1A26" />
          {Array.from({length: 40}, (_, i) => (
            <g key={i}>
              <circle cx={30 + i * 23} cy={480 + (i % 3) * 14} r={16} fill="#FFB25A" opacity={0.18 + 0.1 * Math.sin(frame * 0.2 + i)} />
              <circle cx={30 + i * 23} cy={480 + (i % 3) * 14} r={4} fill="#FFE2A0" />
            </g>
          ))}
        </g>
      );
    case 'protest':
      return (
        <g>
          {night()}
          {skyline(23, 380, '#1C2342', 0.6)}
          <rect y={380} width={960} height={160} fill="#2A2E3A" />
          {people(22, 490, 9, false)}
          {[{x: 160, s: 'WHAT DO THEY WANT?'}, {x: 560, s: 'GIVE IT BACK'}].map(({x, s}, i) => (
            <g key={s} transform={`translate(${x},${330 + Math.sin(frame * 0.2 + i) * 6})`}>
              <path d={`M110,40 L110,130`} stroke="#5A3822" strokeWidth={6} />
              <rect x={0} y={0} width={240} height={60} fill="#F4EFE6" stroke={INK} strokeWidth={3} />
              <text x={120} y={40} textAnchor="middle" fontFamily={fonts.ui} fontWeight={800} fontSize={20} fill="#C2464F">{s}</text>
            </g>
          ))}
        </g>
      );
    case 'radar':
      return (
        <g>
          {night()}
          <rect y={440} width={960} height={100} fill="#20242E" />
          <g transform="translate(480,440)">
            <path d="M-30,0 L0,-120 L30,0 Z" fill="#5A5E6A" stroke={INK} strokeWidth={3} />
            <g transform={`translate(0,-120) rotate(${-40 + Math.sin(frame * 0.02) * 6})`}>
              <path d="M-160,-10 Q0,110 160,-10 Q0,30 -160,-10 Z" fill="#C9CED6" stroke={INK} strokeWidth={4} />
            </g>
          </g>
          {[200, 760].map((x) => <rect key={x} x={x} y={400} width={60} height={40} fill="#3E4A3A" stroke={INK} strokeWidth={3} />)}
        </g>
      );
    case 'refuge':
      return (
        <g>
          <rect width={960} height={540} fill="#3A3442" />
          <path d="M0,360 L0,120 Q480,-60 960,120 L960,360 Z" fill="#D8D0C2" stroke={INK} strokeWidth={4} />
          <rect y={360} width={960} height={180} fill="#6E6A66" />
          {[140, 420, 700].map((x, i) => (
            <path key={x} d={`M${x},420 l60,-90 l60,90 Z`} fill={['#C2464F', '#3C8D6E', '#E9C46A'][i]} stroke={INK} strokeWidth={3} />
          ))}
          {people(14, 460, 5, false)}
        </g>
      );
    case 'rooftops':
      return (
        <g>
          {night()}
          {skyline(41, 460, '#161C36', 0)}
          {people(18, 460, 13, true, true)}
        </g>
      );
    case 'grid': {
      // a whole city going dark, district by district
      const k = Math.min(1, t / 1.6);
      return (
        <g>
          {night()}
          {Array.from({length: 4}, (_, row) => (
            <g key={row}>{skyline(60 + row, 300 + row * 70, ['#141A30', '#161C34', '#181E38', '#1A203C'][row], row / 4 > k ? 1 : 0)}</g>
          ))}
        </g>
      );
    }
    case 'sunrise':
      return (
        <g>
          <defs>
            <linearGradient id="fdsr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4A6CB0" />
              <stop offset="0.6" stopColor="#F2B07A" />
              <stop offset="1" stopColor="#FFE2A8" />
            </linearGradient>
          </defs>
          <rect width={960} height={540} fill="url(#fdsr)" />
          <circle cx={700} cy={430} r={70} fill="#FFF6D6" />
          <circle cx={700} cy={430} r={160} fill="#FFE9A8" opacity={0.35} />
          {skyline(41, 470, '#6A5A7A', 0)}
          <rect y={470} width={960} height={70} fill="#F2F0EC" />
          {people(18, 470, 13, false, false)}
        </g>
      );
    default:
      return <rect width={960} height={540} fill="#111" />;
  }
};

const Broadcast: React.FC<{headline?: string; ticker?: string; frame: number; children: React.ReactNode; live?: boolean}> = ({headline, ticker, frame, children, live = true}) => (
  <svg viewBox="0 0 1920 1080" width="100%" height="100%">
    <rect width={1920} height={1080} fill="#05060D" />
    {children}
    {live && (
      <g>
        <rect x={60} y={50} width={120} height={50} rx={6} fill="#C2464F" />
        <circle cx={86} cy={75} r={9} fill="#FFF" opacity={0.5 + 0.5 * Math.sin(frame * 0.25)} />
        <text x={104} y={86} fontFamily={fonts.display} fontWeight={800} fontSize={28} fill="#FFF">LIVE</text>
        <text x={1860} y={88} textAnchor="end" fontFamily={fonts.display} fontWeight={900} fontSize={34} fill="#FFF" opacity={0.85}>WORLD 24</text>
      </g>
    )}
    {headline && (
      <g>
        <rect x={0} y={880} width={1920} height={100} fill="#C2464F" />
        <rect x={0} y={880} width={190} height={100} fill="#8E2A34" />
        <text x={95} y={942} textAnchor="middle" fontFamily={fonts.display} fontWeight={800} fontSize={30} fill="#FFF">NEWS</text>
        <text x={230} y={948} fontFamily={fonts.display} fontWeight={900} fontSize={52} fill="#FFF">{headline}</text>
      </g>
    )}
    {ticker && (
      <g>
        <rect x={0} y={980} width={1920} height={60} fill="#0B1026" />
        <text x={1920 - ((frame * 6) % 3800)} y={1020} fontFamily={fonts.ui} fontWeight={700} fontSize={30} fill="#E9EEF8">
          {`${ticker}   •   ${ticker}`}
        </text>
      </g>
    )}
  </svg>
);

export const NewsScene: React.FC = () => {
  const c = useSetCtx();
  const {shot} = useShot();
  const v = c.v;
  const p = c.p as any;
  const lines = shot.timedLines as any[];
  const line = lines.find((l) => ['ANCHOR', 'SCIENTIST'].includes(l.speaker) && c.t >= l.startInShot && c.t <= l.startInShot + (l.end - l.start));
  const mouth = line ? visemeAt(line.text, c.t - line.startInShot, line.end - line.start, line.chars).open : 0;
  const z = interpolate(c.t / c.dur, [0, 1], [1, 1.04]);
  const person = (seed: number, x: number, y: number, s: number, talk: number) => (
    <Toon
      d={extra(seed)}
      s={{x, y, scale: s, facing: 'front', pose: POSES.stand, bob: 0, face: FACES.focused, turn: 0, look: [0, 0], talk, blink: (c.frame + seed) % 97 < 3 ? 1 : 0, outfit: 'home', hoodUp: false, breath: 0, frame: c.frame, rim: false, opacity: 1, watchGlow: 0}}
    />
  );
  if (v === 'world') {
    const panels = (p.panels ?? []) as {place: string; time: string; kind: Kind}[];
    return (
      <AbsoluteFill>
        <Broadcast headline={p.headline} ticker={p.ticker} frame={c.frame} live={!p.plain}>
          <g transform={`translate(960,${p.plain ? 540 : 470}) scale(${z}) translate(-960,-${p.plain ? 500 : 470})`}>
            {panels.slice(0, 4).map((pn, i) => {
              const x = 40 + (i % 2) * 930;
              const y = 120 + Math.floor(i / 2) * 380;
              return (
                <g key={i} transform={`translate(${x},${y})`}>
                  <svg x={0} y={0} width={910} height={370} viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice">
                    <Feed kind={pn.kind} frame={c.frame} t={c.t} />
                  </svg>
                  <rect x={0} y={0} width={910} height={370} fill="none" stroke="#3A4466" strokeWidth={4} />
                  <rect x={16} y={16} width={Math.max(240, pn.place.length * 26 + 40)} height={74} rx={6} fill="#0B1026" opacity={0.85} />
                  <text x={34} y={52} fontFamily={fonts.display} fontWeight={900} fontSize={30} fill="#FFF">{pn.place}</text>
                  <text x={34} y={80} fontFamily={fonts.mono} fontSize={22} fill="#FFD08A">{pn.time}</text>
                </g>
              );
            })}
          </g>
        </Broadcast>
      </AbsoluteFill>
    );
  }
  if (v === 'anchor') {
    return (
      <AbsoluteFill>
        <Broadcast headline={p.headline} ticker={p.ticker} frame={c.frame}>
          <rect x={0} y={0} width={1920} height={880} fill="#1A2448" />
          {Array.from({length: 9}, (_, i) => <rect key={i} x={i * 220} y={0} width={4} height={880} fill="#24345E" />)}
          <g transform="translate(560,870)">{person(70, 0, 0, 1.6, mouth)}</g>
          <rect x={200} y={700} width={760} height={180} fill="#2E3A66" stroke={INK} strokeWidth={4} />
          <g transform="translate(1060,170)">
            <svg x={0} y={0} width={780} height={440} viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice">
              <Feed kind={(p.inset ?? 'crowd') as Kind} frame={c.frame} t={c.t} />
            </svg>
            <rect width={780} height={440} fill="none" stroke="#C9D6F0" strokeWidth={6} />
          </g>
        </Broadcast>
      </AbsoluteFill>
    );
  }
  if (v === 'press') {
    // the infrared image: a warm ring twice the Sun's width where the Sun should be
    const show = Math.min(1, c.t / 0.6);
    return (
      <AbsoluteFill>
        <Broadcast headline={p.headline} ticker={p.ticker} frame={c.frame}>
          <rect width={1920} height={880} fill="#20283E" />
          <g transform="translate(860,90)" opacity={show}>
            <rect width={980} height={600} fill="#06040C" stroke="#8A8F9C" strokeWidth={6} />
            <defs>
              <radialGradient id="irShell">
                <stop offset="0" stopColor="#2A0A3A" />
                <stop offset="0.55" stopColor="#7A1A6A" />
                <stop offset="0.8" stopColor="#E0442A" />
                <stop offset="0.92" stopColor="#FFB13B" />
                <stop offset="1" stopColor="#06040C" />
              </radialGradient>
            </defs>
            <circle cx={490} cy={300} r={210} fill="url(#irShell)" />
            <circle cx={490} cy={300} r={105} fill="none" stroke="#9FD8FF" strokeWidth={3} strokeDasharray="10 8" />
            <text x={490} y={300 - 112} textAnchor="middle" fontFamily={fonts.mono} fontSize={22} fill="#9FD8FF">SUN (HIDDEN)</text>
            <text x={490} y={545} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fill="#FFD08A">INFRARED · 2× SOLAR DIAMETER</text>
          </g>
          <g transform="translate(420,880)">
            {person(71, 0, 0, 1.5, mouth)}
            <path d="M-130,-260 L130,-260 L110,0 L-110,0 Z" fill="#3A4466" stroke={INK} strokeWidth={4} />
            <circle cx={0} cy={-200} r={26} fill="#C9D6F0" />
          </g>
        </Broadcast>
      </AbsoluteFill>
    );
  }
  if (v === 'beam') {
    // Cassiopeia's W, the star, and the beam drawn up to it from below the horizon (the Sun)
    const draw = Math.min(1, Math.max(0, (c.t - 0.4) / 1.8));
    const W: [number, number][] = [[620, 300], [760, 420], [900, 330], [1040, 450], [1180, 340]];
    const star: [number, number] = [1300, 470];
    return (
      <AbsoluteFill>
        <Broadcast headline={p.headline} ticker={p.ticker} frame={c.frame}>
          <rect width={1920} height={880} fill="#03050F" />
          <Stars frame={c.frame} count={400} w={1920} h={880} seed={91} maxR={2.2} />
          <path d={`M${W.map((q) => q.join(',')).join(' L')}`} stroke="#6F86C6" strokeWidth={3} fill="none" strokeDasharray="8 8" />
          {W.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill="#EAF0FF" />)}
          <text x={900} y={240} textAnchor="middle" fontFamily={fonts.ui} fontWeight={700} fontSize={32} letterSpacing={6} fill="#9FB2DA">CASSIOPEIA</text>
          <path d={`M${star[0] - 260 * (1 - draw) - 200},${star[1] + 600} L${star[0] - (1 - draw) * 260},${star[1] + 600 - (600 - 0) * draw}`} stroke="#FFD27A" strokeWidth={6} opacity={0.9} />
          <path d={`M${star[0] - 200},${star[1] + 600} L${star[0]},${star[1]}`} stroke="#FFB13B" strokeWidth={30} opacity={0.12 * draw} />
          <circle cx={star[0]} cy={star[1]} r={7} fill="#FFF6D6" />
          {draw >= 1 && <circle cx={star[0]} cy={star[1]} r={34} fill="none" stroke="#FF5A3A" strokeWidth={5} />}
          {draw >= 1 && (
            <g>
              <text x={star[0] + 50} y={star[1] - 10} fontFamily={fonts.display} fontWeight={900} fontSize={44} fill="#FFF">HD 219134</text>
              <text x={star[0] + 50} y={star[1] + 36} fontFamily={fonts.mono} fontSize={28} fill="#FFD08A">21 LIGHT-YEARS</text>
            </g>
          )}
        </Broadcast>
      </AbsoluteFill>
    );
  }
  if (v === 'reply') {
    return (
      <AbsoluteFill>
        <Broadcast headline={p.headline} ticker={p.ticker} frame={c.frame}>
          <rect width={1920} height={880} fill="#0B1026" />
          <g transform="translate(960,450)">
            <ReplyPicture cell={9} reveal={1} frame={c.frame} />
          </g>
        </Broadcast>
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{background: '#000'}} />;
};
