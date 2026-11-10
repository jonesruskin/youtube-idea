import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {useShot} from '../../engine/shot-context';
import {Body} from '../../fx/bodies';
import {INK, Vignette} from '../sun/stage';
import {rnd} from '../sea/parts';
import {F, HAND, MoonDisc} from './parts';

/**
 * File 002 (moon02) full-frame views, inserts and diagrams (scene 'moon', prop v). Every label sits inside the
 * safe area (x 100–1820, y 150–930) so no bar, tag or drift can cut it (docs/00 P8).
 *
 *   log      Nana's tide log, open: date / high water / the table said / the "no moon" column. p.rows, p.extra (0–1)
 *   sum      the hidden page: her Day 9 sum running down to "35 m", and a small sketch of the chapel steps. p.reveal
 *   deeds    the deeds of the ruined chapel, in Nana's coat pocket
 *   letter   1998: the harbour board's reply to her warning
 *   orbit    Earth and the Moon's orbit from above; the orbit shrinks from p.from to p.to (km); month length shown
 *   cube     the same sea, the Moon at half the distance: the tide is eight times higher
 *   sling    the visitor loops the Moon: its arrow grows, the Moon's shrinks
 *   grain    how small the visitor is: a grain of sand, and beside it a dot you cannot see
 *   roche    why it cannot hit: the Moon goes round; the dashed ring it would break at is far inside
 *   leaves   the visitor flies off; the Moon's new small orbit stays
 *   p.headline on any view: shown as a news broadcast (LIVE bug + lower third)
 *   title    the title card (p.titleLines);  end  the end card (p.prompt)
 */
const W = 1920;
const H = 1080;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const km = (n: number) => `${(Math.round(n / 1000) * 1000).toLocaleString('en-US')} km`;

const Label: React.FC<{x: number; y: number; t: string; s?: number; c?: string; a?: 'start' | 'middle' | 'end'; o?: number}> = ({x, y, t, s = 38, c = '#FFFFFF', a = 'middle', o = 1}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={F} fontWeight={800} fontSize={s} fill={c} opacity={o} stroke="#0B1026" strokeWidth={s * 0.18} paintOrder="stroke">
    {t}
  </text>
);
/** p.headline turns any view into a news broadcast: a LIVE bug and a lower third (both inside the safe area). */
let HEADLINE: string | undefined;
/** Every insert drifts: a slow push-in (6% over the whole insert, continued across autoSplit parts) so no frame is a
 *  still picture (qa_motion idle gate). The news lower third and vignette stay fixed, like a real broadcast. */
const Frame: React.FC<{children: React.ReactNode; bg?: string; still?: boolean}> = ({children, bg = '#070B1E', still}) => {
  const {t, dur, props: p} = useShot();
  const part = p.part as [number, number] | undefined;
  const k0 = clamp(t / Math.max(0.5, dur));
  const k = part ? (part[0] + k0) / part[1] : k0;
  const z = still ? 1 : 1 + 0.06 * k;
  return (
  <AbsoluteFill style={{background: bg}}>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
      <g transform={`translate(${W / 2},${H / 2}) scale(${z}) translate(${-W / 2 + (still ? 0 : 12 * k)},${-H / 2 + (still ? 0 : 6 * k)})`}>{children}</g>
      {HEADLINE && (
        <g>
          <rect x={1580} y={150} width={150} height={52} rx={8} fill="#C2464F" />
          <circle cx={1608} cy={176} r={9} fill="#FFFFFF" />
          <text x={1630} y={188} fontFamily={F} fontWeight={800} fontSize={30} fill="#FFFFFF">LIVE</text>
          <rect x={100} y={846} width={1720} height={84} fill="#C2464F" />
          <rect x={100} y={846} width={200} height={84} fill="#8E2A34" />
          <text x={200} y={900} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={32} fill="#FFFFFF">NEWS</text>
          <text x={330} y={904} fontFamily={F} fontWeight={900} fontSize={46} fill="#FFFFFF">{HEADLINE}</text>
        </g>
      )}
      <Vignette amount={0.4} full />
    </svg>
  </AbsoluteFill>
  );
};
const Stars: React.FC<{frame: number; seed?: number}> = ({frame, seed = 3}) => {
  const r = rnd(seed);
  return (
    <g>
      {Array.from({length: 180}, (_, i) => (
        <circle key={i} cx={r() * W} cy={r() * H} r={0.8 + r() * 1.6} fill="#FFFFFF" opacity={0.35 + 0.4 * Math.abs(Math.sin(frame * 0.03 + i))} />
      ))}
    </g>
  );
};
/** The real Earth (NASA Blue Marble, src/fx/bodies.tsx). `bulge` draws the ocean pulled toward the Moon as a pale
 *  water shell around it (exaggerated so it can be seen; the real bulge is metres on a 6,371 km planet, and the
 *  diagram says "TIDES ×", never a size). */
