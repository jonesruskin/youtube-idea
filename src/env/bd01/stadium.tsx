import React from 'react';
import {Freeze, interpolate} from 'remotion';
import {Figure} from '../../characters/Figure';
import {extra, type CharacterDesign} from '../../characters/registry';
import {Camera} from '../../fx/camera';
import {Stars} from '../../fx/sky';
import {C} from '../../theme';
import {Shadow} from '../kit';
import {Stage} from '../common';
import {BD, ease01, Firework, useBeatCam, type BeatTable} from './shared';

const BEATS: BeatTable = {
  cold: {cam: [[1.0, 960, 470], [1.45, 960, 700]]},
  band: {cam: [[1.4, 960, 640], [1.55, 960, 620]]},
  freeze: {cam: [[1.55, 960, 680], [1.75, 960, 720]]},
  peak: {cam: [[1.0, 960, 560], [1.12, 960, 600]]},
  turn: {cam: [[2.3, 760, 860], [2.45, 790, 860]]},
  empty: {cam: [[2.2, 820, 880], [1.35, 1020, 760]]},
  tease: {cam: [[1.05, 960, 560], [1.6, 960, 760]]},
};

const CX = 960;
const CY = 790;
const STAGE_Y = 560;

/** Silhouette performer: a rig figure in stage-black with a gold rim. */
const shadowMan = (seed: number, hair: CharacterDesign['hair']): CharacterDesign =>
  extra(seed, {skin: '#0D1022', skinShade: '#0D1022', hairColor: '#0D1022', topColor: '#0D1022', topAccent: '#0D1022', pants: '#0D1022', shoes: '#0D1022', signature: '#FFD27A', hair, beard: false});

const Bowl: React.FC<{frame: number; crowd: boolean}> = ({frame, crowd}) => {
  const rows = 16;
  return (
    <g>
      <defs>
        <pattern id="seats" width={22} height={16} patternUnits="userSpaceOnUse">
          <rect width={22} height={16} fill="#1B2A4E" />
          <rect x={3} y={3} width={16} height={9} rx={3} fill="#2D4A86" />
        </pattern>
        <pattern id="crowd" width={46} height={34} patternUnits="userSpaceOnUse" patternTransform={`translate(0,${Math.sin(frame * 0.5) * 4})`}>
          <rect width={46} height={34} fill="#141B33" />
          <rect x={4} y={14} width={16} height={20} rx={6} fill="#E35D5D" />
          <circle cx={12} cy={10} r={7} fill="#7A4A2E" />
          <rect x={26} y={12} width={16} height={22} rx={6} fill="#F6C453" />
          <circle cx={34} cy={8} r={7} fill="#E8C4A8" />
        </pattern>
        <clipPath id="bowlClip">
          <path d={`M${CX - 1560},${CY} A1560,620 0 0,1 ${CX + 1560},${CY} L${CX + 920},${CY} A920,270 0 0,0 ${CX - 920},${CY} Z`} />
        </clipPath>
      </defs>
      {/* roof ring */}
      <path d={`M${CX - 1700},${CY} A1700,720 0 0,1 ${CX + 1700},${CY} L${CX + 1560},${CY} A1560,620 0 0,0 ${CX - 1560},${CY} Z`} fill="#0D1226" stroke={C.ink} strokeWidth={4} />
      {/* stands */}
      <path d={`M${CX - 1560},${CY} A1560,620 0 0,1 ${CX + 1560},${CY} L${CX + 920},${CY} A920,270 0 0,0 ${CX - 920},${CY} Z`} fill={crowd ? 'url(#crowd)' : 'url(#seats)'} />
      <g clipPath="url(#bowlClip)">
        {Array.from({length: rows}, (_, i) => {
          const k = i / rows;
          const rx = 920 + (1560 - 920) * k;
          const ry = 270 + (620 - 270) * k;
          return <ellipse key={i} cx={CX} cy={CY} rx={rx} ry={ry} fill="none" stroke="#0B1026" strokeWidth={i === 7 ? 18 : 3} opacity={0.75} />;
        })}
        {/* aisles */}
        {Array.from({length: 18}, (_, i) => {
          const a = Math.PI + (i / 17) * Math.PI;
          return <line key={i} x1={CX + Math.cos(a) * 920} y1={CY + Math.sin(a) * 270} x2={CX + Math.cos(a) * 1560} y2={CY + Math.sin(a) * 620} stroke="#0B1026" strokeWidth={5} opacity={0.6} />;
        })}
        {crowd &&
          Array.from({length: 40}, (_, i) => {
            const on = (frame + i * 7) % 23 < 2;
            const a = Math.PI + ((i * 37) % 100) / 100 * Math.PI;
            const d = 0.2 + ((i * 53) % 70) / 100;
            return on ? <circle key={i} cx={CX + Math.cos(a) * (920 + 640 * d)} cy={CY + Math.sin(a) * (270 + 350 * d)} r={7} fill="#FFFFFF" opacity={0.9} /> : null;
          })}
      </g>
      {/* floodlight banks on the roof */}
      {[-1180, -620, 0, 620, 1180].map((dx, i) => {
        const a = Math.acos(Math.max(-1, Math.min(1, dx / 1630)));
        const fy = CY - Math.sin(a) * 670;
        return (
          <g key={i}>
            <rect x={CX + dx - 70} y={fy - 34} width={140} height={46} rx={4} fill="#1A2140" stroke={C.ink} strokeWidth={3} />
            {Array.from({length: 8}, (_, k) => (
              <rect key={k} x={CX + dx - 62 + (k % 4) * 32} y={fy - 28 + Math.floor(k / 4) * 20} width={26} height={15} rx={2} fill="#FFF8E4" />
            ))}
            <circle cx={CX + dx} cy={fy - 10} r={120} fill="#FFF3D0" opacity={0.18} />
          </g>
        );
      })}
    </g>
  );
};

