import React from 'react';
import {Glow, Grade, INK, registerSet, Vignette} from '../sun/stage';
import {F, MoonDisc, PX, SeaBand, SkyBox, todOf} from './parts';

/**
 * File 002 (moon02) interiors. Cast floor at y 930; 206 px per metre (table top 0.75 m = 155 px, door 2 m).
 *
 *   nanakitchen  Nana's kitchen on Quay Street: the range, the dresser with the bread bin (where the log lives), the
 *                table, the window onto the harbour. v: 'day' | 'night'. p.moon, p.sea (through the window),
 *                p.bare (the beds and dresser have gone up the hill), p.binOpen
 *   boardroom    the Harbour Board's room on Market Street: the long table, the harbour chart, benches for the town.
 *   chapelin     inside the chapel on the hill: camp beds, lanterns, the pointed window with the Moon in it.
 */
const W0 = -500;
const W1 = 2500;

const Window: React.FC<{x: number; y: number; w: number; h: number; c: any}> = ({x, y, w, h, c}) => {
  const tod = todOf(c.v);
  const id = `mwin${x}`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <g transform={`translate(${x - 300},${y - 260}) scale(0.62)`}>
          <SkyBox tod={tod} frame={c.frame} />
          <MoonDisc x={760} y={640} k={c.p.moon ?? 1} tod={tod} />
          <SeaBand y={870 - Math.min(180, ((c.p.sea ?? 0.6) as number) * 22)} tod={tod} frame={c.frame} moonX={760} />
        </g>
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#FFFFFF" strokeWidth={16} />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={4} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#FFFFFF" strokeWidth={12} />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#FFFFFF" strokeWidth={12} />
      <rect x={x - 24} y={y + h + 8} width={w + 48} height={20} fill="#E9E2D0" stroke={INK} strokeWidth={4} />
    </g>
  );
};

// ── NANA'S KITCHEN ──
registerSet('nanakitchen', {
  layers: (c) => {
    const nightV = todOf(c.v) === 'night';
    const bare = !!c.p.bare;
    return [
      {
        depth: 1,
        node: (
          <g>
            <rect x={W0} y={-300} width={W1 - W0} height={1230} fill="#E7DDC6" />
            <rect x={W0} y={520} width={W1 - W0} height={410} fill="#9DB8B0" />
            <rect x={W0} y={508} width={W1 - W0} height={18} fill="#F4EFE6" stroke={INK} strokeWidth={3} />
            <rect x={W0} y={930} width={W1 - W0} height={500} fill="#B88A5C" />
            {Array.from({length: 26}, (_, i) => (
              <line key={i} x1={W0 + i * 130} y1={930} x2={W0 + i * 130 - 70} y2={1430} stroke="#9A7046" strokeWidth={4} />
            ))}
            {/* the back door (to the quay), 2 m */}
            <rect x={96} y={504} width={198} height={426} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
            <rect x={110} y={518} width={170} height={412} fill="#2F6F9F" stroke={INK} strokeWidth={4} />
            <circle cx={256} cy={730} r={9} fill="#E8C55A" stroke={INK} strokeWidth={3} />
            {/* coat hooks by the door: Nana's oilskin */}
            <rect x={330} y={470} width={150} height={12} fill="#8A5A36" stroke={INK} strokeWidth={3} />
            {!c.p.noCoat && <path d="M370,482 L350,760 L440,760 L430,482 Z" fill="#6E7A3E" stroke={INK} strokeWidth={4} />}
            {/* the window onto the harbour */}
            <Window x={620} y={300} w={420} h={330} c={c} />
            {/* the range, with a kettle */}
            <g transform="translate(1250,930)">
              <rect x={-150} y={-330} width={300} height={330} fill="#3A3F4E" stroke={INK} strokeWidth={5} />
              <rect x={-120} y={-250} width={110} height={130} rx={8} fill="#2B3038" stroke={INK} strokeWidth={4} />
              <rect x={10} y={-250} width={110} height={130} rx={8} fill={nightV ? '#F08A24' : '#2B3038'} stroke={INK} strokeWidth={4} />
              <rect x={-160} y={-346} width={320} height={22} fill="#565C6E" stroke={INK} strokeWidth={4} />
              <rect x={-40} y={-1200} width={60} height={860} fill="#3A3F4E" stroke={INK} strokeWidth={4} />
              <path d="M40,-346 q10,-70 50,-70 q40,0 50,70 Z" fill="#C2464F" stroke={INK} strokeWidth={4} />
              <path d="M140,-390 q40,-10 50,20" stroke={INK} strokeWidth={6} fill="none" />
            </g>
            {/* the dresser: plates, and the bread bin where the log is kept */}
            {!bare && (
              <g transform="translate(1760,930)">
                <rect x={-200} y={-720} width={400} height={720} fill="#8A5A36" stroke={INK} strokeWidth={5} />
                <rect x={-180} y={-700} width={360} height={300} fill="#6E4428" stroke={INK} strokeWidth={4} />
                {[-120, -40, 40, 120].map((x) => (
                  <circle key={x} cx={x} cy={-600} r={34} fill="#F4EFE6" stroke="#2F6F9F" strokeWidth={6} />
                ))}
                <rect x={-180} y={-540} width={360} height={10} fill="#8A5A36" stroke={INK} strokeWidth={3} />
                {/* the bread bin */}
                <g transform="translate(-60,-400)">
                  <rect x={-70} y={-84} width={140} height={84} rx={14} fill="#E9E2D0" stroke={INK} strokeWidth={4} />
                  <path d={`M-70,-60 Q0,${c.p.binOpen ? -150 : -110} 70,-60`} fill="#E9E2D0" stroke={INK} strokeWidth={4} />
                  <text data-text="set" x={0} y={-26} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={26} fill="#2F6F9F">BREAD</text>
                </g>
                <rect x={-200} y={-400} width={400} height={16} fill="#A06A40" stroke={INK} strokeWidth={4} />
                <rect x={-170} y={-350} width={160} height={150} fill="#6E4428" stroke={INK} strokeWidth={4} />
                <rect x={10} y={-350} width={160} height={150} fill="#6E4428" stroke={INK} strokeWidth={4} />
                <circle cx={-90} cy={-275} r={8} fill="#E8C55A" />
                <circle cx={90} cy={-275} r={8} fill="#E8C55A" />
              </g>
            )}
            {bare && <rect x={1560} y={210} width={400} height={720} fill="#D9CFB8" opacity={0.6} />}
            {/* the kitchen table: 0.75 m high, behind the cast */}
            {!c.p.noTable && (
              <g transform="translate(900,930)">
                <rect x={-260} y={-165} width={520} height={22} fill="#C99A64" stroke={INK} strokeWidth={5} />
                <path d="M-236,-143 L-236,0 M236,-143 L236,0" stroke={INK} strokeWidth={14} />
                <path d="M-236,-143 L-236,0 M236,-143 L236,0" stroke="#A8784E" strokeWidth={8} />
                {c.p.lamp !== false && (
                  <g transform="translate(150,-165)">
                    <rect x={-22} y={-14} width={44} height={14} fill="#2B3445" stroke={INK} strokeWidth={3} />
                    <rect x={-5} y={-80} width={10} height={66} fill="#2B3445" />
                    <path d="M-44,-80 L44,-80 L28,-140 L-28,-140 Z" fill={nightV ? '#FFE08A' : '#E9E2D0'} stroke={INK} strokeWidth={4} />
                  </g>
                )}
              </g>
            )}
          </g>
        ),
      },
    ];
  },
  light: (c) => (todOf(c.v) === 'night' && c.p.lamp !== false && !c.p.noTable ? <Glow x={1050} y={700} r={520} color="#FFD98A" opacity={0.5} /> : null),
  grade: (c) => (
    <g>
      {todOf(c.v) === 'night' && <Grade color="#3A3F78" amount={0.4} />}
      <Vignette amount={0.4} />
    </g>
  ),
});