const Earth: React.FC<{x: number; y: number; r: number; bulge?: number; ang?: number}> = ({x, y, r, bulge = 0, ang = 0}) => (
  <g>
    {bulge > 0 && <ellipse cx={x} cy={y} rx={r * (1.04 + bulge)} ry={r * (1.04 - bulge * 0.5)} fill="#8FD0F4" opacity={0.45} stroke="#DDF2FF" strokeWidth={2} transform={`rotate(${ang},${x},${y})`} />}
    <Body name="earth-atlantic" x={x} y={y} r={r} />
    <circle cx={x} cy={y} r={r * 1.03} fill="none" stroke="#9FD8FF" strokeWidth={Math.max(2, r * 0.03)} opacity={0.5} />
  </g>
);

/** A lined ledger page with a red margin, slightly turned. */
const Page: React.FC<{children: React.ReactNode; x?: number; y?: number; w?: number; h?: number; rot?: number}> = ({children, x = 360, y = 130, w = 1200, h = 840, rot = -1.5}) => (
  <g transform={`rotate(${rot},960,540)`}>
    <rect x={x + 14} y={y + 16} width={w} height={h} fill="#000" opacity={0.35} />
    <rect x={x} y={y} width={w} height={h} fill="#F6EFD9" stroke={INK} strokeWidth={5} />
    {Array.from({length: Math.floor((h - 120) / 62)}, (_, i) => (
      <line key={i} x1={x + 20} y1={y + 150 + i * 62} x2={x + w - 20} y2={y + 150 + i * 62} stroke="#9DB7CF" strokeWidth={2} />
    ))}
    <line x1={x + 110} y1={y + 10} x2={x + 110} y2={y + h - 10} stroke="#D9837F" strokeWidth={3} />
    {children}
  </g>
);

