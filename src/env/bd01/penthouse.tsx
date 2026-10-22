import React from 'react';
import {interpolate} from 'remotion';
import {Figure, type Expression, type PoseName} from '../../characters/Figure';
import {characters, extra, type CharacterDesign} from '../../characters/registry';
import {Camera} from '../../fx/camera';
import {rand} from '../../fx/sky';
import {C} from '../../theme';
import {Skyline, Stage} from '../common';
import {Shadow, Sky, type TimeOfDay} from '../kit';
import {BD, CerealBox, Coin, ease01, Glass, RICHEST_PJS, RICHEST_ROBE, Tablet, Toothbrush, useBeatCam, type BeatTable} from './shared';

const BEATS: BeatTable = {
  bed: {cam: [[1.0, 960, 540], [1.12, 960, 560]]},
  door: {cam: [[1.15, 1180, 600], [1.25, 1260, 600]]},
  bath: {cam: [[1.25, 900, 520], [1.4, 900, 500]]},
  coins: {cam: [[1.5, 1000, 560], [1.75, 1040, 620]]},
  overflow: {cam: [[1.1, 960, 640], [1.0, 960, 600]]},
  wardrobe: {cam: [[1.1, 300, 520], [1.2, 1500, 520]]},
  breakfast: {cam: [[1.6, 600, 640], [1.7, 590, 640]]},
  breakfastGrow: {cam: [[1.15, 800, 600], [0.82, 1300, 560]]},
  calendar: {cam: [[1.0, 1100, 470], [1.15, 1250, 440]]},
  decisions: {cam: [[1.2, 960, 560], [1.3, 960, 560]]},
  lights: {cam: [[1.0, 960, 500], [1.12, 1040, 480]]},
  sandwich: {cam: [[1.6, 960, 760], [1.75, 960, 760]]},
  gala: {cam: [[1.05, 960, 560], [1.25, 960, 600]]},
  galaTest: {cam: [[1.3, 960, 600], [1.2, 960, 580]]},
  kitchen: {cam: [[1.45, 760, 620], [1.6, 760, 600]]},
  kitchenWide: {cam: [[1.4, 600, 640], [0.92, 960, 560]]},
};

const FLOOR = 840;

const CityWindow: React.FC<{x: number; y: number; w: number; h: number; time: TimeOfDay; frame: number; id: string; sunX?: number}> = ({x, y, w, h, time, frame, id, sunX}) => (
  <g>
    <defs>
      <clipPath id={`win-${id}`}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
    </defs>
    <g clipPath={`url(#win-${id})`}>
      <Sky time={time} frame={frame} id={`sky-${id}`} />
      {sunX !== undefined && <circle cx={sunX} cy={y + 120 + Math.pow((sunX - 960) / 900, 2) * 160} r={48} fill="#FFF6D8" />}
      <Skyline seed={21} base={y + h} color={time === 'night' ? '#141A3C' : time === 'dawn' ? '#7E6A9A' : '#7FA4C8'} style="tower" minH={180} maxH={520} x0={x - 40} x1={x + w + 40} litChance={time === 'night' ? 0.5 : 0.05} window={time === 'night' ? '#FFD58A' : '#CFE6F5'} frame={frame} />
      <Skyline seed={8} base={y + h + 30} color={time === 'night' ? '#0D1230' : time === 'dawn' ? '#5E4F7E' : '#5E86AE'} style="nyc" minH={120} maxH={360} x0={x - 40} x1={x + w + 40} litChance={time === 'night' ? 0.4 : 0} frame={frame} />
      <rect x={x} y={y} width={w} height={h} fill="#FFFFFF" opacity={0.07} />
    </g>
    <rect x={x} y={y} width={w} height={h} fill="none" stroke="#C9C0B0" strokeWidth={10} />
    {Array.from({length: Math.floor(w / 300)}, (_, i) => (
      <rect key={i} x={x + (i + 1) * (w / Math.ceil(w / 300)) - 4} y={y} width={8} height={h} fill="#C9C0B0" />
    ))}
  </g>
);

const Marble: React.FC<{x: number; y: number; w: number; h: number; seed: number; tone?: string}> = ({x, y, w, h, seed, tone = BD.marble}) => {
  const r = rand(seed);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={tone} />
      {Array.from({length: 9}, (_, i) => {
        const sx = x + r() * w;
        return <path key={i} d={`M${sx},${y} q${r() * 120 - 60},${h * 0.3} ${r() * 80 - 40},${h * 0.6} t${r() * 90 - 45},${h * 0.4}`} stroke={BD.marbleVein} strokeWidth={2 + r() * 2} fill="none" opacity={0.8} />;
      })}
    </g>
  );
};