const Pitch: React.FC<{goal?: boolean}> = ({goal}) => (
  <g>
    <defs>
      <clipPath id="pitchClip">
        <ellipse cx={CX} cy={CY + 40} rx={920} ry={270} />
        <rect x={CX - 1600} y={CY + 40} width={3200} height={700} />
      </clipPath>
    </defs>
    <g clipPath="url(#pitchClip)">
      <rect x={-800} y={CY - 300} width={3600} height={1200} fill="#2F7D4A" />
      {Array.from({length: 14}, (_, i) => (
        <rect key={i} x={-800} y={CY - 260 + i * 70 + i * i * 2} width={3600} height={35 + i * 2} fill="#3A8C55" />
      ))}
      <ellipse cx={CX} cy={CY + 170} rx={210} ry={62} fill="none" stroke="#EAF5EC" strokeWidth={6} opacity={0.85} />
      <line x1={-800} y1={CY + 170} x2={2800} y2={CY + 170} stroke="#EAF5EC" strokeWidth={6} opacity={0.85} />
      <circle cx={CX} cy={CY + 170} r={7} fill="#EAF5EC" />
    </g>
    {goal && (
      <g>
        <rect x={CX - 190} y={CY - 140} width={380} height={130} fill="none" stroke="#FFFFFF" strokeWidth={9} />
        {Array.from({length: 12}, (_, i) => (
          <line key={i} x1={CX - 190 + i * 34} y1={CY - 140} x2={CX - 190 + i * 34} y2={CY - 10} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.5} />
        ))}
        {Array.from({length: 4}, (_, i) => (
          <line key={i} x1={CX - 190} y1={CY - 110 + i * 30} x2={CX + 190} y2={CY - 110 + i * 30} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.5} />
        ))}
        <path d={`M${CX - 420},${CY - 10} L${CX + 420},${CY - 10} L${CX + 520},${CY + 120} L${CX - 520},${CY + 120} Z`} fill="none" stroke="#EAF5EC" strokeWidth={6} opacity={0.8} />
      </g>
    )}
  </g>
);