// ── HARBOUR BOARD ROOM ──
registerSet('boardroom', {
  layers: (c) => [
    {
      depth: 1,
      node: (
        <g>
          <rect x={W0} y={-300} width={W1 - W0} height={1230} fill="#DAD3C0" />
          <rect x={W0} y={470} width={W1 - W0} height={460} fill="#6E5A46" />
          {Array.from({length: 24}, (_, i) => (
            <rect key={i} x={W0 + i * 130 + 14} y={500} width={102} height={400} fill="#5E4C3A" stroke="#4A3A2C" strokeWidth={4} />
          ))}
          <rect x={W0} y={930} width={W1 - W0} height={500} fill="#7A5A3E" />
          {/* the harbour chart on the wall */}
          <g transform="translate(1180,60)">
            <rect x={0} y={0} width={640} height={380} fill="#CFE0E8" stroke="#8A5A36" strokeWidth={14} />
            <path d="M0,250 Q160,200 260,260 Q330,300 420,230 Q520,160 640,200 L640,380 L0,380 Z" fill="#DCCFA8" stroke={INK} strokeWidth={3} />
            <path d="M250,262 L250,180 M250,180 L330,180" stroke={INK} strokeWidth={5} />
            <text data-text="set" x={320} y={60} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={34} fill="#2B3445">SALTMOUTH HARBOUR</text>
          </g>
          {/* portraits of old chairmen */}
          {[420, 640, 860].map((x, i) => (
            <g key={x}>
              <rect x={x} y={150} width={150} height={190} fill="#3A3F4E" stroke="#C9A24A" strokeWidth={10} />
              <circle cx={x + 75} cy={225} r={34} fill={['#E0B48E', '#F1D2B6', '#C99570'][i]} />
              <path d={`M${x + 20},340 Q${x + 75},250 ${x + 130},340 Z`} fill="#1F2A44" />
            </g>
          ))}
          {/* the board's table (0.75 m), at the right; benches for the town at the left */}
          <g transform="translate(1560,930)">
            <rect x={-360} y={-165} width={720} height={24} fill="#5A3A22" stroke={INK} strokeWidth={5} />
            <rect x={-340} y={-141} width={680} height={141} fill="#6E4428" stroke={INK} strokeWidth={5} />
            <rect x={-60} y={-196} width={120} height={30} fill="#F4EFE6" stroke={INK} strokeWidth={3} />
          </g>
          {[250, 560].map((x) => (
            <g key={x} transform={`translate(${x},930)`}>
              <rect x={-130} y={-96} width={260} height={16} fill="#8A5A36" stroke={INK} strokeWidth={4} />
              <path d="M-110,-80 L-110,0 M110,-80 L110,0" stroke={INK} strokeWidth={10} />
            </g>
          ))}
        </g>
      ),
    },
  ],
  grade: () => <Vignette amount={0.45} />,
});

