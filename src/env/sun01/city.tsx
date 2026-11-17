import React, {useId} from 'react';
import {interpolate} from 'remotion';
import {Figure} from '../../characters/Figure';
import {extra} from '../../characters/registry';
import {useShot} from '../../engine/shot-context';
import {Aurora, Bloom, Snow} from '../../fx/cinema/atmos';
import {Cine, Plane, type CamKey} from '../../fx/cinema/camera';
import {C} from '../../theme';
import {Stage} from '../common';
import {CityBlocks, NightGrade, NightSky, P} from './parts';

/** Birds crossing a morning sky. */
const Birds: React.FC<{frame: number}> = ({frame}) => (
  <g>
    {Array.from({length: 7}, (_, i) => {
      const x = ((frame * (2.2 + (i % 3) * 0.6) + i * 260) % 2600) - 300;
      const y = 260 + ((i * 53) % 160) + Math.sin(frame * 0.05 + i) * 10;
      const flap = Math.sin(frame * 0.4 + i) * 8;
      return <path key={i} d={`M${x - 14},${y + flap} Q${x - 6},${y - 6} ${x},${y} Q${x + 6},${y - 6} ${x + 14},${y + flap}`} stroke="#1E2A4A" strokeWidth={3.5} fill="none" strokeLinecap="round" />;
    })}
  </g>
);

/** A row of balconies in the foreground with silhouetted neighbours looking up. */
const Balconies: React.FC<{frame: number; y: number; phones?: boolean; snow?: number}> = ({frame, y, phones, snow = 0}) => (
  <g>
    <rect x={-400} y={y} width={2800} height={700} fill="#0A0E24" />
    {[-200, 260, 720, 1180, 1640, 2100].map((x, i) => (
      <g key={x}>
        <rect x={x} y={y - 210} width={330} height={210} fill="#141A3A" stroke={C.ink} strokeWidth={4} />
        <rect x={x + 30} y={y - 180} width={120} height={180} fill={i % 2 ? '#FFB867' : '#2A3260'} opacity={i % 2 ? 0.55 : 1} />
        {snow > 0 && <rect x={x - 10} y={y - 14} width={350} height={14 * snow} rx={5} fill={P.snow} opacity={0.9} />}
        <Figure char={extra(i * 7 + 3)} x={x + 230} y={y - 10} scale={0.62} pose={phones && i % 2 ? 'pointUp' : 'stand'} expression="surprised" look={[0, -1]} back={i % 3 === 0} rim={false} seed={i} />
        {phones && i % 2 === 1 && <Bloom x={x + 270} y={y - 230} r={60} color="#E8F2FF" opacity={0.8} />}
        <rect x={x - 10} y={y - 70} width={350} height={70} fill="none" stroke="#2C3466" strokeWidth={6} />
        {Array.from({length: 8}, (_, k) => (
          <path key={k} d={`M${x + k * 44},${y - 70} L${x + k * 44},${y}`} stroke="#2C3466" strokeWidth={4} />
        ))}
      </g>
    ))}
    <NightGrade amount={0.35} />
  </g>
);

