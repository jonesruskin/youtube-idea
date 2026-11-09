import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Toon} from '../../characters/toon/Toon';
import {CAST} from '../../characters/toon/design';
import {FACES} from '../../characters/toon/face';
import {POSES} from '../../characters/toon/poses';
import {useShot} from '../../engine/shot-context';
import {INK, Vignette} from '../sun/stage';
import {NightSky, rnd} from '../sea/parts';

/** File 002 (vol02) full-frame views, inserts and diagrams (scene 'vol', prop v). */
const W = 1920;
const H = 1080;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const F = "'Space Grotesk', sans-serif";
const Label: React.FC<{x: number; y: number; t: string; s?: number; c?: string; a?: 'start' | 'middle' | 'end'; o?: number}> = ({x, y, t, s = 34, c = '#FFFFFF', a = 'middle', o = 1}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={F} fontWeight={800} fontSize={s} fill={c} opacity={o} stroke="#0B1026" strokeWidth={s * 0.18} paintOrder="stroke">
    {t}
  </text>
);
const Frame: React.FC<{children: React.ReactNode; bg?: string; frame: number; drift?: boolean}> = ({children, bg = '#0B1230', frame, drift = true}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
      <g transform={drift ? `translate(${960 + Math.sin(frame * 0.02) * 10},${540 + Math.cos(frame * 0.017) * 8}) scale(${1 + frame * 0.0005}) translate(-960,-540)` : undefined}>{children}</g>
      <Vignette amount={0.5} />
    </svg>
  </AbsoluteFill>
);

// Auckland, simplified: the isthmus between two harbours, with the volcano dots (unit box → screen)
const LAND = 'M80,620 Q260,520 420,560 Q560,600 700,520 Q860,430 1020,470 Q1180,510 1320,430 Q1480,350 1640,400 Q1760,440 1860,380 L1860,1080 L80,1080 Z';
const NORTH = 'M80,200 Q300,260 520,230 Q760,200 980,260 Q1200,320 1420,250 Q1640,190 1860,230 L1860,0 L80,0 Z';
const VOLCANOES = Array.from({length: 52}, (_, i) => {
  const r = rnd(i + 11);
  return [180 + r() * 1580, 560 + r() * 380] as [number, number];
});
const HOME: [number, number] = [1180, 720];
const HARBOUR_GUESS: [number, number] = [980, 420];

const Map: React.FC<{frame: number; dots?: number; children?: React.ReactNode}> = ({frame, dots = 1, children}) => (
  <g>
    <rect x={0} y={0} width={W} height={H} fill="#16405E" />
    <path d={NORTH} fill="#3A6A4A" stroke={INK} strokeWidth={4} />
    <path d={LAND} fill="#4A7A52" stroke={INK} strokeWidth={4} />
    {Array.from({length: 14}, (_, i) => (
      <path key={i} d={`M${100 + i * 130},${640 + (i % 3) * 120} l${60 + (i % 2) * 40},${-20 + (i % 3) * 18}`} stroke="#6A9A6A" strokeWidth={6} opacity={0.5} />
    ))}
    {/* Rangitoto, the youngest, in the harbour */}
    <path d="M1380,330 Q1440,250 1500,330 Z" fill="#5A6A4A" stroke={INK} strokeWidth={4} />
    <Label x={1440} y={370} t="RANGITOTO" s={22} />
    {VOLCANOES.slice(0, Math.round(52 * dots)).map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r={12} fill="#E8742A" stroke={INK} strokeWidth={3} />
        <circle cx={x} cy={y} r={4} fill="#5A2A0A" />
      </g>
    ))}
    {children}
  </g>
);

