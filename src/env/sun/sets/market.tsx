import React, {useMemo} from 'react';
import {rand} from '../../../fx/sky';
import {Glow, Grade, INK, registerSet, Vignette} from '../stage';

/**
 * The supermarket on Day 1: fluorescent strips still on, shelves half-stripped, signs, a trolley.
 * floor y = 940. v: grab · heater
 */
const PRODUCTS = ['#C2464F', '#E9C46A', '#3E7CB1', '#3C8D6E', '#F4EFE6', '#E07A5F', '#8E6BBF', '#F2994A'];

const Shelf: React.FC<{x: number; w: number; base: number; seed: number; stripped: number; label: string; col: string}> = ({x, w, base, seed, stripped, label, col}) => {
  const items = useMemo(() => {
    const r = rand(seed);
    return Array.from({length: 4}, (_, row) => Array.from({length: Math.floor(w / 46)}, () => ({there: r() > stripped, col: PRODUCTS[Math.floor(r() * PRODUCTS.length)], h: 40 + r() * 34, w: 30 + r() * 12, tipped: r() > 0.85})));
  }, [seed, w, stripped]);
  return (
    <g>
      <rect x={x} y={base - 560} width={w} height={560} fill="#D9DDE2" stroke={INK} strokeWidth={5} />
      <rect x={x - 10} y={base - 640} width={w + 20} height={70} fill={col} stroke={INK} strokeWidth={5} />
      <text x={x + w / 2} y={base - 592} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={34} fill="#FFFFFF" letterSpacing={4}>
        {label}
      </text>
      {items.map((row, ri) => {
        const sy = base - 440 + ri * 120;
        return (
          <g key={ri}>
            {row.map((it, k) =>
              it.there ? (
                <rect key={k} x={x + 14 + k * 46} y={sy - it.h} width={it.w} height={it.h} rx={4} fill={it.col} stroke={INK} strokeWidth={2.5} transform={it.tipped ? `rotate(-80,${x + 14 + k * 46},${sy})` : undefined} />
              ) : null,
            )}
            <rect x={x} y={sy} width={w} height={14} fill="#AEB4BC" stroke={INK} strokeWidth={3} />
            <rect x={x + 30} y={sy + 2} width={50} height={14} fill="#F2C94C" />
          </g>
        );
      })}
    </g>
  );
};

registerSet('market', {
  layers: (c) => [
    {
      depth: 0.5,
      node: (
        <g>
          <rect x={-900} y={-300} width={3800} height={1400} fill="#E8E4DA" />
          {/* far aisles */}
          {Array.from({length: 9}, (_, i) => (
            <Shelf key={i} x={-700 + i * 420} w={340} base={820} seed={i + 40} stripped={0.6} label={['WATER', 'TINS', 'BREAD', 'RICE', 'PASTA', 'BATTERIES', 'CANDLES', 'PET', 'SOUP'][i]} col={['#3E7CB1', '#C2464F', '#E9C46A', '#3C8D6E', '#E07A5F', '#6D597A', '#F2994A', '#3E7CB1', '#C2464F'][i]} />
          ))}
          <rect x={-900} y={-300} width={3800} height={1400} fill="#FFFFFF" opacity={0.25} />
        </g>
      ),
    },
    {
      depth: 1,
      node: (
        <g>
          {/* ceiling strips */}
          {Array.from({length: 8}, (_, i) => (
            <rect key={i} x={-300 + i * 340} y={-40} width={220} height={22} rx={8} fill="#F8FCFF" stroke={INK} strokeWidth={3} opacity={i === 5 && Math.sin(c.frame * 0.9) > 0.6 ? 0.3 : 1} />
          ))}
          <Shelf x={-500} w={560} base={940} seed={7} stripped={0.7} label="CANDLES · BATTERIES" col="#F2994A" />
          <Shelf x={1420} w={600} base={940} seed={11} stripped={0.75} label="RICE · PASTA" col="#3C8D6E" />
          {/* hanging sign */}
          <path d="M760,-200 L760,90 M1160,-200 L1160,90" stroke={INK} strokeWidth={3} />
          <rect x={700} y={90} width={520} height={80} rx={10} fill="#C2464F" stroke={INK} strokeWidth={5} />
          <text x={960} y={146} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={40} fill="#FFFFFF" letterSpacing={3}>
            LIMIT 2 PER CUSTOMER
          </text>
          {/* floor */}
          <rect x={-900} y={940} width={3800} height={500} fill="#C9C4B8" />
          {Array.from({length: 30}, (_, i) => (
            <path key={i} d={`M${-900 + i * 130},940 L${-1100 + i * 170},1440`} stroke="#B2AC9E" strokeWidth={3} />
          ))}
          {/* dropped items */}
          <rect x={620} y={950} width={40} height={30} rx={4} fill="#E9C46A" stroke={INK} strokeWidth={3} transform="rotate(20,640,965)" />
          <circle cx={1300} cy={975} r={18} fill="#C2464F" stroke={INK} strokeWidth={3} />
          {c.v === 'heater' && (
            <g transform="translate(1000,880)">
              <rect x={-110} y={-90} width={220} height={130} rx={10} fill="#F4EFE6" stroke={INK} strokeWidth={5} transform={`rotate(${Math.sin(c.frame * 0.5) * 6})`} />
              <text x={0} y={-12} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize={30} fill="#C2464F" transform={`rotate(${Math.sin(c.frame * 0.5) * 6})`}>
                HEATER
              </text>
              <path d="M-80,10 L80,10" stroke="#F2994A" strokeWidth={8} transform={`rotate(${Math.sin(c.frame * 0.5) * 6})`} />
            </g>
          )}
        </g>
      ),
    },
    ...(c.p.trolley
      ? [
          {
            depth: 1,
            front: true,
            node: (
              <g transform={`translate(${Math.min(1000, 700 + c.t * 214) + 150},940)`}>
                {/* trolley pushed ahead of you */}
                <path d="M0,-200 L260,-200 L230,-60 L30,-60 Z" fill="none" stroke="#8A8F9C" strokeWidth={8} />
                {Array.from({length: 6}, (_, k) => (
                  <path key={k} d={`M${10 + k * 44},-200 L${36 + k * 36},-60`} stroke="#8A8F9C" strokeWidth={4} />
                ))}
                <rect x={60} y={-250} width={50} height={60} rx={4} fill="#F4EFE6" stroke={INK} strokeWidth={3} />
                <rect x={130} y={-240} width={60} height={50} rx={4} fill="#3E7CB1" stroke={INK} strokeWidth={3} />
                <path d="M0,-200 L-40,-240" stroke="#8A8F9C" strokeWidth={8} />
                <path d="M30,-60 L20,-20 M230,-60 L240,-20" stroke="#8A8F9C" strokeWidth={6} />
                <circle cx={20} cy={-10} r={12} fill="#2A2A2A" />
                <circle cx={240} cy={-10} r={12} fill="#2A2A2A" />
              </g>
            ),
          },
        ]
      : []),
  ],
  light: () => (
    <g>
      <Glow x={960} y={0} r={900} color="#F2FAFF" opacity={0.3} />
    </g>
  ),
  grade: () => (
    <g>
      <Grade color="#C8E0E8" amount={0.12} />
      <Vignette amount={0.45} />
    </g>
  ),
});