/** Bedroom: dawn window, self-opening curtains, the enormous bed. */
const Bedroom: React.FC<{frame: number; t: number; beat: string; lineAt: (i: number) => number}> = ({frame, t, beat, lineAt}) => {
  const open = beat === 'bed' ? ease01(t, lineAt(1) - 0.2, 2.4) : 1;
  const awake = beat === 'door' || t > lineAt(1) - 0.3;
  return (
    <g>
      <rect x={-600} y={-300} width={3200} height={FLOOR + 300} fill="#EFE6D6" />
      <CityWindow x={180} y={90} w={1300} h={640} time="dawn" frame={frame} id="bed" />
      {/* curtains */}
      {[-1, 1].map((s) => {
        const cw = 680 * (1 - open * 0.82);
        const x0 = s < 0 ? 140 : 1520 - cw;
        return (
          <g key={s}>
            <rect x={x0} y={70} width={cw} height={720} fill="#E8DCC4" stroke="#CDBE9C" strokeWidth={4} />
            {Array.from({length: 6}, (_, k) => (
              <line key={k} x1={x0 + ((k + 0.5) * cw) / 6} y1={70} x2={x0 + ((k + 0.5) * cw) / 6} y2={790} stroke="#D8CAAE" strokeWidth={6} />
            ))}
          </g>
        );
      })}
      <rect x={120} y={60} width={1440} height={16} rx={6} fill={BD.goldDeep} />
      <rect x={-600} y={FLOOR} width={3200} height={600} fill="#B8916A" />
      {Array.from({length: 18}, (_, i) => (
        <line key={i} x1={-600 + i * 200} y1={FLOOR} x2={-900 + i * 230} y2={1500} stroke="#A8825C" strokeWidth={3} />
      ))}
      {/* door to the hall */}
      <rect x={1640} y={240} width={300} height={FLOOR - 240} fill="#2A2420" stroke="#C9C0B0" strokeWidth={12} />
      {beat === 'door' && <rect x={1650} y={250} width={280} height={FLOOR - 250} fill="#F7E8C8" opacity={0.25} />}
      {/* headboard and bed */}
      <rect x={380} y={520} width={1000} height={210} rx={30} fill="#D9CBB0" stroke={C.ink} strokeWidth={6} />
      {Array.from({length: 8}, (_, i) => (
        <circle key={i} cx={460 + i * 120} cy={620} r={7} fill="#B8A684" />
      ))}
      <Figure char={RICHEST_PJS} x={880} y={800} scale={0.92} pose={awake ? (beat === 'bed' && t < lineAt(1) + 2.2 ? 'pilotJoy' : 'pilot') : 'pilot'} expression={!awake ? 'sleep' : beat === 'door' ? (t > lineAt(1) - 0.1 ? 'confused' : 'neutral') : 'surprised'} look={beat === 'door' ? [1, 0] : [-0.6, -0.2]} />
      <path d="M330,730 L1430,730 L1480,900 L280,900 Z" fill="#F5EEDF" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M330,730 Q880,690 1430,730" fill="none" stroke="#E2D6BE" strokeWidth={8} />
      {[460, 1300].map((x) => (
        <ellipse key={x} cx={x} cy={705} rx={90} ry={32} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
      ))}
      {beat === 'door' && (
        <g>
          <Shadow x={1790} y={FLOOR} w={80} />
          <Figure char="marcus" x={1790} y={FLOOR} scale={1.0} pose="hold" expression="neutral" look={[-1, 0]} flip />
        </g>
      )}
    </g>
  );
};