/** Concert stage at the far end: LED wall, truss, band silhouettes, sweeping beams. */
const ConcertStage: React.FC<{frame: number; power: number}> = ({frame, power}) => {
  const beams = [-1, -0.5, 0, 0.5, 1];
  return (
    <g>
      {power > 0 &&
        beams.map((b, i) => {
          const a = b * 0.5 + Math.sin(frame * 0.035 + i) * 0.35;
          const len = 1100;
          const x0 = CX + b * 220;
          const y0 = STAGE_Y - 230;
          const w = 70;
          const tipX = x0 + Math.sin(a) * len;
          const tipY = y0 - Math.cos(a) * len;
          const nx = Math.cos(a) * w * 2.6;
          const ny = Math.sin(a) * w * 2.6;
          return (
            <path key={i} d={`M${x0 - 8},${y0} L${x0 + 8},${y0} L${tipX + nx},${tipY + ny} L${tipX - nx},${tipY - ny} Z`} fill={['#F6C453', '#7FD6FF', '#FF8AB8', '#7FD6FF', '#F6C453'][i]} opacity={0.16 * power} style={{mixBlendMode: 'screen'}} />
          );
        })}
      <rect x={CX - 330} y={STAGE_Y - 250} width={660} height={22} fill="#20263F" stroke={C.ink} strokeWidth={3} />
      {[CX - 330, CX + 308].map((x) => (
        <rect key={x} x={x} y={STAGE_Y - 250} width={22} height={250} fill="#20263F" stroke={C.ink} strokeWidth={3} />
      ))}
      {/* LED wall: abstract colour bars only */}
      <rect x={CX - 280} y={STAGE_Y - 220} width={560} height={150} fill="#0B0F1E" stroke={C.ink} strokeWidth={3} />
      {power > 0 &&
        Array.from({length: 14}, (_, i) => {
          const h = 20 + Math.abs(Math.sin(frame * 0.18 + i * 0.7)) * 120 * power;
          return <rect key={i} x={CX - 270 + i * 39.5} y={STAGE_Y - 74 - h} width={30} height={h} fill={i % 3 === 0 ? '#F6C453' : i % 3 === 1 ? '#FF8AB8' : '#7FD6FF'} opacity={0.85} />;
        })}
      <rect x={CX - 300} y={STAGE_Y - 70} width={600} height={70} fill="#1A1F33" stroke={C.ink} strokeWidth={4} />
      <ellipse cx={CX} cy={STAGE_Y - 66} rx={300} ry={14} fill="#FFF3D0" opacity={0.25 * power} />
      {/* band */}
      <Figure char={shadowMan(901, 'afro')} x={CX - 10} y={STAGE_Y - 70} scale={0.36} pose={power > 0.5 ? 'pointUp' : 'stand'} rim={power > 0} />
      <Figure char={shadowMan(902, 'cap')} x={CX - 170} y={STAGE_Y - 70} scale={0.34} pose="hold" rim={power > 0} />
      <Figure char={shadowMan(903, 'braids')} x={CX + 170} y={STAGE_Y - 70} scale={0.34} pose="hold" rim={power > 0} />
      <g>
        <circle cx={CX + 95} cy={STAGE_Y - 92} r={20} fill="#0D1022" stroke="#FFD27A" strokeWidth={2} opacity={0.9} />
        <circle cx={CX + 70} cy={STAGE_Y - 100} r={10} fill="#0D1022" stroke="#FFD27A" strokeWidth={2} />
      </g>
    </g>
  );
};