// ── INSIDE THE CHAPEL ──
registerSet('chapelin', {
  layers: (c) => {
    const tod = todOf(c.v);
    const id = 'chwin';
    return [
      {
        depth: 1,
        node: (
          <g>
            <rect x={W0} y={-400} width={W1 - W0} height={1330} fill={tod === 'night' ? '#5E6478' : '#B5AF9F'} />
            {Array.from({length: 12}, (_, r) =>
              Array.from({length: 22}, (_, i) => <rect key={`${r}-${i}`} x={W0 + i * 150 - (r % 2) * 75} y={-380 + r * 110} width={142} height={102} fill="#000" opacity={(i + r) % 5 === 0 ? 0.08 : 0.03} />),
            )}
            {/* the pointed window, the Moon in it */}
            <defs>
              <clipPath id={id}>
                <path d="M780,620 L780,200 Q960,-60 1140,200 L1140,620 Z" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id})`}>
              <SkyBox tod={tod} frame={c.frame} />
              {c.p.moon !== 0 && <MoonDisc x={960} y={300} k={c.p.moon ?? 2.5} tod={tod} />}
              <SeaBand y={560 - Math.min(120, (((c.p.sea ?? 20) as number) - 20) * 8)} tod={tod} frame={c.frame} moonX={960} />
            </g>
            <path d="M780,620 L780,200 Q960,-60 1140,200 L1140,620 Z" fill="none" stroke={INK} strokeWidth={8} />
            <path d="M960,-10 L960,620 M780,400 L1140,400" stroke={tod === 'night' ? '#3E4458' : '#8E8878'} strokeWidth={14} />
            <rect x={W0} y={930} width={W1 - W0} height={500} fill={tod === 'night' ? '#4A4E5E' : '#8E8878'} />
            {Array.from({length: 22}, (_, i) => (
              <line key={i} x1={W0 + i * 150} y1={930} x2={W0 + i * 150 - 80} y2={1430} stroke="#000" strokeOpacity={0.15} strokeWidth={4} />
            ))}
            {/* camp beds along the wall, blankets, a tea urn on a trestle */}
            {[-200, 140, 1360, 1700, 2040].map((x, i) => (
              <g key={x} transform={`translate(${x},930)`}>
                <rect x={-140} y={-70} width={280} height={24} rx={8} fill={['#C2464F', '#2F6F9F', '#3E7A52', '#C98A2B', '#6A4A8C'][i]} stroke={INK} strokeWidth={4} />
                <rect x={-140} y={-92} width={70} height={26} rx={10} fill="#F4EFE6" stroke={INK} strokeWidth={3} />
                <path d="M-120,-46 L-130,0 M120,-46 L130,0" stroke={INK} strokeWidth={8} />
              </g>
            ))}
            <g transform="translate(520,930)">
              <rect x={-150} y={-165} width={300} height={18} fill="#C99A64" stroke={INK} strokeWidth={4} />
              <path d="M-130,-147 L-150,0 M130,-147 L150,0" stroke={INK} strokeWidth={8} />
              <rect x={-40} y={-290} width={80} height={125} rx={10} fill="#C9D2DC" stroke={INK} strokeWidth={4} />
              <rect x={-52} y={-304} width={104} height={18} rx={6} fill="#8E97A6" stroke={INK} strokeWidth={3} />
              {[70, 105].map((x) => (
                <rect key={x} x={x} y={-195} width={24} height={30} rx={4} fill="#F4EFE6" stroke={INK} strokeWidth={3} />
              ))}
            </g>
            {/* storm lanterns hung on the wall */}
            {[300, 1500].map((x) => (
              <g key={x} transform={`translate(${x},380)`}>
                <rect x={-18} y={0} width={36} height={56} rx={8} fill="#FFE08A" stroke={INK} strokeWidth={4} />
                <path d="M-18,0 Q0,-40 18,0" stroke={INK} strokeWidth={5} fill="none" />
              </g>
            ))}
          </g>
        ),
      },
    ];
  },
  light: () => (
    <g>
      <Glow x={300} y={420} r={420} color="#FFD98A" opacity={0.45} />
      <Glow x={1500} y={420} r={420} color="#FFD98A" opacity={0.45} />
    </g>
  ),
  grade: (c) => (
    <g>
      {todOf(c.v) === 'night' && <Grade color="#3A3F78" amount={0.32} />}
      <Vignette amount={0.45} />
    </g>
  ),
});
void PX;