/** Bathroom: marble, gold tap, coins instead of water. */
const Bathroom: React.FC<{frame: number; t: number; beat: string; dur: number}> = ({frame, t, beat, dur}) => {
  const TAP_X = 1080;
  const flow = beat === 'coins' ? ease01(t, 0.6, 1.2) * (0.6 + 0.4 * ease01(t, 3, 2)) : beat === 'overflow' ? 1 : 0;
  const level = beat === 'coins' ? interpolate(t, [0.8, dur], [0, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : beat === 'overflow' ? 1 : 0;
  const R = rand(5);
  const spill = beat === 'overflow' ? Math.min(140, Math.floor(t * 22)) : 0;
  const expr: Expression = beat === 'bath' ? 'warm' : beat === 'coins' ? 'surprised' : t > 3 ? 'happy' : 'surprised';
  return (
    <g>
      <Marble x={-600} y={-300} w={3200} h={1000} seed={11} />
      <rect x={520} y={110} width={880} height={430} rx={10} fill="#C8D6DE" stroke={BD.goldDeep} strokeWidth={10} />
      <rect x={540} y={130} width={840} height={390} fill="#E4EEF2" opacity={0.6} />
      <path d="M600,130 L760,130 L620,520 L540,520 Z" fill="#FFFFFF" opacity={0.35} />
      {[480, 1440].map((x) => (
        <g key={x}>
          <rect x={x - 8} y={220} width={16} height={60} fill={BD.goldDeep} />
          <circle cx={x} cy={210} r={26} fill="#FFF3D0" opacity={0.9} />
          <circle cx={x} cy={210} r={70} fill="#FFF3D0" opacity={0.2} />
        </g>
      ))}
      <Figure char={RICHEST_ROBE} x={760} y={960} scale={1.25} pose="brushTeeth" expression={expr} look={beat === 'bath' ? [0, 0] : [1, 0.6]} holding={<Toothbrush />} />
      {/* counter */}
      <Marble x={300} y={660} w={1320} h={60} seed={3} tone="#F7F3EC" />
      <rect x={300} y={660} width={1320} height={60} fill="none" stroke={C.ink} strokeWidth={5} />
      <rect x={330} y={720} width={1260} height={300} fill="#E7DFD2" stroke={C.ink} strokeWidth={5} />
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <rect x={360 + k * 410} y={745} width={380} height={250} rx={8} fill="#EFE8DC" stroke="#CFC4B2" strokeWidth={4} />
          <rect x={530 + k * 410} y={770} width={40} height={10} rx={5} fill={BD.gold} />
        </g>
      ))}
      {/* basin + coins inside */}
      <ellipse cx={TAP_X} cy={668} rx={150} ry={26} fill="#C9952E" stroke={C.ink} strokeWidth={5} />
      <ellipse cx={TAP_X} cy={668} rx={130} ry={18} fill="#7A5A1E" />
      {level > 0 && (
        <g>
          <ellipse cx={TAP_X} cy={672 - level * 22} rx={125 + level * 20} ry={16 + level * 10} fill={BD.gold} stroke={BD.goldDeep} strokeWidth={3} />
          {Array.from({length: Math.floor(level * 26)}, (_, i) => (
            <Coin key={i} x={TAP_X - 120 + R() * 240} y={668 - level * 24 - R() * level * 26} r={9} spin={R() * 6} />
          ))}
        </g>
      )}
      {/* tap */}
      <rect x={TAP_X + 70} y={560} width={26} height={100} rx={8} fill={BD.gold} stroke={C.ink} strokeWidth={4} />
      <path d={`M${TAP_X + 83},${570} Q${TAP_X + 80},${520} ${TAP_X + 20},${525} L${TAP_X},${528} L${TAP_X},${550} L${TAP_X + 20},${548} Q${TAP_X + 58},${545} ${TAP_X + 60},${575} Z`} fill={BD.gold} stroke={C.ink} strokeWidth={4} />
      <rect x={TAP_X + 60} y={600} width={46} height={14} rx={6} fill={BD.goldDeep} stroke={C.ink} strokeWidth={3} />
      {/* the stream */}
      {flow > 0 &&
        Array.from({length: Math.round(18 * flow)}, (_, i) => {
          const p = ((frame * 0.09 + i / 18) % 1);
          return <Coin key={i} x={TAP_X + 10 + Math.sin(i * 3.1) * 6} y={550 + p * (110 - level * 22)} r={8} spin={frame * 0.3 + i} />;
        })}
      {/* overflow: coins sliding off the counter and piling on the floor */}
      {spill > 0 && (
        <g>
          <path d={`M${TAP_X - 160},${662} Q${TAP_X - 120},${640} ${TAP_X + 160},${662} L${TAP_X + 200},${700} L${TAP_X - 200},${700} Z`} fill={BD.gold} stroke={BD.goldDeep} strokeWidth={3} />
          {Array.from({length: 26}, (_, i) => {
            const p = ((frame * 0.05 + i / 26) % 1);
            const sx = TAP_X - 180 + (i * 53) % 360;
            return <Coin key={`f${i}`} x={sx + p * 30} y={700 + p * p * 330} r={9} spin={frame * 0.4 + i} />;
          })}
          {Array.from({length: spill}, (_, i) => {
            const a = R() * Math.PI;
            const d = R();
            return <Coin key={`p${i}`} x={TAP_X - 40 + Math.cos(a) * d * 560} y={1048 - Math.sin(a) * d * 40 - (spill / 140) * 30 * (1 - d)} r={10} spin={R() * 6} />;
          })}
        </g>
      )}
      <rect x={-600} y={1020} width={3200} height={400} fill="#E9E3D8" />
      {spill > 0 &&
        Array.from({length: spill}, (_, i) => {
          const r2 = rand(i + 900);
          return <Coin key={`fl${i}`} x={TAP_X - 600 + r2() * 1000} y={1030 + r2() * 40} r={10} spin={r2() * 6} />;
        })}
    </g>
  );
};

