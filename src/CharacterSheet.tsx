import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Figure, type Expression, type PoseName} from './characters/Figure';
import {characters, type CharacterId} from './characters/registry';
import {C, fonts} from './theme';

/** Model sheet: every character, plus Jonah's expression and pose range. Used to keep designs consistent. */
export const CharacterSheet: React.FC = () => {
  const ids = Object.keys(characters) as CharacterId[];
  const exprs: Expression[] = ['neutral', 'happy', 'ecstatic', 'nervous', 'curious', 'confused', 'alarmed', 'determined', 'serious', 'sleep'];
  const poses: PoseName[] = ['stand', 'armsUp', 'wave', 'point', 'handsOnHead', 'shrug', 'hold', 'crossArms', 'throw', 'reach'];
  return (
    <AbsoluteFill style={{background: `linear-gradient(${C.dusk}, ${C.ink})`}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        {ids.map((id, i) => (
          <g key={id}>
            <Figure char={id} x={170 + i * 300} y={430} scale={1} pose="stand" expression="happy" />
            <text x={170 + i * 300} y={470} textAnchor="middle" fill={C.pearl} fontFamily={fonts.ui} fontSize={22}>
              {characters[id].name}
            </text>
          </g>
        ))}
        {exprs.map((e, i) => (
          <Figure key={e} char="jonah" x={110 + i * 190} y={760} scale={0.62} pose="stand" expression={e} />
        ))}
        {poses.map((p, i) => (
          <Figure key={p} char="jonah" x={110 + i * 190} y={1060} scale={0.6} pose={p} expression="happy" />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