export const City: React.FC = () => {
  const {props, frame, t, dur, progress} = useShot();
  const id = useId().replace(/:/g, '');
  const state = props.state as string;
  const keys: Record<string, CamKey[]> = {
    sun: [[0, 1.25, 1100, 520], [1, 1.02, 960, 560]],
    starsNoon: [[0, 1.0, 960, 640], [1, 1.12, 960, 380]],
    aurora: [[0, 1.05, 960, 640], [1, 1.12, 960, 420]],
    gridDying: [[0, 1.08, 1000, 600, 0], [1, 1.2, 880, 640, 0]],
  };
  const sun = state === 'sun';
  const snowy = state === 'aurora' || state === 'gridDying';
  const lights = state === 'starsNoon' ? 0.55 : state === 'aurora' ? 0.35 : state === 'gridDying' ? 0.6 : 0;
  const wave = state === 'gridDying' ? interpolate(t, [2, dur - 1.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : -1;

  return (
    <Stage bg="#000">
      <Cine keys={keys[state] ?? keys.sun} progress={progress} frame={frame} handheld={0.25}>
        <Plane depth={0.15}>
          {sun ? (
            <g>
              <defs>
                <linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4F9BE0" />
                  <stop offset="0.55" stopColor="#9FD0F2" />
                  <stop offset="1" stopColor="#FFE3B4" />
                </linearGradient>
              </defs>
              <rect x={-600} y={-500} width={3200} height={2200} fill={`url(#${id}m)`} />
              <Bloom x={1520} y={230} r={560} color="#FFF4D0" opacity={0.95} />
              <circle cx={1520} cy={230} r={58} fill="#FFFDF0" />
            </g>
          ) : (
            <NightSky frame={frame} stars={state === 'gridDying' ? 0.7 : 1.15} colors={snowy ? P.coldSky : P.nightSky} />
          )}
          {state === 'aurora' && <Aurora frame={frame} y={560} intensity={interpolate(t, [0, 2], [0.4, 1], {extrapolateRight: 'clamp'})} />}
        </Plane>
        {sun && (
          <Plane depth={0.3}>
            <Birds frame={frame} />
          </Plane>
        )}
        <Plane depth={0.4}>
          <CityBlocks seed={12} base={760} color={sun ? '#A9BFD6' : snowy ? '#1A2648' : '#131A3D'} minH={220} maxH={560} lights={lights * 0.8} darkWave={wave} snow={snowy ? 1 : 0} frame={frame} sunlit={sun ? '#FFF0D0' : undefined} />
          {sun && <rect x={-600} y={520} width={3200} height={260} fill="#FFF1D8" opacity={0.35} />}
          {!sun && <rect x={-600} y={600} width={3200} height={200} fill={snowy ? '#3A5A8A' : '#2A2F6A'} opacity={0.25} />}
        </Plane>
        <Plane depth={0.65}>
          <CityBlocks seed={44} base={900} color={sun ? '#7F98B8' : snowy ? '#101A36' : '#0C1230'} minH={160} maxH={420} lights={lights} darkWave={wave} snow={snowy ? 1 : 0} frame={frame} sunlit={sun ? '#FFE6B8' : undefined} />
          {/* the street far below: moving cars by day, frozen ones after */}
          <rect x={-600} y={900} width={3200} height={400} fill={sun ? '#5E6E88' : snowy ? '#C9D8EA' : '#10142E'} />
          {sun &&
            Array.from({length: 9}, (_, i) => {
              const x = ((frame * (3 + (i % 3)) + i * 330) % 3000) - 500;
              return <rect key={i} x={i % 2 ? 2400 - x : x} y={930 + (i % 3) * 26} width={46} height={18} rx={6} fill={['#D9443A', '#F2D16B', '#4FA3A5', '#F4EFE6'][i % 4]} stroke={C.ink} strokeWidth={2.5} />;
            })}
        </Plane>
        {state === 'starsNoon' && (
          <Plane depth={1}>
            <Balconies frame={frame} y={1010} phones />
          </Plane>
        )}
        {state === 'aurora' && (
          <Plane depth={1}>
            <rect x={-400} y={940} width={2800} height={400} fill="#0A0E24" />
            <rect x={-400} y={928} width={2800} height={20} rx={8} fill={P.snow} opacity={0.85} />
            <Figure char="you" x={820} y={1040} scale={1.25} pose="stand" back hoodUp rim={false} />
            <Figure char="mira" x={1040} y={1040} scale={1.25} pose="pointUp" back rim={false} />
            <NightGrade amount={0.45} color="#0B2A3A" />
            <rect x={-400} y={-400} width={2800} height={1800} fill="#3EE8A0" opacity={0.06} style={{mixBlendMode: 'screen'}} />
          </Plane>
        )}
        {snowy && (
          <Plane depth={1.1}>
            <Snow frame={frame} density={state === 'gridDying' ? 0.7 : 0.35} wind={0.5} />
          </Plane>
        )}
      </Cine>
    </Stage>
  );
};