const Wardrobe: React.FC<{frame: number; t: number}> = ({frame, t}) => (
  <g>
    <rect x={-1200} y={-300} width={4400} height={1500} fill="#3B302A" />
    <rect x={-1200} y={160} width={4400} height={620} fill="#4A3C33" />
    {Array.from({length: 40}, (_, i) => {
      const x = -900 + i * 85;
      const sway = Math.sin(frame * 0.05 + i * 0.6) * 1.5;
      return (
        <g key={i} transform={`translate(${x},250) rotate(${sway})`}>
          <path d="M0,0 L0,-14 Q0,-24 10,-24" stroke="#C9C0B0" strokeWidth={3} fill="none" />
          <path d="M-40,14 L0,0 L40,14 Z" stroke="#C9C0B0" strokeWidth={4} fill="none" />
          <path d="M-42,14 L42,14 L46,180 L-46,180 Z" fill={BD.cream} stroke={C.ink} strokeWidth={4} />
          <path d="M-12,14 L0,80 L12,14" fill="#FFFFFF" stroke={C.ink} strokeWidth={2} />
          <line x1={0} y1={80} x2={0} y2={180} stroke="#CDBE9C" strokeWidth={3} />
        </g>
      );
    })}
    <rect x={-1200} y={240} width={4400} height={10} fill="#C9C0B0" />
    {Array.from({length: 14}, (_, i) => (
      <g key={i}>
        <circle cx={-1000 + i * 300} cy={130} r={10} fill="#FFF3D0" />
        <path d={`M${-1000 + i * 300},${130} L${-1080 + i * 300},${700} L${-920 + i * 300},${700} Z`} fill="#FFF3D0" opacity={0.08} />
      </g>
    ))}
    <rect x={-1200} y={780} width={4400} height={600} fill="#2A221E" />
    <Shadow x={1520} y={900} w={60} />
    <Figure char={RICHEST_ROBE} x={1520} y={900} scale={1.05} pose={t > 1.5 ? 'point' : 'stand'} expression="neutral" look={[-1, -0.2]} flip />
  </g>
);

const Dish: React.FC<{x: number; y: number; kind: number; a: number}> = ({x, y, kind, a}) => (
  <g transform={`translate(${x + (1 - a) * 300},${y})`} opacity={a}>
    <ellipse cx={0} cy={0} rx={70} ry={18} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
    {kind === 0 && (
      <g>
        <path d="M-50,-2 Q0,-55 50,-2 Z" fill="#E0662E" stroke={C.ink} strokeWidth={3} />
        {[-24, -6, 14, 30].map((dx, i) => (
          <circle key={i} cx={dx} cy={-14 - (i % 2) * 8} r={4} fill="#5FA85A" />
        ))}
      </g>
    )}
    {kind === 1 &&
      [-34, 0, 34].map((dx) => <path key={dx} d={`M${dx - 22},-4 Q${dx},-36 ${dx + 22},-4 Q${dx},-14 ${dx - 22},-4 Z`} fill="#D9963E" stroke={C.ink} strokeWidth={3} />)}
    {kind === 2 && (
      <g>
        <rect x={-62} y={-14} width={124} height={14} rx={3} fill="#B08050" stroke={C.ink} strokeWidth={3} />
        {[-44, -14, 16, 46].map((dx) => (
          <g key={dx}>
            <rect x={dx - 12} y={-34} width={24} height={20} rx={4} fill="#FFFFFF" stroke={C.ink} strokeWidth={2} />
            <rect x={dx - 12} y={-38} width={24} height={9} rx={4} fill="#F28A5B" stroke={C.ink} strokeWidth={2} />
          </g>
        ))}
      </g>
    )}
    {kind === 3 && (
      <g>
        {[0, 1, 2, 3, 4].map((k) => (
          <ellipse key={k} cx={0} cy={-8 - k * 14} rx={46} ry={12} fill="#E3B26A" stroke={C.ink} strokeWidth={3} />
        ))}
        <rect x={-12} y={-82} width={24} height={12} rx={3} fill="#FFF3B0" stroke={C.ink} strokeWidth={2} />
        <path d="M-40,-70 q10,30 4,52 M30,-66 q8,24 2,40" stroke="#8A4A12" strokeWidth={6} fill="none" opacity={0.8} />
      </g>
    )}
  </g>
);

