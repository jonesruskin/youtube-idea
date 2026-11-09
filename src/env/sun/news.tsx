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
  | 'crowd' | 'sleep' | 'airport' | 'market' | 'prayer' | 'protest' | 'radar' | 'refuge' | 'rooftops' | 'sunrise' | 'grid' | 'beach' | 'field' | 'bus'
  | 'power' | 'train' | 'homeoffice' | 'farm' | 'classroom';

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
    case 'power':
      // a power station at night: cooling towers steaming, every window lit (coal, gas and nuclear keep running)
      return (
        <g>
          {night()}
          {skyline(23, 470, '#141A32', 0.8)}
          {[260, 520].map((x, i) => (
            <g key={x}>
              <path d={`M${x - 90},470 Q${x - 60},330 ${x - 70},230 L${x + 70},230 Q${x + 60},330 ${x + 90},470 Z`} fill="#8C93A6" stroke={INK} strokeWidth={4} />
              {[0, 1, 2].map((k) => (
                <circle key={k} cx={x + Math.sin(frame * 0.03 + k + i) * 12} cy={200 - k * 50 - ((frame * 0.8 + k * 30) % 40)} r={46 + k * 14} fill="#E6EAF2" opacity={0.5 - k * 0.12} />
              ))}
            </g>
          ))}
          <rect x={660} y={360} width={240} height={110} fill="#5A6070" stroke={INK} strokeWidth={4} />
          {Array.from({length: 6}, (_, k) => <rect key={k} x={680 + k * 36} y={384} width={22} height={26} fill="#FFD27A" />)}
          <path d="M640,470 L640,250 M900,470 L900,250" stroke="#C9CED6" strokeWidth={6} />
        </g>
      );
    case 'train': {
      // an electric freight train: pantograph sparks, containers of food and fuel
      const x0 = -300 + ((t * 160) % 1400);
      return (
        <g>
          {night()}
          <rect y={420} width={960} height={120} fill="#C8D2E0" />
          <path d="M0,300 L960,300" stroke="#5A5E6A" strokeWidth={3} />
          <path d="M0,440 L960,440" stroke="#5A5E6A" strokeWidth={6} />
          <g transform={`translate(${x0},0)`}>
            <rect x={0} y={330} width={200} height={100} rx={10} fill="#C2464F" stroke={INK} strokeWidth={4} />
            <rect x={150} y={345} width={36} height={30} fill="#FFE9A8" />
            <path d="M80,330 L110,300 L140,330" stroke="#1A1E2A" strokeWidth={4} fill="none" />
            <circle cx={110} cy={300} r={8 + 6 * Math.max(0, Math.sin(frame * 1.7))} fill="#BFE8FF" opacity={0.8} />
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <rect x={-230 - k * 230} y={350} width={210} height={80} fill={['#3E7CB1', '#E9C46A', '#3C8D6E'][k]} stroke={INK} strokeWidth={4} />
                <text x={-125 - k * 230} y={400} textAnchor="middle" fontFamily={fonts.display} fontWeight={900} fontSize={26} fill="#0B1026">{['FOOD', 'FUEL', 'FOOD'][k]}</text>
              </g>
            ))}
          </g>
        </g>
      );
    }
    case 'homeoffice':
      // working from home: a lit window, a person at a laptop in a coat
      return (
        <g>
          <rect width={960} height={540} fill="#3A3048" />
          <rect x={0} y={420} width={960} height={120} fill="#5A3E2A" />
          <rect x={300} y={330} width={360} height={20} fill="#7A4E30" stroke={INK} strokeWidth={3} />
          <path d="M330,350 L330,440 M630,350 L630,440" stroke={INK} strokeWidth={8} />
          <rect x={410} y={250} width={150} height={84} rx={6} fill="#1A1E2A" stroke={INK} strokeWidth={4} />
          <rect x={420} y={258} width={130} height={66} fill="#8FC2F0" />
          <circle cx={485} cy={220} r={34} fill="#C2864F" stroke={INK} strokeWidth={3} transform="translate(-170,0)" />
          <path d="M260,330 Q315,250 370,330 Z" fill="#3E7CB1" stroke={INK} strokeWidth={3} />
          <circle cx={485} cy={292} r={70} fill="#BFE8FF" opacity={0.12} />
          <rect x={700} y={140} width={180} height={200} fill="#0C1430" stroke="#E9DCC6" strokeWidth={10} />
        </g>
      );
    case 'farm':
      return (
        <g>
          <rect width={960} height={540} fill="#1E1A28" />
          {[0, 1, 2].map((row) => (
            <g key={row}>
              <rect x={0} y={190 + row * 120} width={960} height={10} fill="#5A5E6A" />
              <rect x={0} y={110 + row * 120} width={960} height={8} fill="#FF5FD2" />
              {Array.from({length: 16}, (_, k) => (
                <path key={k} d={`M${30 + k * 60},${190 + row * 120} q-14,-20 -4,-34 q4,18 4,34 q4,-22 14,-32 q2,16 -14,32`} fill={['#5BBF6A', '#7FD27A', '#4EA85C'][(k + row) % 3]} stroke={INK} strokeWidth={2} />
              ))}
            </g>
          ))}
          <rect width={960} height={540} fill="#FF5FD2" opacity={0.08} />
        </g>
      );
    case 'classroom':
      return (
        <g>
          <rect width={960} height={540} fill="#8C9AAE" />
          <rect x={60} y={80} width={420} height={220} fill="#2F4A3A" stroke="#7A4E30" strokeWidth={10} />
          <circle cx={200} cy={190} r={50} fill="none" stroke="#FFE7A6" strokeWidth={6} />
          {Array.from({length: 8}, (_, k) => <path key={k} d={`M200,190 L${200 + 80 * Math.cos(k * 0.785)},${190 + 80 * Math.sin(k * 0.785)}`} stroke="#FFE7A6" strokeWidth={4} />)}
          {people(7, 500, 9, false, false)}
          <rect width={960} height={540} fill="#FFE9C0" opacity={0.1} />
        </g>
      );
    case 'rooftops':
      return (
        <g>
          {night()}
          {skyline(41, 460, '#161C36', 0.6)}
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
  // each presenter only moves their lips to their own voice: the anchor's words over the podium are voice-over
  const speaking = v === 'press' ? 'SCIENTIST' : 'ANCHOR';
  const line = lines.find((l) => l.speaker === speaking && c.t >= l.startInShot && c.t <= l.startInShot + (l.end - l.start));
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
                    {/* the same kind of feed twice never looks like a copy: a different camera on a different street */}
                    {(() => {
                      const rep = panels.slice(0, i).filter((q) => q.kind === pn.kind).length;
                      // a tighter lens and a sideways pan, never further than the zoom leaves room for, so the
                      // picture always fills the panel (a pan wider than 480·(z−1) shows the empty edge of the feed)
                      const z = rep ? 1.16 + 0.06 * Math.min(rep - 1, 2) : 1;
                      const room = 480 * (z - 1) * 0.85;
                      const dx = rep ? (rep % 2 === 1 ? -room : room) : 0;
                      const dy = rep ? (rep % 2 === 1 ? 18 : -18) : 0;
                      return (
                        <g transform={`translate(${480 + dx},${270 + dy}) scale(${z}) translate(-480,-270)`}>
                          <Feed kind={pn.kind} frame={c.frame + rep * 37} t={c.t} />
                        </g>
                      );
                    })()}
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
          <g transform="translate(560,870)">{person(80, 0, 0, 1.6, mouth)}</g>
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
            {person(87, 0, 0, 1.5, mouth)}
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
          {p.ship && draw >= 1 && (() => {
            // something inside the beam, coming toward us and slowing: a glowing speck partway along it
            const on = Math.min(1, Math.max(0, (c.t - (Number(p.shipAt) || 0.6)) / 0.6));
            const sx = star[0] - 200 + 200 * 0.6;
            const sy = star[1] + 600 - 600 * 0.6;
            return (
              <g opacity={on}>
                <circle cx={sx} cy={sy} r={34 + 6 * Math.sin(c.frame * 0.3)} fill="#FFF3C0" opacity={0.25} />
                <circle cx={sx} cy={sy} r={9} fill="#FFFFFF" />
                <circle cx={sx} cy={sy} r={58} fill="none" stroke="#7FD8FF" strokeWidth={4} strokeDasharray="10 8" />
                <path d={`M${sx - 70},${sy - 40} L${sx - 70},${sy + 70}`} stroke="#7FD8FF" strokeWidth={6} markerEnd="none" />
                <path d={`M${sx - 86},${sy + 50} L${sx - 70},${sy + 74} L${sx - 54},${sy + 50}`} stroke="#7FD8FF" strokeWidth={6} fill="none" />
                <text x={sx - 100} y={sy + 6} textAnchor="end" fontFamily={fonts.display} fontWeight={900} fontSize={38} fill="#FFFFFF">SOMETHING INSIDE</text>
                <text x={sx - 100} y={sy + 46} textAnchor="end" fontFamily={fonts.mono} fontSize={28} fill="#7FD8FF">COMING THIS WAY · SLOWING</text>
              </g>
            );
          })()}
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
