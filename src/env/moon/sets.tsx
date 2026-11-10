import React from 'react';
import {Glow, Grade, INK, registerSet, Vignette} from '../sun/stage';
import {Boat, F, Flood, HillTown, House, Lamp, MoonDisc, PX, SeaBand, SkyBox, todOf} from './parts';

/**
 * File 002 (moon02) outdoor sets: Saltmouth, one town seen from three streets. Cast floor at y 930 on each.
 *
 *   quay      Quay Street, 1.6 m above mean sea level: the harbour edge and tide gauge (left), the fish stall, the row
 *             of houses with Nana's (blue door, No. 3), the hill and chapel behind.
 *   marketst  Market Street, 7.5 m: shops, the steps down to the quay (left) with the sea and the Moon over the roofs.
 *   hill      Chapel Hill, 33–40 m: the ruined chapel, its wide steps (Nana's white line at 35 m), the sea below.
 *
 * v: 'day' | 'dusk' | 'night'.  Props every set understands:
 *   sea     the water's height in metres above mean sea level right now (the set shows where that is on this street)
 *   moon    the Moon's width, 1 = normal … 3;  moonAt [x, y] to place it (default: over the sea)
 *   line    hill only: 0–1, how much of the white line is painted
 */
const moonOf = (c: {p: Record<string, any>}, dx = 0, dy = 0): [number, number] => (c.p.moonAt ? c.p.moonAt : [330 + dx, 250 + dy]);
const night = (tod: string, amount = 0.42) => (tod === 'night' ? <Grade color="#31417E" amount={amount} /> : tod === 'dusk' ? <Grade color="#8C6A8E" amount={0.22} /> : null);