const Dining: React.FC<{frame: number; t: number; beat: string; lineAt: (i: number) => number}> = ({frame, t, beat, lineAt}) => {
  const grow = beat === 'breakfastGrow' ? ease01(t, 0.2, 5.5) : 0;
  const tableEnd = 1180 + grow * 1500;
  const dishAt = (k: number) => (beat === 'breakfastGrow' ? ease01(t, [0.5, 1.9, 3.2, lineAt(1) + 0.1][k], 0.7) : 0);
  return (
    <g>
      <rect x={-800} y={-300} width={4400} height={1500} fill="#F3EDE2" />
      <CityWindow x={-200} y={60} w={3000} h={620} time="morning" frame={frame} id="dine" />
      <rect x={-800} y={760} width={4400} height={700} fill="#D8CCB8" />
      <Figure char="richest" x={420} y={900} scale={0.95} pose="sitTalk" expression={beat === 'breakfast' ? (t > lineAt(1) - 0.2 ? 'curious' : 'happy') : 'ecstatic'} look={[1, -0.1]} />
      {beat === 'breakfast' && <Figure char="ada" x={760} y={860} scale={0.95} pose="hold" expression="happy" look={[-1, 0]} flip holding={<Tablet />} />}
      {/* table */}
      <rect x={300} y={700} width={tableEnd - 300} height={36} rx={6} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} />
      <path d={`M300,736 L${tableEnd},736 L${tableEnd + 20},1000 L280,1000 Z`} fill="#F4F0E8" stroke={C.ink} strokeWidth={4} />
      {Array.from({length: Math.floor((tableEnd - 300) / 120)}, (_, i) => (
        <line key={i} x1={360 + i * 120} y1={740} x2={350 + i * 121} y2={1000} stroke="#E4DCCB" strokeWidth={5} />
      ))}
      {[0, 1, 2, 3].map((k) => (
        <Dish key={k} x={620 + k * 360} y={702} kind={k} a={dishAt(k)} />
      ))}
      {beat === 'breakfast' && <Dish x={620} y={702} kind={1} a={0} />}
    </g>
  );
};