export const Stadium: React.FC = () => {
  const {frame: liveFrame, beat, cam, t, lineAt, dur} = useBeatCam(BEATS, 'cold');
  const frozen = beat === 'freeze';
  const frame = frozen ? 70 : liveFrame;
  const tease = beat === 'tease';
  const concert = beat === 'peak' || beat === 'turn' || beat === 'empty';
  const power = beat === 'cold' ? 0 : 1;
  const ft = frozen ? 2.6 : t; // firework clock

  // Fireworks schedule (seconds into the shot).
  const bursts =
    beat === 'band' || beat === 'freeze'
      ? [
          {x: CX - 420, y: 230, d: 0.2, c: '#F6C453'},
          {x: CX + 380, y: 180, d: 0.9, c: '#FF8AB8'},
          {x: CX + 40, y: 120, d: 1.6, c: '#7FD6FF'},
        ]
      : beat === 'peak' || beat === 'turn'
        ? Array.from({length: 8}, (_, i) => ({x: CX - 700 + ((i * 397) % 1400), y: 120 + ((i * 131) % 200), d: i * 1.1, c: ['#F6C453', '#FF8AB8', '#7FD6FF', '#FFFFFF'][i % 4]}))
        : beat === 'empty'
          ? [{x: CX + 520, y: 160, d: 0.4, c: '#F6C453'}]
          : [];

  const richestPose = beat === 'cold' ? 'stand' : beat === 'band' || beat === 'freeze' ? 'armsUp' : 'sit';
  const richestExpr = beat === 'cold' ? 'curious' : beat === 'band' || beat === 'freeze' ? 'ecstatic' : beat === 'turn' ? 'ecstatic' : beat === 'empty' ? 'sad' : 'happy';

  const scene = (
    <Camera progress={1} from={cam} to={cam}>
      <rect x={-1000} y={-800} width={4000} height={2600} fill="#070A1C" />
      <Stars frame={frame} count={260} w={2400} h={700} seed={9} opacity={0.8} maxR={2} />
      <Bowl frame={frame} crowd={tease} />
      <Pitch goal={tease} />
      {!tease && <ConcertStage frame={frame} power={power} />}
      {bursts.map((b, i) => (
        <Firework key={i} x={b.x} y={b.y} t={ft - b.d - (beat === 'peak' ? 1.2 : 0)} color={b.c} seed={i + 3} r={beat === 'peak' ? 260 : 220} />
      ))}
      {tease && (
        <g>
          {[-1, 1].map((s) => (
            <circle key={s} cx={CX + s * 1150} cy={160} r={260 + Math.sin(frame * 0.3) * 20} fill="#FFF8E4" opacity={0.25} />
          ))}
          <ellipse cx={CX} cy={CY + 88} rx={30} ry={8} fill="#EAF5EC" opacity={0.9} />
          <g transform={`translate(${CX},${CY + 64}) scale(0.7)`}>
            <circle r={38} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} />
            <path d="M0,-16 L15,-5 L9,13 L-9,13 L-15,-5 Z" fill="#1A1A1A" />
            {[0, 72, 144, 216, 288].map((a) => (
              <path key={a} d="M0,-16 L0,-36" stroke="#1A1A1A" strokeWidth={3} transform={`rotate(${a})`} />
            ))}
          </g>
        </g>
      )}

      {/* the pitch: you stand in the centre circle (cold open) */}
      {(beat === 'cold' || beat === 'band' || beat === 'freeze') && (
        <g>
          <Shadow x={CX} y={CY + 170} w={40} />
          <Figure char="marcus" x={CX - 190} y={CY + 150} scale={0.66} pose="crossArms" expression="serious" look={[0.6, -0.4]} />
          <Figure char="richest" x={CX} y={CY + 170} scale={0.7} pose={richestPose} expression={richestExpr} look={[0, -1]} />
        </g>
      )}

      {/* the concert: a row of VIP seats in the foreground */}
      {concert && (
        <g>
          <rect x={-600} y={930} width={3200} height={500} fill="#141B33" />
          {Array.from({length: 22}, (_, i) => {
            const x = -500 + i * 150;
            return (
              <g key={i}>
                <rect x={x} y={850} width={110} height={110} rx={14} fill="#B9302F" stroke={C.ink} strokeWidth={5} />
                <rect x={x - 6} y={930} width={122} height={34} rx={8} fill="#8E2524" stroke={C.ink} strokeWidth={5} />
              </g>
            );
          })}
          <Figure char="richest" x={700} y={1020} scale={0.62} pose={beat === 'turn' ? 'sitTalk' : 'sit'} expression={richestExpr} look={beat === 'turn' ? [1, -0.2] : beat === 'empty' ? [1, 0.2] : [0, -0.8]} />
          {beat === 'empty' && <Figure char="marcus" x={1350} y={1180} scale={0.7} pose="stand" expression="neutral" look={[1, -0.3]} />}
        </g>
      )}
      {beat === 'empty' && <rect x={-1000} y={-800} width={4000} height={2600} fill="#0A0E24" opacity={interpolate(t, [0, dur], [0.1, 0.35])} />}
    </Camera>
  );

  return (
    <Stage bg="#070A1C">
      <defs>
        <filter id="freezeDesat">
          <feColorMatrix type="saturate" values="0.12" />
        </filter>
      </defs>
      {frozen ? (
        <g filter="url(#freezeDesat)">
          <Freeze frame={70}>{scene}</Freeze>
        </g>
      ) : (
        scene
      )}
      {frozen && <rect x={0} y={0} width={1920} height={1080} fill={BD.gold} opacity={0.22 * ease01(t, 0, 0.3)} style={{mixBlendMode: 'multiply'}} />}
      {frozen && <rect x={0} y={0} width={1920} height={1080} fill="#FFFFFF" opacity={Math.max(0, 0.7 - t * 2)} />}
      {beat === 'band' && <rect x={0} y={0} width={1920} height={1080} fill="#FFF3D0" opacity={Math.max(0, 0.5 - t * 1.2)} />}
      {tease && <rect x={0} y={0} width={1920} height={1080} fill="#FFFFFF" opacity={((frame % 31) < 2 ? 0.12 : 0)} />}
      {void lineAt}
    </Stage>
  );
};