export const MoonScene: React.FC = () => {
  const {t, frame, dur, props: p} = useShot();
  const v = p.v as string;
  HEADLINE = p.headline as string | undefined;
  const part = p.part as [number, number] | undefined;
  const k0 = clamp(t / Math.max(part ? 1 : 2, dur - (part ? 0.2 : 0.5)));
  const k = part ? (part[0] + k0) / part[1] : k0;

  if (v === 'log') {
    // rows: [date, high water, table, extra]; the last row is written in as we watch
    const rows = (p.rows as [string, string, string, string][]) ?? [];
    const showExtra = (p.extra as number) ?? 0;
    return (
      <Frame bg="#3A2A1E">
        <rect width={W} height={H} fill="#4A3626" />
        <Page>
          <text x={500} y={236} fontFamily={HAND} fontWeight={700} fontSize={54} fill="#2A2A3A">Saltmouth · high water</text>
          {['day', 'high water', 'table said', 'no moon'].map((h, i) => (
            <text key={h} x={[400, 620, 930, 1240][i]} y={298} fontFamily={F} fontWeight={700} fontSize={30} fill={i === 3 ? '#B2473E' : '#55607A'} opacity={i === 3 ? showExtra : 1}>
              {h}
            </text>
          ))}
          {rows.map((r, i) => {
            const last = i === rows.length - 1;
            const w = last ? clamp((k - 0.15) * 2.2) : 1;
            return (
              <g key={i} opacity={last ? clamp(w * 3) : 0.92}>
                {r.map((cell, j) => (
                  <text key={j} x={[400, 620, 930, 1240][j]} y={360 + i * 62} fontFamily={HAND} fontWeight={700} fontSize={50} fill={j === 3 ? '#B2473E' : j === 1 && last ? '#1F3A7A' : '#2A2A3A'} opacity={j === 3 ? showExtra : 1}>
                    {cell}
                  </text>
                ))}
              </g>
            );
          })}
          {showExtra > 0 && <ellipse cx={1310} cy={344 + (rows.length - 1) * 62} rx={110} ry={38} fill="none" stroke="#B2473E" strokeWidth={5} opacity={showExtra * clamp((k - 0.5) * 3)} />}
        </Page>
      </Frame>
    );
  }

  if (v === 'sum') {
    // the hidden page: each loop's drop, carried forward by hand, to the last high water
    const lines: [string, string][] = [['Day 9', 'drop 5,300 km'], ['next', '5,300 × 1.04'], ['and next', '× 1.04 again'], ['…', '26 loops'], ['Day 200', '128,000 km']];
    const reveal = clamp((k - 0.45) * 2.5);
    return (
      <Frame bg="#3A2A1E">
        <rect width={W} height={H} fill="#4A3626" />
        <Page>
          <text x={500} y={236} fontFamily={HAND} fontWeight={700} fontSize={54} fill="#2A2A3A">if every loop takes a little more…</text>
          {lines.map(([a, b], i) => (
            <g key={i} opacity={clamp(k * 6 - i * 0.5)}>
              <text x={500} y={330 + i * 62} fontFamily={HAND} fontWeight={700} fontSize={48} fill="#2A2A3A">{a}</text>
              <text x={800} y={330 + i * 62} fontFamily={HAND} fontWeight={700} fontSize={48} fill="#2A2A3A">{b}</text>
            </g>
          ))}
          <g opacity={reveal}>
            <text x={500} y={720} fontFamily={HAND} fontWeight={700} fontSize={62} fill="#1F3A7A">last high water:</text>
            <text x={1000} y={724} fontFamily={HAND} fontWeight={700} fontSize={96} fill="#B2473E">35 m</text>
            <ellipse cx={1090} cy={694} rx={170} ry={66} fill="none" stroke="#B2473E" strokeWidth={6} />
            {/* her sketch of the chapel steps with the line */}
            <g transform="translate(1250,470)">
              <path d="M0,160 L60,160 L60,120 L120,120 L120,80 L180,80 L180,40 L240,40 L240,0 L300,0" stroke="#2A2A3A" strokeWidth={5} fill="none" />
              <line x1={150} y1={80} x2={270} y2={80} stroke="#B2473E" strokeWidth={7} />
              <text x={90} y={210} fontFamily={HAND} fontWeight={700} fontSize={40} fill="#2A2A3A">chapel steps</text>
            </g>
          </g>
        </Page>
      </Frame>
    );
  }

  if (v === 'deeds' || v === 'letter') {
    const deeds = v === 'deeds';
    const body = deeds
      ? ['CONVEYANCE OF LAND', '', 'The ruined chapel and its ground', 'on Chapel Hill, Saltmouth.', '', 'Sold to: Mrs. Odile Marsh', 'for the sum of one hundred pounds.']
      : ['SALTMOUTH HARBOUR BOARD', '12 November 1998', '', 'Dear Mrs. Marsh,', 'The Board has considered your letter', 'about a flood this winter. We see', 'no cause for alarm.']
    ;
    return (
      <Frame bg="#2A2A34">
        <rect width={W} height={H} fill="#34343F" />
        <g transform="rotate(2,960,540)">
          <rect x={434} y={146} width={1080} height={800} fill="#000" opacity={0.35} />
          <rect x={420} y={130} width={1080} height={800} fill="#FBF6EA" stroke={INK} strokeWidth={5} />
          {body.map((l, i) => (
            <text key={i} x={600} y={290 + i * 76} fontFamily={i === 0 ? F : "'IBM Plex Mono', monospace"} fontWeight={i === 0 ? 800 : 500} fontSize={i === 0 ? 46 : 38} fill="#2A2A3A" opacity={clamp(k * 5 - i * 0.25)}>
              {l}
            </text>
          ))}
          {deeds && (
            <g transform="translate(1340,830)" opacity={clamp((k - 0.4) * 3)}>
              <circle r={70} fill="none" stroke="#B2473E" strokeWidth={7} />
              <text y={12} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={30} fill="#B2473E" transform="rotate(-14)">DAY 12</text>
            </g>
          )}
        </g>
      </Frame>
    );
  }

  if (v === 'orbit' || v === 'leaves') {
    // from above: the Earth, the old orbit (dashed) and the Moon's orbit now
    const leaves = v === 'leaves';
    const from = (p.from as number) ?? 384000;
    const to = (p.to as number) ?? from;
    const d = from + (to - from) * ease(clamp(k * 1.3));
    const sc = 400 / 384000;
    const R = d * sc;
    const cx = 760;
    const cy = 540;
    const a = frame * 0.02 * Math.pow(384000 / d, 1.5) * 0.5;
    const month = 27.3 * Math.pow(d / 384000, 1.5);
    const vk = clamp((k - 0.2) * 1.4);
    return (
      <Frame>
        <Stars frame={frame} />
        <circle cx={cx} cy={cy} r={400} fill="none" stroke="#8FA3C8" strokeWidth={3} strokeDasharray="10 12" opacity={0.6} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#FFE08A" strokeWidth={4} opacity={0.9} />
        <Earth x={cx} y={cy} r={44} bulge={Math.min(0.2, 0.012 * Math.pow(384000 / d, 3))} ang={(a * 180) / Math.PI} />
        <Body name="moon" x={cx + Math.cos(a) * R} y={cy + Math.sin(a) * R} r={16} />
        {leaves && (
          <g>
            {/* the visitor's path: out of the last loop and away */}
            <path d={`M${cx + R},${cy} C${cx + R + 200},${cy - 320} ${1500},${cy - 420} ${1500 + vk * 380},${cy - 470 - vk * 60}`} stroke="#FF8A7A" strokeWidth={4} strokeDasharray="6 10" fill="none" opacity={0.9} />
            <circle cx={1500 + vk * 380} cy={cy - 470 - vk * 60} r={7} fill="#FF8A7A" />
            <Label x={1430} y={250} t="THE VISITOR LEAVES" s={34} c="#FF8A7A" />
          </g>
        )}
        <Label x={1420} y={470} t={km(d)} s={78} c="#FFE08A" />
        <Label x={1420} y={550} t={`ONE MONTH = ${month.toFixed(month < 10 ? 1 : 0)} DAYS`} s={36} />
        <Label x={1420} y={612} t={`TIDES × ${Math.pow(384000 / d, 3).toFixed(d > 300000 ? 1 : 0)}`} s={36} c="#9FD8FF" />
        <Label x={1420} y={690} t="DASHED: WHERE IT USED TO BE" s={28} c="#8FA3C8" />
      </Frame>
    );
  }

  if (v === 'cube') {
    // two shores: the Moon far and the Moon at half the distance; the tide is eight times higher
    const hi = 30 + 210 * ease(clamp((k - 0.3) * 2));
    return (
      <Frame bg="#0B1230">
        <rect width={W} height={H} fill="#0E1740" />
        {[0, 1].map((i) => {
          const x0 = 140 + i * 860;
          const tide = i ? hi : 30;
          return (
            <g key={i}>
              <MoonDisc x={x0 + 390} y={i ? 330 : 250} k={i ? 2 : 1} base={52} tod="night" />
              <rect x={x0} y={820 - tide} width={780} height={tide + 110} fill="#3F8FBF" opacity={0.9} />
              <path d={`M${x0 + 500},930 L${x0 + 500},640 L${x0 + 780},640 L${x0 + 780},930 Z`} fill="#7C8696" stroke={INK} strokeWidth={5} />
              <rect x={x0 + 560} y={500} width={150} height={140} fill="#E9E2D0" stroke={INK} strokeWidth={4} />
              <path d={`M${x0 + 545},500 L${x0 + 635},440 L${x0 + 725},500 Z`} fill="#4E5868" stroke={INK} strokeWidth={4} />
              <line x1={x0} y1={790} x2={x0 + 500} y2={790} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="8 8" opacity={0.6} />
              <Label x={x0 + 390} y={i ? 190 : 170} t={i ? 'HALF THE DISTANCE' : 'THE MOON TODAY'} s={34} c="#FFE08A" />
              <Label x={x0 + 250} y={900} t={i ? 'TIDE × 8' : 'TIDE × 1'} s={52} c="#9FD8FF" o={i ? clamp((k - 0.5) * 3) : 1} />
            </g>
          );
        })}
      </Frame>
    );
  }

  if (v === 'sling') {
    // the visitor swings round the Moon: each pass, its speed arrow grows and the Moon's shrinks
    const pass = Math.floor(k * 3);
    const u = (k * 3) % 1;
    const ang = -2.2 + u * 4.4;
    const mx = 860;
    const my = 560;
    const vx = mx + Math.cos(ang) * (150 + Math.abs(ang) * 160);
    const vy = my + Math.sin(ang) * (150 + Math.abs(ang) * 110);
    const moonV = 300 - pass * 60 - u * 60;
    const visV = 120 + pass * 70 + u * 70;
    return (
      <Frame>
        <Stars frame={frame} seed={9} />
        <MoonDisc x={mx} y={my} k={1.6} base={52} tod="night" />
        <path d={`M${mx - 520},${my - 300} Q${mx + 330},${my - 40} ${mx - 520},${my + 320}`} stroke="#FF8A7A" strokeWidth={3} strokeDasharray="6 12" fill="none" opacity={0.7} />
        <circle cx={vx} cy={vy} r={9} fill="#FF8A7A" />
        <circle cx={vx} cy={vy} r={22} fill="none" stroke="#FF8A7A" strokeWidth={2} opacity={0.5} />
        <Label x={420} y={230} t="THE VISITOR" s={34} c="#FF8A7A" a="start" />
        {/* speed bars */}
        <g transform="translate(1180,360)">
          <Label x={0} y={0} t="MOON'S SPEED" s={32} a="start" />
          <rect x={0} y={24} width={480} height={34} rx={8} fill="#FFFFFF" opacity={0.15} />
          <rect x={0} y={24} width={Math.max(40, moonV * 1.5)} height={34} rx={8} fill="#F4F0DC" />
          <Label x={0} y={170} t="VISITOR'S SPEED" s={32} c="#FF8A7A" a="start" />
          <rect x={0} y={194} width={480} height={34} rx={8} fill="#FFFFFF" opacity={0.15} />
          <rect x={0} y={194} width={Math.min(480, visV * 1.5)} height={34} rx={8} fill="#FF8A7A" />
          <Label x={0} y={340} t={`LOOP ${pass + 1}`} s={54} c="#FFE08A" a="start" />
        </g>
      </Frame>
    );
  }

  if (v === 'grain') {
    const z = ease(clamp((k - 0.25) * 1.6));
    return (
      <Frame bg="#0B1230">
        <rect width={W} height={H} fill="#101A3E" />
        {/* a fingertip with one grain of sand; beside the grain, an arrow at nothing */}
        <path d="M-100,1200 Q200,700 620,640 Q820,620 900,720 Q940,800 820,880 Q520,1000 300,1300 Z" fill="#E8C4A2" stroke={INK} strokeWidth={6} />
        <path d="M740,650 Q860,640 900,720" stroke="#F6DCC6" strokeWidth={18} fill="none" strokeLinecap="round" />
        <circle cx={1010} cy={600} r={16 + z * 6} fill="#E3C27A" stroke={INK} strokeWidth={4} />
        <Label x={1010} y={520} t="A GRAIN OF SAND" s={34} c="#FFE08A" />
        <g opacity={clamp((k - 0.4) * 3)}>
          <circle cx={1330} cy={600} r={1.6} fill="#FF8A7A" />
          <circle cx={1330} cy={600} r={34} fill="none" stroke="#FF8A7A" strokeWidth={3} strokeDasharray="5 7" />
          <Label x={1330} y={520} t="THE VISITOR" s={34} c="#FF8A7A" />
          <Label x={1330} y={700} t="25 TIMES SMALLER" s={30} />
          <Label x={1330} y={748} t="A THIRD OF THE MOON'S WEIGHT" s={30} />
        </g>
      </Frame>
    );
  }

  if (v === 'roche') {
    // the Moon goes round and round; the ring where a moon would break is far inside its new orbit
    const a = frame * 0.03;
    const cx = 960;
    const cy = 560;
    return (
      <Frame>
        <Stars frame={frame} seed={5} />
        <circle cx={cx} cy={cy} r={360} fill="none" stroke="#FFE08A" strokeWidth={4} />
        <circle cx={cx} cy={cy} r={86} fill="none" stroke="#FF8A7A" strokeWidth={4} strokeDasharray="8 10" opacity={clamp((k - 0.35) * 3)} />
        <Earth x={cx} y={cy} r={44} />
        <Body name="moon" x={cx + Math.cos(a) * 360} y={cy + Math.sin(a) * 360} r={30} />
        <Label x={cx} y={180} t="IT GOES ROUND. IT CANNOT FALL IN." s={40} c="#FFE08A" />
        <g opacity={clamp((k - 0.4) * 3)}>
          <line x1={cx + 70} y1={cy - 60} x2={cx + 300} y2={cy - 250} stroke="#FF8A7A" strokeWidth={3} />
          <Label x={cx + 310} y={cy - 262} t="A MOON THIS CLOSE BREAKS UP" s={30} c="#FF8A7A" a="start" />
          <Label x={cx + 310} y={cy - 220} t="OURS STAYS 7 TIMES FURTHER OUT" s={30} a="start" />
        </g>
      </Frame>
    );
  }

  if (v === 'world') {
    // the whole Earth, its oceans pulled into two bulges toward a Moon that is far too close
    const a = frame * 0.004;
    return (
      <Frame>
        <Stars frame={frame} seed={13} />
        <Earth x={820} y={540} r={250} bulge={0.09} ang={-18} />
        <MoonDisc x={1500 + Math.cos(a) * 20} y={330 + Math.sin(a) * 20} k={(p.moon as number) ?? 2} base={60} tod="night" />
        <Label x={1010} y={200} t={(p.label as string) ?? 'EVERY PORT ON EARTH: CLOSED'} s={42} c="#FFE08A" />
        <Label x={820} y={HEADLINE ? 828 : 900} t={(p.sub as string) ?? ''} s={32} />
      </Frame>
    );
  }

  if (v === 'title' || v === 'end') {
    const title = v === 'title';
    const lines = (p.titleLines as string[]) ?? ['THE MOON GOT CLOSER', 'EVERY NIGHT'];
    const longest = Math.max(...lines.map((l) => l.length));
    const size = Math.min(120, Math.floor((1700 / longest - 8) / 0.9));
    const grow = 1.4 + 1.2 * ease(clamp(k * 1.2));
    return (
      <Frame bg="#03050F" still={!title}>
        <Stars frame={frame} seed={21} />
        <MoonDisc x={960} y={title ? 330 : 300} k={title ? grow : 2.2} base={62} tod="night" />
        {title ? (
          lines.map((l, i) => (
            <text key={i} x={960} y={720 + i * (size + 24)} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={size} letterSpacing={6} fill={i === lines.length - 1 ? '#FFE08A' : '#FFF6E0'} opacity={clamp(k * 4 - i * 0.6)}>
              {l}
            </text>
          ))
        ) : (
          <g>
            <text x={960} y={610} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={84} letterSpacing={8} fill="#FFF6E0">THE BLINK FILES</text>
            <text x={960} y={672} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={32} letterSpacing={4} fill="#9FD8FF">{(p.prompt as string) ?? ''}</text>
            <text x={720} y={740} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={24} letterSpacing={4} fill="#FFF6E0" opacity={0.8}>WATCH NEXT</text>
            <rect x={540} y={756} width={360} height={200} rx={10} fill="#0E1740" stroke="#9FD8FF" strokeWidth={2} strokeDasharray="6 6" />
            <text x={1200} y={740} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={24} letterSpacing={4} fill="#FFF6E0" opacity={0.8}>SUBSCRIBE</text>
            <circle cx={1200} cy={856} r={90} fill="#0E1740" stroke="#9FD8FF" strokeWidth={2} strokeDasharray="6 6" />
          </g>
        )}
      </Frame>
    );
  }

  throw new Error(`MoonScene: unknown view "${v}"`);
};