/** Office: glass walls, the calendar wall, monitors, the night-town screen. */
const Office: React.FC<{frame: number; t: number; beat: string; dur: number; lineAt: (i: number) => number}> = ({frame, t, beat, dur, lineAt}) => {
  const sunX = beat === 'decisions' ? interpolate(t, [0, dur], [200, 1700]) : 1500;
  const time: TimeOfDay = beat === 'decisions' ? (t > dur * 0.7 ? 'sunset' : 'afternoon') : 'afternoon';
  if (beat === 'sandwich') {
    const gone = ease01(t, Math.max(1.2, dur - 2.2), 1.2);
    return (
      <g>
        <rect x={-600} y={-300} width={3200} height={1700} fill="#3A2C24" />
        <rect x={-600} y={300} width={3200} height={1100} fill="#5A4030" />
        {Array.from({length: 10}, (_, i) => (
          <line key={i} x1={-600} y1={340 + i * 70} x2={2600} y2={340 + i * 70 + 20} stroke="#4A3428" strokeWidth={4} />
        ))}
        <g transform={`translate(${960 + gone * 1400},${780})`}>
          <ellipse rx={260} ry={70} fill="#FFFFFF" stroke={C.ink} strokeWidth={6} />
          <defs>
            <clipPath id="bite">
              <path d="M-220,-120 L220,-120 L220,40 L-220,40 Z M150,-60 a55,55 0 1,0 0.1,0 Z" clipRule="evenodd" />
            </clipPath>
          </defs>
          <g clipPath="url(#bite)">
            <rect x={-180} y={-80} width={360} height={40} rx={18} fill="#E3B26A" stroke={C.ink} strokeWidth={4} />
            <rect x={-176} y={-48} width={352} height={14} fill="#6FBF5A" />
            <rect x={-176} y={-36} width={352} height={12} fill="#E04A3A" />
            <rect x={-180} y={-26} width={360} height={36} rx={14} fill="#E3B26A" stroke={C.ink} strokeWidth={4} />
          </g>
        </g>
        {t > Math.max(1.2, dur - 2.6) && (
          <g transform={`translate(${2000 - ease01(t, Math.max(1.2, dur - 2.6), 0.5) * 860 + gone * 1400},780)`}>
            <rect x={0} y={-30} width={420} height={70} rx={30} fill="#1E2230" />
            <ellipse cx={0} cy={0} rx={60} ry={46} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} />
          </g>
        )}
      </g>
    );
  }
  return (
    <g>
      <rect x={-800} y={-300} width={4400} height={1500} fill="#E6E9EE" />
      <CityWindow x={-300} y={40} w={1180} h={760} time={time} frame={frame} id="office" sunX={beat === 'decisions' ? sunX : undefined} />
      {beat === 'calendar' && (
        <g>
          <rect x={920} y={60} width={980} height={720} rx={10} fill="#1A2033" stroke={C.ink} strokeWidth={6} />
          {Array.from({length: 7}, (_, c) =>
            Array.from({length: 12}, (_, r) => (
              <rect key={`${c}-${r}`} x={950 + c * 136} y={90 + r * 56} width={124} height={48} rx={6} fill="#252C44" />
            )),
          )}
          {Array.from({length: Math.floor(interpolate(t, [0.4, dur - 0.6], [0, 84], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}, (_, k) => {
            const c = k % 7;
            const r = Math.floor(k / 7);
            const fresh = interpolate(t, [0.4, dur - 0.6], [0, 84]) - k;
            return (
              <rect key={k} x={950 + c * 136} y={90 + r * 56} width={124} height={48} rx={6} fill={['#F6C453', '#7FD6FF', '#FF8AB8', '#8E6BBF', '#5FA85A'][(k * 7) % 5]} opacity={0.9} transform={fresh < 1 ? `translate(${950 + c * 136 + 62},${90 + r * 56 + 24}) scale(${1.2 - fresh * 0.2}) translate(${-(950 + c * 136 + 62)},${-(90 + r * 56 + 24)})` : undefined} />
            );
          })}
        </g>
      )}
      {beat === 'lights' && (
        <g>
          <rect x={300} y={70} width={1320} height={640} rx={12} fill="#0B1026" stroke={C.ink} strokeWidth={8} />
          {Array.from({length: 22}, (_, c) =>
            Array.from({length: 10}, (_, r) => {
              const rr = rand(c * 31 + r);
              if (rr() > 0.82) return null;
              const x = 340 + c * 58 + rr() * 10;
              const y = 120 + r * 56 + rr() * 8;
              const dark = c >= 11 && t > lineAt(1) + 0.4 + (c - 11) * 0.04;
              return <rect key={`${c}-${r}`} x={x} y={y} width={18} height={14} rx={2} fill={dark ? '#1A2140' : '#FFD58A'} opacity={dark ? 1 : 0.9} />;
            }),
          )}
          <path d="M340,700 L1580,700" stroke="#2A3358" strokeWidth={6} />
        </g>
      )}
      <rect x={-800} y={800} width={4400} height={600} fill="#AEB6C4" />
      {(beat === 'decisions' || beat === 'calendar') && (
        <g>
          {beat === 'decisions' &&
            [-1, 1].map((k) => (
              <g key={k} transform={`translate(${960 + k * 290},${600}) rotate(${k * 8})`}>
                <rect x={-110} y={-80} width={220} height={140} rx={8} fill="#1A2033" stroke={C.ink} strokeWidth={5} />
                {Array.from({length: 6}, (_, i) => (
                  <rect key={i} x={-90 + i * 32} y={40 - (20 + Math.abs(Math.sin(frame * 0.05 + i + k)) * 70)} width={20} height={20 + Math.abs(Math.sin(frame * 0.05 + i + k)) * 70} fill={k === 0 ? '#7FD6FF' : '#F6C453'} opacity={0.85} />
                ))}
              </g>
            ))}
          <Figure char="richest" x={beat === 'calendar' ? 560 : 960} y={900} scale={beat === 'calendar' ? 0.8 : 1} pose={beat === 'calendar' ? 'sit' : t > lineAt(5) - 0.2 ? 'shrug' : 'sitTalk'} expression={beat === 'calendar' ? 'serious' : t > lineAt(5) - 0.2 ? 'nervous' : 'serious'} look={beat === 'calendar' ? [1, -0.3] : [1, 0]} />
          <rect x={beat === 'calendar' ? 300 : 560} y={760} width={beat === 'calendar' ? 520 : 800} height={40} rx={6} fill="#2A2F3A" stroke={C.ink} strokeWidth={5} />
          <rect x={beat === 'calendar' ? 330 : 590} y={800} width={beat === 'calendar' ? 460 : 740} height={160} fill="#232733" stroke={C.ink} strokeWidth={4} />
          {beat === 'decisions' && <Figure char="ada" x={1460} y={940} scale={1.0} pose="hold" expression="neutral" look={[-1, 0]} flip holding={<Tablet />} />}
        </g>
      )}
      {beat === 'lights' && (
        <g>
          <Figure char="ada" x={1640} y={1000} scale={1.0} pose="hold" expression="neutral" look={[-1, -0.2]} flip holding={<Tablet />} />
          <Figure char="richest" x={300} y={1000} scale={1.05} pose={t > lineAt(1) ? 'stand' : 'crossArms'} expression={t > lineAt(1) + 0.3 ? 'sad' : 'serious'} look={[1, -0.4]} />
        </g>
      )}
    </g>
  );
};

const GUESTS: CharacterDesign[] = Array.from({length: 14}, (_, i) => {
  const r = rand(i * 7 + 3);
  const skins = ['#F0CDB4', '#E8C4A8', '#A86E48', '#7A4A2E', '#5C3521', '#D6A07A'];
  const gown = i % 2 === 0;
  return extra(600 + i, {
    skin: skins[i % skins.length],
    skinShade: skins[i % skins.length],
    top: gown ? 'wrapper' : 'suit',
    topColor: gown ? ['#8E2B4E', '#2F5D8A', '#3C8D6E', '#B8893E', '#5A3D8A'][i % 5] : '#1A1D28',
    topAccent: gown ? '#F6C453' : '#111111',
    innerColor: '#FFFFFF',
    pants: gown ? ['#8E2B4E', '#2F5D8A', '#3C8D6E', '#B8893E', '#5A3D8A'][i % 5] : '#1A1D28',
    hair: gown ? (['bun', 'braids', 'bob', 'puffs'] as const)[i % 4] : (['shortCrop', 'slick', 'bald', 'shortCrop'] as const)[i % 4],
    hairColor: r() > 0.7 ? '#C9A060' : '#17110F',
    tie: gown ? undefined : '#111111',
    earrings: gown,
    beard: !gown && r() > 0.6,
    signature: '#F6C453',
  });
});

const Ballroom: React.FC<{frame: number; t: number; beat: string; lineAt: (i: number) => number}> = ({frame, t, beat, lineAt}) => {
  const laughing = beat === 'gala' ? t > lineAt(1) - 0.3 : t > lineAt(1) - 0.2;
  const hush = beat === 'galaTest' && !laughing;
  const bounce = laughing ? (beat === 'galaTest' ? 7 : 4) : 0;
  return (
    <g>
      <rect x={-600} y={-300} width={3200} height={1600} fill="#3A1E22" />
      {Array.from({length: 12}, (_, i) => (
        <path key={i} d={`M${-500 + i * 250},-200 Q${-375 + i * 250},300 ${-500 + i * 250},820`} stroke="#5A2A30" strokeWidth={60} fill="none" />
      ))}
      {[460, 960, 1460].map((x, i) => (
        <g key={x} transform={`translate(${x},${70})`}>
          <circle r={160} fill="#FFE6A8" opacity={0.12} />
          <ellipse rx={110} ry={30} fill={BD.gold} stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 11}, (_, k) => (
            <g key={k}>
              <line x1={-100 + k * 20} y1={20} x2={-100 + k * 20} y2={60 + (k % 3) * 18} stroke="#FFF3D0" strokeWidth={2} />
              <circle cx={-100 + k * 20} cy={64 + (k % 3) * 18} r={5 + Math.sin(frame * 0.2 + k + i) * 1.5} fill="#FFFFFF" />
            </g>
          ))}
        </g>
      ))}
      <rect x={-600} y={820} width={3200} height={600} fill="#2A1418" />
      <ellipse cx={960} cy={900} rx={700} ry={90} fill="#F6C453" opacity={0.08} />
      {GUESTS.map((g, i) => {
        const row = i < 7 ? 0 : 1;
        const x = row === 0 ? 220 + i * 250 + (i > 2 ? 160 : 0) : 340 + (i - 7) * 240;
        const y = row === 0 ? 860 : 760;
        if (row === 0 && Math.abs(x - 960) < 170) return null;
        const b = Math.abs(Math.sin(frame * 0.45 + i)) * bounce;
        return <Figure key={i} char={g} x={x} y={y - b} scale={row === 0 ? 0.82 : 0.68} pose={laughing ? (i % 3 === 0 ? 'handsOnHead' : 'hold') : 'stand'} expression={laughing ? 'ecstatic' : hush ? 'neutral' : 'happy'} look={[x < 960 ? 1 : -1, 0]} seed={i} rim={false} holding={!laughing && i % 2 ? <Glass /> : undefined} />;
      })}
      <Shadow x={960} y={900} w={60} />
      <Figure char="richest" x={960} y={900} scale={0.95} pose={beat === 'gala' ? (t > lineAt(1) ? 'wave' : 'pointUp') : 'talk'} expression={beat === 'galaTest' ? (laughing ? 'confused' : 'neutral') : 'happy'} holding={beat === 'gala' ? <Glass /> : undefined} />
    </g>
  );
};