export const VolScene: React.FC = () => {
  const {t, frame, dur, props: p} = useShot();
  const v = p.v as string;
  const part = p.part as [number, number] | undefined; // autoSplit: this shot is part i of n of one animation
  const k0 = clamp(t / Math.max(part ? 1 : 2, dur - (part ? 0.2 : 0.5)));
  const k = part ? (part[0] + k0) / part[1] : k0;

  if (v === 'oneyear') {
    const close = !!p.close;
    return (
      <Frame frame={frame} bg="#BFE0F0">
        <rect x={0} y={0} width={W} height={H} fill="#BFE0F0" />
        <circle cx={1600} cy={180} r={80} fill="#FFF6C8" />
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx={300 + i * 600 + ((frame * 0.6) % 200)} cy={160 + i * 30} rx={150} ry={36} fill="#FFFFFF" opacity={0.85} />
        ))}
        <g transform={close ? 'translate(-480,-260) scale(1.5)' : undefined}>
          {/* the young cone: smooth grassy slopes, a crater rim, a path */}
          <path d="M260,900 Q700,380 960,360 Q1220,380 1660,900 Z" fill="#7FBF5A" stroke={INK} strokeWidth={6} />
          <path d="M820,372 Q960,410 1100,372" stroke="#5A8A3A" strokeWidth={10} fill="none" />
          <path d="M600,900 Q800,700 900,520 Q930,440 960,380" stroke="#E9DCC4" strokeWidth={10} fill="none" strokeDasharray="20 10" />
          {/* houses all around its foot */}
          {Array.from({length: 18}, (_, i) => (
            <g key={i} transform={`translate(${-60 + i * 120},${880 + (i % 2) * 40})`}>
              <rect x={-40} y={-50} width={80} height={50} fill={['#E9C46A', '#9FC8A8', '#E07A5F', '#BFD8E8'][i % 4]} stroke={INK} strokeWidth={3} />
              <path d="M-48,-50 L0,-82 L48,-50 Z" fill="#8A3A3A" stroke={INK} strokeWidth={3} />
            </g>
          ))}
          {/* kites */}
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${900 + i * 160 + Math.sin(frame * 0.04 + i) * 20},${200 + i * 50})`}>
              <path d="M0,-30 L22,0 L0,30 L-22,0 Z" fill={i ? '#E07A5F' : '#F2C94C'} stroke={INK} strokeWidth={3} />
              <path d="M0,30 Q-30,120 -60,200" stroke="#5A5A64" strokeWidth={2} fill="none" />
            </g>
          ))}
          {p.people && (
            <g>
              {(['mele', 'sione', 'lui', 'ana'] as const).map((who, i) => (
                <Toon key={who} d={CAST[who]} s={{x: 880 + i * 60, y: 392, scale: 0.42, facing: 'front', pose: who === 'ana' && close ? POSES.hold : POSES.stand, bob: 0, face: FACES.smile, turn: 0.2, look: [0.2, -0.3], talk: 0, blink: 0, outfit: who === 'ana' ? 'cold' : 'home', hoodUp: false, breath: 0, frame, rim: false, opacity: 1, watchGlow: 0, hold: who === 'ana' && close ? 'list' : undefined} as any} />
              ))}
            </g>
          )}
        </g>
      </Frame>
    );
  }

  if (v === 'alert') {
    const evac = p.mode === 'evac';
    return (
      <Frame frame={frame} bg="#101420">
        <rect x={0} y={0} width={W} height={H} fill="#1A2030" />
        {/* the alert's pulse lights the room */}
        <circle cx={960} cy={500} r={500 + 60 * Math.sin(frame * 0.4)} fill={evac ? '#C2464F' : '#E8742A'} opacity={0.12 + 0.08 * Math.sin(frame * 0.4)} />
        <g transform={`translate(660,${60 + (1 - clamp(t * 3)) * 60 + Math.sin(frame * 0.9) * 4}) rotate(${Math.sin(frame * 0.7) * 0.8},300,480)`}>
          <rect x={0} y={0} width={600} height={960} rx={60} fill="#1A1A1E" stroke={INK} strokeWidth={8} />
          <rect x={24} y={60} width={552} height={840} rx={24} fill="#2A3550" />
          <rect x={50} y={150} width={500} height={360} rx={24} fill={evac ? '#C2464F' : '#E8742A'} stroke={INK} strokeWidth={5} />
          <Label x={300} y={220} t="EMERGENCY ALERT" s={36} />
          <Label x={300} y={300} t={evac ? 'EVACUATE NOW' : 'VOLCANIC UNREST'} s={46} />
          <Label x={300} y={370} t={evac ? 'ZONE A · LEAVE WITHIN 2 HOURS' : 'EARTHQUAKES UNDER AUCKLAND'} s={26} />
          <Label x={300} y={440} t={evac ? 'TAKE ONLY WHAT YOU NEED' : 'STAY INFORMED · BE READY'} s={26} />
        </g>
      </Frame>
    );
  }

  if (v === 'magma') {
    const step = p.step ?? 0;
    const tip = step === 0 ? 900 - 120 * k : 780;
    const blur = step === 1;
    return (
      <Frame frame={frame}>
        <rect x={0} y={0} width={W} height={260} fill="#9FD0F0" />
        <rect x={0} y={250} width={W} height={830} fill="#5A4636" />
        {[400, 560, 720, 880].map((y, i) => (
          <path key={y} d={`M0,${y} Q960,${y - 30 + i * 10} 1920,${y}`} stroke="#4A382A" strokeWidth={6} fill="none" />
        ))}
        {/* the city on top, shaking with traffic in step 1 */}
        <g transform={blur ? `translate(${Math.sin(frame * 1.3) * 3},0)` : undefined}>
          {Array.from({length: 22}, (_, i) => (
            <rect key={i} x={i * 90} y={250 - 40 - ((i * 37) % 90)} width={70} height={40 + ((i * 37) % 90)} fill="#3A4A6A" stroke={INK} strokeWidth={3} />
          ))}
          {blur && (
            <g>
              <rect x={300 + ((frame * 8) % 1400)} y={226} width={90} height={24} fill="#C2464F" />
              <rect x={1500 - ((frame * 10) % 1400)} y={226} width={160} height={24} fill="#E9C46A" />
            </g>
          )}
        </g>
        {/* the rising finger of magma */}
        <path d={`M900,1080 Q930,${(tip + 1080) / 2} 960,${tip} Q990,${(tip + 1080) / 2} 1020,1080 Z`} fill="#FF6A2A" />
        <path d={`M940,1080 Q955,${(tip + 1080) / 2} 960,${tip + 30} Q965,${(tip + 1080) / 2} 980,1080 Z`} fill="#FFD27A" />
        {/* earthquake flashes around the tip */}
        {Array.from({length: 26}, (_, i) => {
          const r = rnd(i + 5);
          const on = Math.sin(frame * 0.3 + i * 2.1) > 0.7;
          const sx = 960 + (r() - 0.5) * (blur ? 700 : 160);
          const sy = tip + (r() - 0.3) * (blur ? 260 : 90);
          return on ? <circle key={i} cx={sx} cy={sy} r={blur ? 10 : 7} fill="#FFFFFF" opacity={blur ? 0.5 : 1} /> : null;
        })}
        {blur && <ellipse cx={960} cy={tip + 20} rx={380} ry={150} fill="none" stroke="#FFD27A" strokeWidth={4} strokeDasharray="14 12" />}
        <Label x={1500} y={tip} t={step === 0 ? `${Math.round(10 - k * 1)} KM DOWN` : 'WHERE EXACTLY?'} s={42} c="#FFD27A" />
      </Frame>
    );
  }

  if (v === 'field') {
    const dots = p.question ? 1 : clamp(k * 1.3);
    return (
      <Frame frame={frame}>
        <Map frame={frame} dots={dots} />
        <Label x={960} y={1010} t={`${Math.round(dots * 52) + (dots >= 1 ? 1 : 0)} VOLCANOES · EACH ERUPTED ONCE`} s={40} c="#FFD27A" />
        {p.question && (
          <g transform={`translate(${700 + Math.sin(t * 0.8) * 300},${700 + Math.cos(t * 0.6) * 80})`}>
            <circle r={90} fill="#FFFFFF" opacity={0.15} />
            <text textAnchor="middle" y={50} fontFamily={F} fontWeight={900} fontSize={160} fill="#FFFFFF" stroke="#0B1026" strokeWidth={10} paintOrder="stroke">
              ?
            </text>
          </g>
        )}
      </Frame>
    );
  }

  if (v === 'notebook' || v === 'anamap') {
    const map = v === 'anamap';
    return (
      <Frame frame={frame} bg="#2A1E14">
        <rect x={0} y={0} width={W} height={H} fill="#3A2A1C" />
        <g transform="translate(330,80) rotate(-2)">
          <rect x={0} y={0} width={1260} height={920} fill="#F4ECD8" stroke={INK} strokeWidth={6} />
          {Array.from({length: 15}, (_, i) => (
            <line key={i} x1={40} y1={100 + i * 54} x2={1220} y2={100 + i * 54} stroke="#B8C8E0" strokeWidth={2} />
          ))}
          {p.mode === 'log' ? (
            <g>
              <text x={80} y={80} fontFamily="'Caveat', 'Comic Neue', cursive" fontWeight={700} fontSize={54} fill="#3A3442">
                Magma depth (from the TV) · Thursday
              </text>
              {['9 AM · 1.6 km', '11 AM · 1.4 km', '1 PM · 1.1 km', '3 PM · 0.9 km', '5 PM · 0.7 km'].map((l, i) => {
                const show = clamp(k * 6 - i);
                return show > 0 ? (
                  <text key={i} x={100} y={200 + i * 120} fontFamily="'Caveat', 'Comic Neue', cursive" fontWeight={700} fontSize={62} fill={i === 4 ? '#C2464F' : '#1F2A44'} opacity={show}>
                    {l}
                  </text>
                ) : null;
              })}
            </g>
          ) : !map ? (
            <g>
              <text x={80} y={80} fontFamily="'Caveat', 'Comic Neue', cursive" fontWeight={700} fontSize={54} fill="#3A3442">
                Creek temperature · Mondays
              </text>
              {['Week 1 · 14 °C', 'Week 2 · 14 °C', 'Week 3 · 14 °C', 'Week 4 · 14 °C', 'Tuesday · 19 °C !!  bubbles?'].map((l, i) => {
                const show = clamp(k * 6 - i);
                return show > 0 ? (
                  <text key={i} x={100} y={200 + i * 120} fontFamily="'Caveat', 'Comic Neue', cursive" fontWeight={700} fontSize={i === 4 ? 70 : 58} fill={i === 4 ? '#C2464F' : '#1F2A44'} opacity={show}>
                    {l}
                  </text>
                ) : null;
              })}
              {k > 0.85 && <ellipse cx={330} cy={660} rx={250} ry={70} fill="none" stroke="#C2464F" strokeWidth={6} />}
            </g>
          ) : (
            <g>
              <text x={80} y={80} fontFamily="'Caveat', 'Comic Neue', cursive" fontWeight={700} fontSize={54} fill="#3A3442">
                Our neighbourhood
              </text>
              {/* hand-drawn streets */}
              <path d="M100,500 L1160,500 M640,140 L640,860 M300,140 L300,860 M980,140 L980,860" stroke="#7A8AA8" strokeWidth={10} strokeLinecap="round" />
              <text x={1000} y={490} fontFamily="'Caveat', cursive" fontWeight={700} fontSize={36} fill="#3A3442">
                Kōwhai St
              </text>
              <rect x={600} y={420} width={60} height={60} fill="#E07A5F" stroke={INK} strokeWidth={3} />
              <text x={590} y={410} fontFamily="'Caveat', cursive" fontWeight={700} fontSize={36} fill="#3A3442" textAnchor="end">
                home
              </text>
              <rect x={1060} y={560} width={120} height={120} fill="#7FBF5A" opacity={0.6} />
              <text x={1120} y={710} fontFamily="'Caveat', cursive" fontWeight={700} fontSize={32} fill="#3A3442" textAnchor="middle">
                park
              </text>
              {[
                [420, 300, '★ creek 19°', 0.15],
                [700, 620, '🐟 pond', 0.35],
                [940, 470, '🚌 bump', 0.55],
              ].map(([x, y, l, at], i) => (
                <g key={i} opacity={clamp((k - (at as number)) * 6)}>
                  <circle cx={x as number} cy={y as number} r={18} fill="#C2464F" />
                  <text x={(x as number) + 26} y={(y as number) + 10} fontFamily="'Caveat', cursive" fontWeight={700} fontSize={40} fill="#C2464F">
                    {l as string}
                  </text>
                </g>
              ))}
              {k > 0.7 && <circle cx={680} cy={470} r={340 * clamp((k - 0.7) * 4)} fill="none" stroke="#C2464F" strokeWidth={7} strokeDasharray="20 10" />}
            </g>
          )}
        </g>
      </Frame>
    );
  }

  if (v === 'co2' || v === 'uplift') {
    const up = v === 'uplift';
    const bulge = up ? 60 * k : 0;
    return (
      <Frame frame={frame}>
        <rect x={0} y={0} width={W} height={H} fill="#9FD0F0" />
        <path d={`M0,560 L700,560 Q960,${560 - bulge} 1220,560 L1920,560 L1920,1080 L0,1080 Z`} fill="#6A5240" />
        {/* the hollow with the pond, the creek */}
        {!up && (
          <g>
            <path d="M1300,560 Q1450,640 1600,560" fill="#3E7CB1" stroke={INK} strokeWidth={4} />
            <path d="M300,560 L500,560 L480,580 L320,580 Z" fill="#4F86A6" />
          </g>
        )}
        {/* magma below */}
        <ellipse cx={960} cy={1000 - (up ? k * 120 : 60)} rx={260} ry={120} fill="#FF6A2A" />
        {!up &&
          Array.from({length: 40}, (_, i) => {
            const r = rnd(i + 3);
            const x = 700 + r() * 520;
            const y = 900 - ((frame * (2 + r() * 2) + r() * 400) % 400);
            return <circle key={i} cx={x + Math.sin(y * 0.02) * 30} cy={y} r={6} fill="#D8E8F0" opacity={0.8} />;
          })}
        {!up && (
          <g>
            <path d={`M1300,560 Q1450,${560 + 70} 1600,560`} fill="#B8C8D8" opacity={0.5 + 0.2 * Math.sin(frame * 0.1)} />
            <Label x={1450} y={520} t="GAS SINKS INTO THE HOLLOW" s={30} />
            <Label x={420} y={520} t="CREEK FIZZES" s={30} />
            <Label x={960} y={1050} t="CO₂ · HEAVIER THAN AIR" s={34} c="#FFD27A" />
          </g>
        )}
        {up && (
          <g>
            {/* road and a GPS station riding up */}
            <path d={`M500,560 L700,560 Q960,${560 - bulge} 1220,560 L1420,560`} stroke="#3A3A44" strokeWidth={22} fill="none" />
            <g transform={`translate(960,${560 - bulge})`}>
              <path d="M0,0 L0,-80" stroke="#E9E4DA" strokeWidth={8} />
              <circle cx={0} cy={-92} r={16} fill="#E9E4DA" stroke={INK} strokeWidth={4} />
              <path d={`M60,-40 l0,-${40 + bulge} m-18,22 l18,-22 l18,22`} stroke="#FFD27A" strokeWidth={8} fill="none" />
            </g>
            <Label x={960} y={380 - bulge} t={`GROUND RISES · +${Math.round(4 * k)} CM`} s={40} c="#FFD27A" />
          </g>
        )}
      </Frame>
    );
  }

  if (v === 'zone') {
    const from = HARBOUR_GUESS;
    const cx = interpolate(k, [0.15, 0.8], [from[0], HOME[0] + 20], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
    const cy = interpolate(k, [0.15, 0.8], [from[1], HOME[1] - 10], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
    const r = interpolate(k, [0.15, 0.8], [420, 300], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <Frame frame={frame}>
        <Map frame={frame} dots={1}>
          <circle cx={cx} cy={cy} r={r} fill="#FF3A2A" opacity={0.22} stroke="#FF5A4A" strokeWidth={6} strokeDasharray="20 12" />
          <circle cx={HOME[0]} cy={HOME[1]} r={14} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
          <Label x={HOME[0] + 26} y={HOME[1] + 12} t="OUR STREET" s={30} a="start" />
          <Label x={cx} y={cy - r - 20} t="EVACUATION ZONE" s={34} c="#FFB0A0" />
        </Map>
      </Frame>
    );
  }

  if (v === 'footprints') {
    return (
      <Frame frame={frame} bg="#8A8A84">
        <rect x={0} y={0} width={W} height={H} fill="#9A9890" />
        {Array.from({length: 40}, (_, i) => {
          const r = rnd(i + 8);
          return <circle key={i} cx={r() * W} cy={r() * H} r={2 + r() * 4} fill="#7A7870" />;
        })}
        {/* adults, a child and a dog, all walking the same way, away from the sea (left) */}
        {Array.from({length: 7}, (_, i) => {
          const x = 260 + i * 220;
          const show = clamp(k * 8 - i);
          return (
            <g key={i} opacity={show}>
              <ellipse cx={x} cy={420 + (i % 2) * 50} rx={26} ry={58} fill="#5A5850" transform={`rotate(80,${x},${420 + (i % 2) * 50})`} />
              <ellipse cx={x + 60} cy={600 + (i % 2) * 34} rx={16} ry={38} fill="#5A5850" transform={`rotate(80,${x + 60},${600 + (i % 2) * 34})`} />
              {[0, 1, 2, 3].map((j) => (
                <circle key={j} cx={x + 120 + (j % 2) * 10} cy={780 + (j < 2 ? 0 : 26) + (j % 2) * 8} r={j < 2 ? 7 : 10} fill="#5A5850" />
              ))}
            </g>
          );
        })}
        <Label x={960} y={140} t="MOTUTAPU ISLAND · ASH FROM RANGITOTO · ABOUT 600 YEARS AGO" s={36} />
      </Frame>
    );
  }

  if (v === 'eruption') {
    const f = clamp((t - 0.3) / 0.3);
    const col = clamp((t - 0.4) / Math.max(1.5, dur - 0.8));
    return (
      <Frame frame={frame} bg="#03050F">
        <NightSky frame={frame} seed={44} top="#03050F" bottom="#141C3A" count={280} />
        {f > 0 && t < 0.9 && <rect x={0} y={0} width={W} height={H} fill="#FFF0D0" opacity={0.6 * (1 - (t - 0.3) / 0.6)} />}
        {/* the column: billowing puffs of steam and ash, widening as they rise, lit orange from below */}
        {col > 0 &&
          Array.from({length: 26}, (_, n) => {
            const q = n / 25;
            if (q > col) return null;
            const y = 860 - q * 780;
            const r = 50 + q * 190;
            const wob = Math.sin(frame * 0.05 + n * 1.7) * (10 + q * 30);
            return (
              <g key={n}>
                <circle cx={960 + wob - r * 0.35} cy={y} r={r * 0.7} fill={q < 0.25 ? '#E8D8C8' : '#C8C0B8'} stroke={INK} strokeWidth={3} />
                <circle cx={960 + wob + r * 0.35} cy={y - r * 0.15} r={r * 0.62} fill={q < 0.25 ? '#F0E4D4' : '#D4CCC4'} stroke={INK} strokeWidth={3} />
              </g>
            );
          })}
        {col > 0 && <ellipse cx={960} cy={840} rx={180} ry={60} fill="#FF8A3A" opacity={0.5} />}
        <ellipse cx={960} cy={860} rx={140} ry={30} fill="#FF7A2A" opacity={f} />
        {col > 0.3 && Math.sin(frame * 0.7) > 0.8 && <path d={`M${940 + Math.sin(frame) * 60},${860 - col * 500} l-30,90 l30,-10 l-30,110`} stroke="#FFF3A0" strokeWidth={6} fill="none" />}
        {/* the city in the foreground, lights of the zone dark */}
        {Array.from({length: 26}, (_, i) => (
          <rect key={i} x={i * 76} y={880 - ((i * 41) % 120)} width={64} height={260} fill="#0E1430" stroke={INK} strokeWidth={2} />
        ))}
        {Array.from({length: 60}, (_, i) => {
          const r = rnd(i + 50);
          const x = r() * W;
          const inZone = Math.abs(x - 960) < 380;
          return inZone ? null : <rect key={i} x={x} y={820 + r() * 150} width={8} height={10} fill="#FFD27A" opacity={0.8} />;
        })}
      </Frame>
    );
  }

  if (v === 'surge') {
    const empty = !!p.empty;
    const rr = empty ? 260 + k * 200 : 40 + k * 420;
    return (
      <Frame frame={frame} bg="#16405E">
        <rect x={0} y={0} width={W} height={H} fill="#7A9A7A" />
        {/* streets from above */}
        {Array.from({length: 12}, (_, i) => (
          <g key={i}>
            <line x1={0} y1={i * 100} x2={W} y2={i * 100} stroke="#9AA4AE" strokeWidth={14} />
            <line x1={i * 170} y1={0} x2={i * 170} y2={H} stroke="#9AA4AE" strokeWidth={14} />
          </g>
        ))}
        {Array.from({length: 80}, (_, i) => {
          const r = rnd(i + 70);
          return <rect key={i} x={r() * W} y={r() * H} width={40} height={30} fill={['#E9C46A', '#9FC8A8', '#E07A5F', '#BFD8E8'][i % 4]} stroke={INK} strokeWidth={2} />;
        })}
        <circle cx={960} cy={540} r={rr} fill="#C8C0B8" opacity={0.85} />
        <circle cx={960} cy={540} r={rr} fill="none" stroke="#E8E0D8" strokeWidth={14} />
        <circle cx={960} cy={540} r={60} fill="#FF6A2A" />
        <circle cx={960} cy={540} r={500} fill="none" stroke="#FF5A4A" strokeWidth={6} strokeDasharray="22 14" />
        <Label x={960} y={60} t="EVACUATION LINE" s={34} c="#FFB0A0" />
        {!empty && <Label x={960} y={1040} t="STEAM EXPLOSION · ASH AND ROCK RACE OUT ACROSS THE GROUND" s={32} c="#FFD27A" />}
        {empty && <Label x={960} y={1040} t="INSIDE THE ZONE: NO ONE" s={44} c="#FFFFFF" />}
      </Frame>
    );
  }

  if (v === 'parksteam') {
    // drone view: the empty street, the park at its end, the duck pond steaming, cracks in the grass
    return (
      <Frame frame={frame} bg="#6A7A6A">
        <rect x={0} y={0} width={W} height={H} fill="#7A8A6A" />
        <rect x={0} y={460} width={1300} height={120} fill="#5A5E68" />
        {Array.from({length: 7}, (_, i) => (
          <rect key={i} x={40 + i * 180} y={510} width={90} height={14} fill="#E9E4DA" />
        ))}
        {Array.from({length: 7}, (_, i) => (
          <g key={i}>
            <rect x={40 + i * 180} y={300} width={140} height={130} fill={['#E9C46A', '#9FC8A8', '#E07A5F', '#BFD8E8'][i % 4]} stroke={INK} strokeWidth={3} />
            <rect x={40 + i * 180} y={610} width={140} height={130} fill={['#BFD8E8', '#E07A5F', '#9FC8A8', '#E9C46A'][i % 4]} stroke={INK} strokeWidth={3} />
          </g>
        ))}
        <rect x={1300} y={160} width={620} height={760} fill="#5A9A4A" />
        {[1380, 1820, 1400, 1840].map((tx, i) => (
          <circle key={i} cx={tx} cy={i < 2 ? 240 : 840} r={70} fill="#2E6B3A" />
        ))}
        <ellipse cx={1610} cy={540} rx={170} ry={110} fill="#3E7CB1" stroke={INK} strokeWidth={4} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const y = 520 - ((frame * 1.4 + i * 60) % 360);
          return <ellipse key={i} cx={1560 + (i % 3) * 40 + Math.sin(frame * 0.05 + i) * 20} cy={y} rx={70 + (520 - y) * 0.2} ry={40 + (520 - y) * 0.1} fill="#F4F4F4" opacity={0.55 * (y / 520)} />;
        })}
        <path d="M1440,560 l40,30 l-20,40 l50,30 M1760,520 l-30,40 l40,30" stroke="#2A2A2A" strokeWidth={6} fill="none" />
        <Label x={650} y={1000} t="POLICE DRONE · EVACUATION ZONE · NO ONE LEFT" s={34} />
        <Label x={1610} y={710} t="DUCK POND · STEAMING" s={30} c="#FFD27A" />
      </Frame>
    );
  }

  if (v === 'cone') {
    const h = 80 + k * 300;
    const night = Math.sin(k * Math.PI * 10) > -0.2;
    return (
      <Frame frame={frame} bg="#101420">
        <rect x={0} y={0} width={W} height={H} fill={night ? '#0E1428' : '#8A9AAA'} />
        <path d={`M${960 - h * 1.9},900 Q960,${900 - h * 1.25} ${960 + h * 1.9},900 Z`} fill="#2A2228" stroke={INK} strokeWidth={5} />
        {night && k < 0.92 && (
          <g>
            <path d={`M960,${900 - h + 10} Q${950 + Math.sin(frame) * 20},${900 - h - 140} 960,${900 - h - 220}`} stroke="#FF8A2A" strokeWidth={30} fill="none" opacity={0.85} />
            {Array.from({length: 18}, (_, i) => {
              const r = rnd(i + frame % 7);
              return <circle key={i} cx={960 + (r() - 0.5) * 260} cy={900 - h - r() * 260} r={5} fill="#FFD27A" />;
            })}
            <path d={`M${960 + h},${900 - h * 0.3} Q${1100 + h},860 ${1300 + k * 200},900`} stroke="#FF6A2A" strokeWidth={14} fill="none" />
          </g>
        )}
        {Array.from({length: 24}, (_, i) => (
          <rect key={i} x={i * 84} y={900 - ((i * 37) % 60)} width={70} height={200} fill={night ? '#1A2040' : '#6A7480'} stroke={INK} strokeWidth={2} />
        ))}
        <Label x={960} y={1030} t={`WEEK ${Math.min(9, 1 + Math.floor(k * 9))}`} s={44} c="#FFD27A" />
      </Frame>
    );
  }

  if (v === 'motorway') {
    // a motorway from above in perspective: all lanes flowing one way (away from camera = out of the zone)
    const lanes = 4;
    return (
      <Frame frame={frame} bg="#5A6A5A">
        <rect x={0} y={0} width={W} height={H} fill="#6A7A5A" />
        <path d="M-100,1080 L760,120 L1160,120 L2020,1080 Z" fill="#4A4E58" />
        {Array.from({length: lanes - 1}, (_, i) => {
          const f0 = (i + 1) / lanes;
          return <path key={i} d={`M${-100 + 2120 * f0},1080 L${760 + 400 * f0},120`} stroke="#E9E4DA" strokeWidth={5} strokeDasharray="36 30" strokeDashoffset={frame * 5} />;
        })}
        {Array.from({length: 28}, (_, i) => {
          const lane = i % lanes;
          const prog = (i * 0.137 + frame * 0.0035) % 1; // 0 near camera → 1 at the horizon
          const y = 1060 - prog * 920;
          const f0 = (lane + 0.5) / lanes;
          const xNear = -100 + 2120 * f0;
          const xFar = 760 + 400 * f0;
          const x = xNear + (xFar - xNear) * prog;
          const sc = 1 - prog * 0.8;
          const bus = i % 9 === 0;
          const w = 70 * sc;
          const h = (bus ? 190 : 110) * sc;
          return (
            <g key={i}>
              <rect x={x - w / 2} y={y - h} width={w} height={h} rx={10 * sc} fill={bus ? '#2E6EB5' : ['#C2464F', '#E9E4DA', '#E9C46A', '#3C8D6E', '#8E6BBF'][i % 5]} stroke={INK} strokeWidth={2} />
              <rect x={x - w * 0.35} y={y - h * 0.8} width={w * 0.7} height={h * 0.25} fill="#2A3142" />
              <rect x={x - w * 0.4} y={y - 6 * sc} width={w * 0.16} height={5 * sc} fill="#FF3A3A" />
              <rect x={x + w * 0.24} y={y - 6 * sc} width={w * 0.16} height={5 * sc} fill="#FF3A3A" />
            </g>
          );
        })}
        <Label x={960} y={1040} t="ALL LANES · OUT OF THE ZONE" s={40} c="#FFD27A" />
      </Frame>
    );
  }

  if (v === 'rangitoto') {
    const g = clamp(k * 1.4);
    const forest = clamp((k - 0.55) * 3);
    return (
      <Frame frame={frame} bg="#9FD0F0">
        <rect x={0} y={0} width={W} height={H} fill={forest > 0 ? '#BFE0F0' : '#8AA8C0'} />
        <rect x={0} y={700} width={W} height={380} fill="#3E7CB1" />
        {g < 0.25 &&
          Array.from({length: 30}, (_, i) => {
            const r = rnd(i + (frame % 9));
            return <circle key={i} cx={760 + r() * 400} cy={700 - r() * 40} r={6 + r() * 10} fill="#FFFFFF" opacity={0.7} />;
          })}
        <path d={`M${960 - 700 * g},700 Q960,${700 - 320 * g} ${960 + 700 * g},700 Z`} fill={forest > 0 ? `rgb(${Math.round(60 - 20 * forest)},${Math.round(70 + 60 * forest)},60)` : '#3A3238'} stroke={INK} strokeWidth={5} />
        {g > 0.2 && forest < 0.3 && <path d={`M960,${700 - 320 * g} q-10,-120 0,-200`} stroke="#FF8A2A" strokeWidth={24} opacity={0.8} />}
        {forest > 0.6 && <path d="M200,760 l140,0 l-20,24 l-100,0 Z" fill="#F4F4F0" stroke={INK} strokeWidth={3} />}
        <Label x={960} y={1000} t="RANGITOTO · THE YOUNGEST · ABOUT 600 YEARS OLD" s={34} o={forest > 0.6 ? 1 : 0} />
        <Label x={1700} y={120} t={forest > 0 ? 'TODAY' : 'ABOUT 1450'} s={44} c="#FFD27A" />
      </Frame>
    );
  }

  if (v === 'crateredge') {
    return (
      <Frame frame={frame} bg="#8A8680">
        <rect x={0} y={0} width={W} height={H} fill="#A8B4BE" />
        <path d="M0,520 Q600,380 960,420 Q1400,460 1920,360 L1920,1080 L0,1080 Z" fill="#7A7672" />
        <path d="M900,430 Q1100,330 1300,430" stroke="#5A5652" strokeWidth={16} fill="none" />
        {[0, 1, 2].map((i) => {
          const y = 400 - ((frame * 0.8 + i * 70) % 220);
          return <ellipse key={i} cx={1100 + i * 30} cy={y} rx={60 + (400 - y) * 0.2} ry={30} fill="#F4F4F4" opacity={0.4 * (y / 400)} />;
        })}
        <g transform="translate(700,640)">
          <rect x={-40} y={-40} width={80} height={40} rx={10} fill="#C2464F" stroke={INK} strokeWidth={4} />
          <rect x={-24} y={-26} width={48} height={8} fill="#2A2A2A" />
        </g>
        <rect x={0} y={820} width={W} height={260} fill="#6A7A5A" />
        {Array.from({length: 26}, (_, i) => (
          <line key={i} x1={i * 80} y1={760} x2={i * 80} y2={880} stroke="#C9CED6" strokeWidth={6} />
        ))}
        <path d="M0,780 L1920,780 M0,840 L1920,840" stroke="#C9CED6" strokeWidth={4} />
        <Toon d={CAST.mele} s={{x: 820, y: 1000, scale: 0.9, facing: 'back', pose: POSES.stand, bob: 0, face: FACES.sad, turn: 0, look: [0, 0], talk: 0, blink: 0, outfit: 'home', hoodUp: false, breath: 0, frame, rim: true, opacity: 1, watchGlow: 0} as any} />
        <Toon d={CAST.ana} s={{x: 980, y: 1000, scale: 0.9, facing: 'back', pose: POSES.stand, bob: 0, face: FACES.sad, turn: 0, look: [0, 0], talk: 0, blink: 0, outfit: 'cold', hoodUp: false, breath: 0, frame, rim: true, opacity: 1, watchGlow: 0} as any} />
      </Frame>
    );
  }

  if (v === 'ash') {
    return (
      <Frame frame={frame} bg="#8A8680">
        <rect x={0} y={0} width={W} height={H} fill="#A8A49C" />
        {Array.from({length: 18}, (_, i) => (
          <g key={i} transform={`translate(${i * 120},${760 - ((i * 37) % 100)})`}>
            <rect x={0} y={0} width={100} height={400} fill="#6A6A70" stroke={INK} strokeWidth={3} />
            <rect x={0} y={-6} width={100} height={12} fill="#D8D4CC" />
          </g>
        ))}
        {/* a parked plane at the closed airport, far right */}
        <path d="M1500,700 l300,0 l20,-14 l-300,0 Z M1640,700 l40,-60 l30,0 l-20,60 Z" fill="#E9E4DA" stroke={INK} strokeWidth={3} />
        {Array.from({length: 160}, (_, i) => {
          const r = rnd(i + 3);
          const x = (r() * W + frame * 0.6) % W;
          const y = (r() * H + frame * (1 + r())) % H;
          return <circle key={i} cx={x} cy={y} r={2 + r() * 3} fill="#E0DCD4" opacity={0.8} />;
        })}
        <Label x={960} y={1010} t="AIRPORT CLOSED · WEAR A MASK OUTDOORS" s={40} />
      </Frame>
    );
  }

  return (
    <Frame frame={frame}>
      <Label x={960} y={540} t={`[vol ${v}]`} />
    </Frame>
  );
};