// ── QUAY ── floor 930 = 1.6 m. Mean sea level would be at y 930 + 1.6 m.
registerSet('quay', {
  layers: (c) => {
    const tod = todOf(c.v);
    const sea = (c.p.sea ?? 0.6) as number;
    const k = (c.p.moon ?? 1) as number;
    const [mx, my] = moonOf(c);
    const wy = 930 + (1.6 - sea) * PX; // the water surface on this street's scale
    const lit = tod !== 'day';
    const bob = Math.sin(c.frame * 0.05) * 6;
    return [
      {depth: 0.08, node: <SkyBox tod={tod} frame={c.frame} moonlit={(k - 1) / 2} />},
      {depth: 0.1, node: c.p.moon !== undefined || tod !== 'day' ? <MoonDisc x={mx} y={my} k={k} tod={tod} /> : null},
      {depth: 0.3, node: <SeaBand y={600} tod={tod} frame={c.frame} moonX={mx} />},
      {depth: 0.45, node: <HillTown x={1900} y={640} s={0.9} tod={tod} />},
      {
        depth: 1,
        node: (
          <g>
            {/* the harbour basin to the left of the quay wall: water at its true height, a boat riding on it */}
            <SeaBand y={Math.max(640, wy)} tod={tod} frame={c.frame} x0={-1400} x1={330} h={1400} />
            {!c.p.noBoat && <Boat x={-40} y={Math.max(640, wy) + 8} bob={bob} />}
            <Boat x={-520} y={Math.max(640, wy) + 8} col="#2F6F9F" bob={-bob} s={0.9} />
            {/* the tide gauge: a painted post on the wall, zero at mean sea level, a mark every half metre */}
            <g>
              <rect x={236} y={300} width={64} height={1300} fill="#F4EFE6" stroke={INK} strokeWidth={5} />
              {Array.from({length: 13}, (_, i) => {
                const m = i * 0.5; // metres above mean sea level
                const y = 930 + (1.6 - m) * PX;
                return (
                  <g key={i}>
                    <rect x={236} y={y - 5} width={i % 2 ? 30 : 64} height={10} fill="#C2464F" />
                    {i % 2 === 0 && (
                      <text data-text="set" x={226} y={y + 12} textAnchor="end" fontFamily={F} fontWeight={800} fontSize={34} fill="#F4EFE6" stroke={INK} strokeWidth={6} paintOrder="stroke">
                        {m}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
            {/* quay wall and cobbles */}
            <rect x={300} y={930} width={3200} height={1300} fill="#7C8696" stroke={INK} strokeWidth={5} />
            {Array.from({length: 7}, (_, r) =>
              Array.from({length: 28}, (_, i) => <rect key={`${r}-${i}`} x={300 + i * 118 - (r % 2) * 59} y={942 + r * 34} width={110} height={28} rx={8} fill={(i + r) % 3 ? '#8E98A8' : '#A3ADBB'} opacity={0.9} />),
            )}
            <rect x={300} y={918} width={3200} height={18} fill="#B9C2CE" stroke={INK} strokeWidth={4} />
            {/* bollards and a ladder down the wall */}
            {[360, 620].map((x) => (
              <g key={x}>
                <rect x={x - 16} y={870} width={32} height={50} rx={8} fill="#2B3445" stroke={INK} strokeWidth={4} />
                <rect x={x - 24} y={862} width={48} height={16} rx={8} fill="#2B3445" stroke={INK} strokeWidth={4} />
              </g>
            ))}
            {/* houses along the back of the quay; Nana's is No. 3 with the blue door */}
            <House x={760} y={900} i={1} lit={lit} number={1} />
            <House x={1290} y={900} i={0} lit={lit} number={3} />
            <House x={1820} y={900} i={2} lit={lit} number={5} shop="CHANDLER" />
            <House x={2350} y={900} i={3} lit={lit} number={7} />
            <rect x={700} y={900} width={2800} height={30} fill="#A9B2C0" stroke={INK} strokeWidth={4} />
            {/* a bench under Nana's window */}
            <g transform="translate(1640,900)">
              <rect x={-90} y={-70} width={180} height={14} fill="#8A5A36" stroke={INK} strokeWidth={4} />
              <rect x={-90} y={-130} width={180} height={12} fill="#8A5A36" stroke={INK} strokeWidth={4} />
              <path d="M-78,-58 L-78,0 M78,-58 L78,0 M-78,-130 L-78,-70 M78,-130 L78,-70" stroke={INK} strokeWidth={8} />
            </g>
            <Lamp x={700} y={930} on={lit} />
            <Lamp x={2280} y={930} on={lit} />
            {/* the fish stall by the harbour edge */}
            {!c.p.noStall && (
              <g transform="translate(520,930)">
                <path d="M-150,-420 L150,-420 L176,-340 L-176,-340 Z" fill="#F4EFE6" stroke={INK} strokeWidth={5} />
                {[-150, -90, -30, 30, 90].map((x, i) => (
                  <path key={x} d={`M${x},-420 L${x + 60},-420 L${x + 60 + (x + 60) * 0.17},-340 L${x + x * 0.17},-340 Z`} fill={i % 2 ? '#F4EFE6' : '#2F6F9F'} />
                ))}
                <path d="M-140,-340 L-140,0 M140,-340 L140,0" stroke={INK} strokeWidth={10} />
                <rect x={-150} y={-190} width={300} height={40} fill="#C9D2DC" stroke={INK} strokeWidth={5} />
                {[-110, -40, 30, 100].map((x, i) => (
                  <g key={x} transform={`translate(${x},-200) rotate(${i * 7 - 10})`}>
                    <ellipse cx={0} cy={0} rx={34} ry={11} fill={['#9FB6C8', '#C9B2A0', '#A8C0B0', '#B7B0C8'][i]} stroke={INK} strokeWidth={3} />
                    <path d="M30,0 L48,-12 L48,12 Z" fill={['#9FB6C8', '#C9B2A0', '#A8C0B0', '#B7B0C8'][i]} stroke={INK} strokeWidth={3} />
                  </g>
                ))}
              </g>
            )}
          </g>
        ),
      },
      // the sea on the street itself, once it is over the quay: drawn in front of people's feet
      ...(sea > 1.6 ? [{depth: 1, front: true, node: <Flood y={wy} tod={tod} frame={c.frame} opacity={0.66} x0={-1400} x1={3600} />}] : []),
    ];
  },
  light: (c) => (todOf(c.v) !== 'day' ? <Glow x={moonOf(c)[0]} y={moonOf(c)[1]} r={500 * (c.p.moon ?? 1)} color="#FFF6C8" opacity={0.22} /> : null),
  grade: (c) => (
    <g>
      {night(todOf(c.v))}
      <Vignette amount={0.35} />
    </g>
  ),
});

// ── MARKET STREET ── floor 930 = 7.5 m. The steps down to the quay are on the left; the lower town and sea beyond.
registerSet('marketst', {
  layers: (c) => {
    const tod = todOf(c.v);
    const sea = (c.p.sea ?? 0.6) as number;
    const k = (c.p.moon ?? 1) as number;
    const [mx, my] = moonOf(c, -80, -20);
    const lit = tod !== 'day';
    // far below (compressed 60 px per metre): where the sea stands against the lower town
    const lowY = 930 + (7.5 - Math.min(sea, 7.5)) * 60;
    const wy = 930 + (7.5 - sea) * PX;
    return [
      {depth: 0.08, node: <SkyBox tod={tod} frame={c.frame} moonlit={(k - 1) / 2} />},
      {depth: 0.1, node: <MoonDisc x={mx} y={my} k={k} tod={tod} />},
      {depth: 0.3, node: <SeaBand y={640} tod={tod} frame={c.frame} moonX={mx} />},
      {
        depth: 0.6,
        node: (
          <g>
            {/* the roofs of Quay Street below, and the sea among them when it is in */}
            {[-520, -330, -140, 50, 240].map((x, i) => (
              <g key={x} transform={`translate(${x},1100)`}>
                <rect x={-90} y={-250} width={180} height={300} fill={['#E9E2D0', '#D8E6EC', '#F1D9C4', '#DCE8D0', '#EADFE8'][i]} stroke={INK} strokeWidth={4} />
                <path d="M-104,-250 L0,-330 L104,-250 Z" fill="#4E5868" stroke={INK} strokeWidth={4} />
                <rect x={30} y={-320} width={24} height={50} fill="#9A5B45" stroke={INK} strokeWidth={3} />
                <rect x={-50} y={-200} width={40} height={56} fill={lit ? '#FFD98A' : '#5C7FA0'} stroke="#FFFFFF" strokeWidth={5} />
              </g>
            ))}
            <SeaBand y={lowY + 150} tod={tod} frame={c.frame} x0={-1400} x1={420} h={900} />
          </g>
        ),
      },
      {
        depth: 1,
        node: (
          <g>
            {/* the street: flagstones, a railing above the steps on the left */}
            <rect x={380} y={930} width={3200} height={1300} fill="#9AA0A8" stroke={INK} strokeWidth={5} />
            {Array.from({length: 26}, (_, i) => (
              <line key={i} x1={380 + i * 130} y1={936} x2={380 + i * 130 - 50} y2={1400} stroke="#7E858F" strokeWidth={4} />
            ))}
            <rect x={380} y={918} width={3200} height={16} fill="#C2C7CE" stroke={INK} strokeWidth={4} />
            {/* stone steps down to the quay */}
            {Array.from({length: 7}, (_, i) => (
              <rect key={i} x={380 - (i + 1) * 70} y={930 + i * 46} width={74} height={600} fill={i % 2 ? '#8C939C' : '#A2A8B0'} stroke={INK} strokeWidth={4} />
            ))}
            <path d="M390,930 L390,790 M560,930 L560,790 M390,800 L560,800 M390,860 L560,860" stroke="#2B3445" strokeWidth={10} strokeLinecap="round" />
            <House x={640} y={900} i={4} lit={lit} shop="BAKERY" />
            <House x={1170} y={900} i={5} lit={lit} shop="POST OFFICE" />
            <House x={1700} y={900} i={1} lit={lit} number={12} />
            <House x={2230} y={900} i={2} lit={lit} shop="HARBOUR BOARD" />
            <rect x={600} y={900} width={2800} height={30} fill="#B4BAC2" stroke={INK} strokeWidth={4} />
            <Lamp x={600} y={930} on={lit} />
            <Lamp x={2180} y={930} on={lit} />
            {/* a parked car that the sea will lift */}
            {c.p.car !== false && (
              <g transform={`translate(${(c.p.carX ?? 1560) as number},${930 - (sea > 7.6 ? Math.min(160, (sea - 7.5) * PX * 0.5) : 0) + (sea > 7.6 ? Math.sin(c.frame * 0.06) * 8 : 0)}) rotate(${sea > 7.6 ? Math.sin(c.frame * 0.04) * 4 : 0})`}>
                <path d="M-170,-60 L-150,-120 L-70,-170 L70,-170 L130,-120 L176,-110 L180,-40 L-176,-40 Z" fill="#D9A441" stroke={INK} strokeWidth={5} />
                <path d="M-60,-158 L-20,-158 L-20,-116 L-110,-116 Z M0,-158 L60,-158 L104,-116 L0,-116 Z" fill="#BFE0F0" stroke={INK} strokeWidth={4} />
                <circle cx={-100} cy={-36} r={38} fill="#2B3445" stroke={INK} strokeWidth={5} />
                <circle cx={104} cy={-36} r={38} fill="#2B3445" stroke={INK} strokeWidth={5} />
                <circle cx={-100} cy={-36} r={14} fill="#C9D2DC" />
                <circle cx={104} cy={-36} r={14} fill="#C9D2DC" />
              </g>
            )}
          </g>
        ),
      },
      ...(sea > 7.5 ? [{depth: 1, front: true, node: <Flood y={wy} tod={tod} frame={c.frame} opacity={0.66} x0={-1400} x1={3600} />}] : []),
    ];
  },
  light: (c) => (todOf(c.v) !== 'day' ? <Glow x={moonOf(c, -80, -20)[0]} y={moonOf(c, -80, -20)[1]} r={500 * (c.p.moon ?? 1)} color="#FFF6C8" opacity={0.22} /> : null),
  grade: (c) => (
    <g>
      {night(todOf(c.v))}
      <Vignette amount={0.35} />
    </g>
  ),
});

// ── CHAPEL HILL ── floor 930 = 35 m (the step with the white line). The chapel is on the right; the sea is on the left.
registerSet('hill', {
  layers: (c) => {
    const tod = todOf(c.v);
    const sea = (c.p.sea ?? 0.6) as number;
    const k = (c.p.moon ?? 1) as number;
    const [mx, my] = moonOf(c, -60, -30);
    const line = (c.p.line ?? 0) as number;
    // the sea far below, 16 px per metre until it is within 3 m of the line, then at true scale on the steps
    const near = sea > 32;
    const wy = 930 + (35 - sea) * PX;
    const stone = tod === 'night' ? '#8A93A8' : '#C4BEAE';
    const grass = tod === 'night' ? '#244A44' : tod === 'dusk' ? '#5E7A5E' : '#7DB56A';
    return [
      {depth: 0.08, node: <SkyBox tod={tod} frame={c.frame} moonlit={(k - 1) / 2} />},
      {depth: 0.1, node: <MoonDisc x={mx} y={my} k={k} tod={tod} />},
      {
        depth: 0.35,
        node: (
          <g>
            {/* the open sea to the horizon; below the hill, the town's roofs stand in it until the tide covers them */}
            <SeaBand y={700} tod={tod} frame={c.frame} moonX={mx} />
            {[
              [-560, 3], [-430, 5], [-300, 8], [-170, 11], [-40, 15], [90, 19], [220, 23], [330, 27],
            ].map(([x, elev], i) =>
              sea < elev + 5 ? (
                <g key={x} transform={`translate(${x},${1010 - elev * 8})`}>
                  <rect x={-50} y={-60 + Math.max(0, (sea - elev) * 12)} width={100} height={130} fill={['#E9E2D0', '#D8E6EC', '#F1D9C4'][i % 3]} stroke={INK} strokeWidth={3} />
                  <path d="M-60,-60 L0,-106 L60,-60 Z" fill="#4E5868" stroke={INK} strokeWidth={3} />
                </g>
              ) : null,
            )}
            <SeaBand y={1010 - Math.min(sea, 32) * 8 + 60} tod={tod} frame={c.frame} x0={-1400} x1={480} h={900} />
            {(c.p.lighthouse ?? true) && (
              <g transform="translate(-700,1000)">
                <path d="M-22,0 L-14,-190 L14,-190 L22,0 Z" fill="#F4EFE6" stroke={INK} strokeWidth={3} />
                <rect x={-17} y={-130} width={34} height={30} fill="#C2464F" />
                <rect x={-18} y={-222} width={36} height={32} fill="#FFE08A" stroke={INK} strokeWidth={3} />
                <path d="M-22,-222 L0,-246 L22,-222 Z" fill="#2B3445" />
              </g>
            )}
          </g>
        ),
      },
      {
        depth: 1,
        node: (
          <g>
            {/* the hilltop: grass, the chapel ruin on the right, its wide steps running down to the left */}
            <path d="M700,930 L3600,930 L3600,2300 L-1400,2300 L-1400,1420 Q-300,1300 240,1160 Z" fill={grass} stroke={INK} strokeWidth={5} />
            {Array.from({length: 6}, (_, i) => {
              // steps: each 0.5 m high (103 px), going down to the left from the top step at x 700
              const x = 700 - (i + 1) * 150;
              const y = 930 + i * 103;
              return <rect key={i} x={x} y={y} width={950 + (i + 1) * 150} height={110} fill={i % 2 ? stone : tod === 'night' ? '#7D869C' : '#B5AF9F'} stroke={INK} strokeWidth={4} />;
            })}
            <rect x={700} y={918} width={2900} height={16} fill={stone} stroke={INK} strokeWidth={4} />
            {/* Nana's white line, across the top step where the cast stands (35 m) */}
            {line > 0 && <rect x={560} y={926} width={900 * line} height={12} fill="#FFFFFF" stroke={INK} strokeWidth={2} />}
            {/* the chapel: a roofless stone gable with a pointed window, a side wall, a doorway */}
            <g transform="translate(1900,930)">
              <path d="M-420,0 L-420,-520 L0,-900 L420,-520 L420,0 Z" fill={stone} stroke={INK} strokeWidth={6} />
              {Array.from({length: 9}, (_, r) =>
                Array.from({length: 6}, (_, i) => <rect key={`${r}-${i}`} x={-400 + i * 140 - (r % 2) * 70} y={-70 - r * 56} width={130} height={48} fill="#000" opacity={(i + r) % 4 === 0 ? 0.07 : 0.03} />),
              )}
              <path d="M-90,-380 L-90,-600 Q0,-730 90,-600 L90,-380 Z" fill={tod === 'night' ? '#0B1230' : '#A9D3EA'} stroke={INK} strokeWidth={6} />
              <path d="M0,-700 L0,-380 M-90,-520 L90,-520" stroke={INK} strokeWidth={8} />
              <path d="M-110,0 L-110,-300 Q0,-400 110,-300 L110,0 Z" fill={c.p.chapelLit ? '#FFD98A' : '#3A3F4E'} stroke={INK} strokeWidth={6} />
              <rect x={-28} y={-1010} width={56} height={110} fill={stone} stroke={INK} strokeWidth={5} />
              <path d="M-14,-990 L-14,-930 Q0,-950 14,-930 L14,-990 Z" fill="#2B3445" />
              <rect x={420} y={-420} width={900} height={420} fill={tod === 'night' ? '#7D869C' : '#B5AF9F'} stroke={INK} strokeWidth={6} />
              {[560, 800, 1040].map((x) => (
                <path key={x} d={`M${x - 50},-120 L${x - 50},-280 Q${x},-340 ${x + 50},-280 L${x + 50},-120 Z`} fill={c.p.chapelLit ? '#FFD98A' : tod === 'night' ? '#0B1230' : '#A9D3EA'} stroke={INK} strokeWidth={5} />
              ))}
            </g>
          </g>
        ),
      },
      ...(near ? [{depth: 1, front: true, node: <Flood y={wy} tod={tod} frame={c.frame} opacity={0.8} x0={-1400} x1={3600} />}] : []),
    ];
  },
  light: (c) => (todOf(c.v) !== 'day' ? <Glow x={moonOf(c, -60, -30)[0]} y={moonOf(c, -60, -30)[1]} r={500 * (c.p.moon ?? 1)} color="#FFF6C8" opacity={0.22} /> : null),
  grade: (c) => (
    <g>
      {night(todOf(c.v), 0.36)}
      <Vignette amount={0.35} />
    </g>
  ),
});