const Kitchen: React.FC<{frame: number; t: number; beat: string}> = ({frame, t, beat}) => (
  <g>
    <rect x={-1400} y={-600} width={5000} height={2400} fill="#0A0E22" />
    <CityWindow x={-1300} y={-60} w={4200} h={840} time="night" frame={frame} id="kit" />
    <rect x={-1400} y={780} width={5000} height={900} fill="#0D1126" />
    {/* the one lit corner */}
    <path d="M330,250 L-80,1000 L900,1000 Z" fill="#DDEBFF" opacity={0.16} />
    <rect x={180} y={300} width={260} height={520} rx={10} fill="#C9D3E0" stroke={C.ink} strokeWidth={6} />
    <rect x={200} y={320} width={220} height={480} fill="#EAF2FF" />
    {[380, 520, 660].map((y) => (
      <line key={y} x1={210} y1={y} x2={410} y2={y} stroke="#B8C6D8" strokeWidth={4} />
    ))}
    <rect x={440} y={300} width={120} height={520} fill="#AEB8C6" stroke={C.ink} strokeWidth={5} transform="skewY(8)" />
    <Figure char="richest" x={780} y={860} scale={1.0} pose="hold" expression="neutral" look={[-0.4, 0.3]} holding={<CerealBox />} />
    <rect x={560} y={760} width={760} height={60} rx={8} fill="#2E3446" stroke={C.ink} strokeWidth={5} />
    <rect x={590} y={820} width={700} height={260} fill="#1C2132" stroke={C.ink} strokeWidth={4} />
    <circle cx={330} cy={520} r={260} fill="#DDEBFF" opacity={0.06 + 0.01 * Math.sin(t * 2)} />
    {beat === 'kitchenWide' && <rect x={-1400} y={-600} width={5000} height={2400} fill="#000000" opacity={0.1} />}
  </g>
);

export const Penthouse: React.FC = () => {
  const {frame, beat, cam, t, lineAt, dur} = useBeatCam(BEATS, 'bed');
  const room = ['bed', 'door'].includes(beat)
    ? 'bed'
    : ['bath', 'coins', 'overflow'].includes(beat)
      ? 'bath'
      : beat === 'wardrobe'
        ? 'wardrobe'
        : beat.startsWith('breakfast')
          ? 'dining'
          : beat.startsWith('gala')
            ? 'gala'
            : beat.startsWith('kitchen')
              ? 'kitchen'
              : 'office';
  return (
    <Stage bg="#0A0E22">
      <Camera progress={1} from={cam} to={cam}>
        {room === 'bed' && <Bedroom frame={frame} t={t} beat={beat} lineAt={lineAt} />}
        {room === 'bath' && <Bathroom frame={frame} t={t} beat={beat} dur={dur} />}
        {room === 'wardrobe' && <Wardrobe frame={frame} t={t} />}
        {room === 'dining' && <Dining frame={frame} t={t} beat={beat} lineAt={lineAt} />}
        {room === 'office' && <Office frame={frame} t={t} beat={beat} dur={dur} lineAt={lineAt} />}
        {room === 'gala' && <Ballroom frame={frame} t={t} beat={beat} lineAt={lineAt} />}
        {room === 'kitchen' && <Kitchen frame={frame} t={t} beat={beat} />}
      </Camera>
      {room === 'kitchen' && <rect x={0} y={0} width={1920} height={1080} fill="#0A0E22" opacity={0.15} />}
    </Stage>
  );
};

// Kept for type-checking pose names used above.
export type _P = PoseName;
void characters;
