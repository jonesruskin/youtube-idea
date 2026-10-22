import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {useShot} from '../engine/shot-context';
import {Executor} from '../fx/vey';
import {Stars} from '../fx/sky';
import {C, fonts} from '../theme';

const Stage: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = C.night}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      {children}
    </svg>
  </AbsoluteFill>
);

/** Time/place stamp card ("TWO HOURS EARLIER"). */
export const Card: React.FC = () => {
  const {props, ramp, frame} = useShot();
  const a = ramp(0.1, 0.5);
  return (
    <Stage>
      <Stars frame={frame} count={120} opacity={0.5} />
      <text x={960} y={520} textAnchor="middle" fill={C.pearl} fontFamily={fonts.display} fontWeight={900} fontSize={84} letterSpacing={6} opacity={a}>
        {props.text}
      </text>
      <text x={960} y={600} textAnchor="middle" fill={C.gold} fontFamily={fonts.mono} fontSize={34} letterSpacing={4} opacity={ramp(0.5, 0.5)}>
        {props.sub}
      </text>
    </Stage>
  );
};

/** Series title — case-file treatment, stamped. */
export const TitleCard: React.FC = () => {
  const {ramp, frame, t} = useShot();
  const stamp = interpolate(t, [1.4, 1.65], [2.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))});
  const stampOp = ramp(1.4, 0.15);
  return (
    <Stage bg={C.ink}>
      <Stars frame={frame} count={200} opacity={0.6} drift={[0.02, 0]} />
      <g opacity={ramp(0, 0.5)}>
        <text x={960} y={430} textAnchor="middle" fill={C.gold} fontFamily={fonts.mono} fontSize={30} letterSpacing={12}>
          FILE 01 · THE WILL
        </text>
        <text x={960} y={560} textAnchor="middle" fill={C.pearl} fontFamily={fonts.display} fontWeight={900} fontSize={140} letterSpacing={4}>
          THE BLINK FILES
        </text>
        <line x1={560} x2={1360} y1={610} y2={610} stroke={C.gold} strokeWidth={2} opacity={0.7} />
        <text x={960} y={680} textAnchor="middle" fill={C.pearl} fontFamily={fonts.will} fontStyle="italic" fontSize={56}>
          Item One: The Ship
        </text>
      </g>
      <g transform={`translate(1500,800) rotate(-12) scale(${stamp})`} opacity={stampOp}>
        <rect x={-150} y={-52} width={300} height={104} rx={10} fill="none" stroke={C.stamp} strokeWidth={8} />
        <text x={0} y={20} textAnchor="middle" fill={C.stamp} fontFamily={fonts.display} fontWeight={900} fontSize={56}>
          HEIR #01
        </text>
      </g>
    </Stage>
  );
};

/** Pearl "will slate" — the Vey's documents. Modes: clause | broadcast | rules | contest. */
export const WillDoc: React.FC = () => {
  const {props, frame, t, lineAt, ramp, speaking} = useShot();
  const mode = props.mode as string;
  const exSpeaking = speaking('EXECUTOR');
  const slateIn = ramp(0, 0.7);
  const typed = (text: string, start: number, cps = 32) => text.slice(0, Math.max(0, Math.floor((t - start) * cps)));
  // Word-wrap for the slate (≈30 characters a line at 62px Cormorant).
  const wrap = (text: string, max = 30) =>
    text.split(' ').reduce<string[]>((lines, w) => {
      const last = lines[lines.length - 1];
      if (last !== undefined && (last + ' ' + w).length <= max) lines[lines.length - 1] = last + ' ' + w;
      else lines.push(w);
      return lines;
    }, []);

  const slate = (
    <g opacity={slateIn} transform={`translate(0,${(1 - slateIn) * 30})`}>
      <rect x={380} y={170} width={1160} height={740} rx={28} fill="#F6F0E4" stroke={C.ink} strokeWidth={6} />
      <rect x={410} y={200} width={1100} height={680} rx={18} fill="none" stroke={C.gold} strokeWidth={3} />
      <rect x={426} y={216} width={1068} height={648} rx={12} fill="none" stroke={C.gold} strokeWidth={1.5} strokeDasharray="2 8" />
      {[
        [410, 200],
        [1510, 200],
        [410, 880],
        [1510, 880],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y}) rotate(${i * 90})`}>
          <path d="M0,0 q30,6 40,36 M0,0 q6,30 36,40" stroke={C.goldDeep} strokeWidth={3} fill="none" />
          <circle r={7} fill={C.gold} stroke={C.ink} strokeWidth={2} />
        </g>
      ))}
    </g>
  );

  let content: React.ReactNode = null;
  if (mode === 'clause') {
    content = (
      <g>
        <text x={960} y={330} textAnchor="middle" fill={C.goldDeep} fontFamily={fonts.mono} fontSize={34} letterSpacing={14} opacity={ramp(lineAt(0), 0.4)}>
          {props.item}
        </text>
        {(() => {
          const shown = typed(props.body as string, lineAt(1), 30);
          let used = 0;
          return wrap(props.body as string).map((ln, i) => {
            const part = shown.slice(used, used + ln.length);
            used += ln.length + 1;
            return (
              <text key={i} x={960} y={450 + i * 76} textAnchor="middle" fill={C.ink} fontFamily={fonts.will} fontWeight={600} fontSize={62}>
                {part}
              </text>
            );
          });
        })()}
        <text x={960} y={680} textAnchor="middle" fill="#9A6B1F" fontFamily={fonts.will} fontWeight={700} fontStyle="italic" fontSize={98} opacity={ramp(lineAt(2), 0.5)}>
          {props.reveal}
        </text>
      </g>
    );
  } else if (mode === 'broadcast') {
    const rows = ['This is the last will and testament of the Vey.', 'We are gone.', 'We leave everything we owned —', 'to twelve of you.'];
    const starts = [lineAt(0), lineAt(1), lineAt(2), lineAt(2) + 1.6];
    content = (
      <g>
        <text x={960} y={300} textAnchor="middle" fill={C.goldDeep} fontFamily={fonts.mono} fontSize={28} letterSpacing={10} opacity={0.9}>
          ⟡ TRANSMISSION · ALL FREQUENCIES ⟡
        </text>
        {rows.map((r, i) => (
          <text key={i} x={960} y={420 + i * 100} textAnchor="middle" fill={i === 3 ? '#9A6B1F' : C.ink} fontFamily={fonts.will} fontWeight={i === 3 ? 700 : 600} fontStyle={i === 3 ? 'italic' : 'normal'} fontSize={i === 3 ? 84 : 58} opacity={ramp(starts[i], 0.5)}>
            {r}
          </text>
        ))}
      </g>
    );
  } else if (mode === 'rules') {
    const show = props.show as number;
    const rules = ['The ship answers to you, and only you.', 'It will never carry a weapon.', 'It must be home before sunrise.'];
    content = (
      <g>
        <text x={960} y={310} textAnchor="middle" fill={C.goldDeep} fontFamily={fonts.mono} fontSize={30} letterSpacing={12}>
          ITEM ONE · TERMS OF INHERITANCE
        </text>
        {rules.map((r, i) => {
          const on = show > i ? (show === 3 && props.highlight ? 1 : ramp(lineAt(i), 0.4)) : 0;
          return (
            <g key={i} opacity={on}>
              <text x={520} y={460 + i * 130} fill="#9A6B1F" fontFamily={fonts.display} fontWeight={900} fontSize={54}>
                {['I', 'II', 'III'][i]}
              </text>
              <text x={640} y={460 + i * 130} fill={C.ink} fontFamily={fonts.will} fontWeight={600} fontSize={60}>
                {i === 2 && props.highlight ? (
                  <>
                    It must be <tspan fill={C.stamp} fontWeight={700}>home</tspan> before sunrise.
                  </>
                ) : (
                  r
                )}
              </text>
            </g>
          );
        })}
        {props.highlight && (
          <g opacity={ramp(0.8, 0.5)}>
            <rect x={520} y={760} width={880} height={80} rx={12} fill={C.ink} />
            <text x={960} y={812} textAnchor="middle" fill={C.gold} fontFamily={fonts.mono} fontSize={30}>
              home (Vey): “the place where you sleep”
            </text>
          </g>
        )}
      </g>
    );
  } else if (mode === 'contest') {
    const stamp = interpolate(t, [1.8, 2.05], [2.4, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))});
    content = (
      <g>
        <text x={960} y={310} textAnchor="middle" fill={C.goldDeep} fontFamily={fonts.mono} fontSize={30} letterSpacing={12}>
          GENERAL PROVISIONS · § 4
        </text>
        <text x={960} y={460} textAnchor="middle" fill={C.ink} fontFamily={fonts.will} fontWeight={600} fontSize={58}>
          Any person may contest an heir.
        </text>
        <text x={960} y={560} textAnchor="middle" fill={C.ink} fontFamily={fonts.will} fontWeight={600} fontSize={58}>
          Should an heir break a rule,
        </text>
        <text x={960} y={650} textAnchor="middle" fill={C.ink} fontFamily={fonts.will} fontWeight={600} fontSize={58}>
          the inheritance passes to the contester.
        </text>
        <g transform={`translate(1290,790) rotate(-10) scale(${stamp})`} opacity={ramp(1.8, 0.1)}>
          <rect x={-250} y={-50} width={500} height={100} rx={10} fill="none" stroke={C.stamp} strokeWidth={7} />
          <text x={0} y={-2} textAnchor="middle" fill={C.stamp} fontFamily={fonts.display} fontWeight={900} fontSize={40}>
            CONTEST FILED
          </text>
          <text x={0} y={34} textAnchor="middle" fill={C.stamp} fontFamily={fonts.mono} fontSize={26}>
            CLAIMANT: D. KADE
          </text>
        </g>
      </g>
    );
  }

  return (
    <Stage bg={C.ink}>
      <Stars frame={frame} count={160} opacity={0.5} />
      {slate}
      <g opacity={slateIn}>{content}</g>
      <Executor x={1680} y={250} scale={0.75} frame={frame} speaking={exSpeaking} opacity={ramp(0, 0.8)} />
    </Stage>
  );
};

/** The Ledger: case-file roll of the twelve heirs + sealed Item Thirteen. */
export const Ledger: React.FC = () => {
  const {frame, ramp, props, t} = useShot();
  const found = (props.found as number) ?? 1;
  const stamp = interpolate(t, [0.9, 1.15], [2.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))});
  return (
    <Stage bg={C.ink}>
      <Stars frame={frame} count={120} opacity={0.4} />
      <g opacity={ramp(0, 0.5)}>
        <rect x={260} y={90} width={1400} height={900} rx={16} fill="#EFE6D3" stroke={C.ink} strokeWidth={6} />
        <rect x={260} y={90} width={1400} height={110} rx={16} fill="#D9CBB0" stroke={C.ink} strokeWidth={6} />
        <text x={320} y={165} fill={C.ink} fontFamily={fonts.display} fontWeight={900} fontSize={52}>
          THE LEDGER
        </text>
        <text x={1600} y={165} textAnchor="end" fill={C.ink} fontFamily={fonts.mono} fontSize={30}>
          ESTATE OF THE VEY · FILE 01
        </text>
        {Array.from({length: 12}, (_, i) => {
          const col = i < 6 ? 0 : 1;
          const row = i % 6;
          const x = 320 + col * 680;
          const y = 280 + row * 92;
          const isFound = i < found;
          return (
            <g key={i}>
              <text x={x} y={y} fill={C.ink} fontFamily={fonts.mono} fontWeight={600} fontSize={32}>
                {String(i + 1).padStart(2, '0')}
              </text>
              {isFound ? (
                <>
                  <text x={x + 70} y={y} fill={C.ink} fontFamily={fonts.ui} fontWeight={700} fontSize={34}>
                    Jonah Okafor · Lagos
                  </text>
                  <text x={x + 70} y={y + 34} fill="#7A6A50" fontFamily={fonts.mono} fontSize={22}>
                    ITEM: THE SHIP
                  </text>
                </>
              ) : (
                <rect x={x + 70} y={y - 28} width={420 - ((i * 37) % 120)} height={34} fill={C.ink} opacity={0.85} />
              )}
            </g>
          );
        })}
        <g transform="translate(960,880)">
          <text x={0} y={0} textAnchor="middle" fill={C.ink} fontFamily={fonts.display} fontWeight={900} fontSize={38}>
            ITEM THIRTEEN
          </text>
          <circle cx={330} cy={-22} r={44} fill={C.stamp} stroke={C.ink} strokeWidth={4} />
          <text x={330} y={-10} textAnchor="middle" fill="#FFD9D2" fontFamily={fonts.display} fontWeight={900} fontSize={30}>
            13
          </text>
          <text x={0} y={46} textAnchor="middle" fill={C.stamp} fontFamily={fonts.mono} fontWeight={600} fontSize={28} letterSpacing={6}>
            SEALED UNTIL ALL TWELVE ARE TOGETHER
          </text>
        </g>
      </g>
      <g transform={`translate(870,298) rotate(-10) scale(${stamp * 0.8})`} opacity={ramp(0.9, 0.1)}>
        <rect x={-120} y={-44} width={240} height={88} rx={8} fill="none" stroke={C.stamp} strokeWidth={7} />
        <text x={0} y={18} textAnchor="middle" fill={C.stamp} fontFamily={fonts.display} fontWeight={900} fontSize={48}>
          FOUND
        </text>
      </g>
    </Stage>
  );
};

/** Final card: the Executor's sign-off + the comment prompt. */
export const EndCard: React.FC = () => {
  const {frame, ramp, speaking, lineAt, props} = useShot();
  return (
    <Stage bg={C.night}>
      <Stars frame={frame} count={300} drift={[0.015, 0]} />
      <Executor x={960} y={380} scale={1.1} frame={frame} speaking={speaking('EXECUTOR')} />
      <text x={960} y={640} textAnchor="middle" fill={C.pearl} fontFamily={fonts.will} fontStyle="italic" fontWeight={600} fontSize={72} opacity={ramp(lineAt(1), 0.6)}>
        I’m still reading.
      </text>
      <g opacity={ramp(lineAt(1) + 2.2, 0.8)}>
        <rect x={460} y={730} width={1000} height={110} rx={18} fill={C.ink} stroke={C.gold} strokeWidth={3} />
        <text x={960} y={798} textAnchor="middle" fill={C.gold} fontFamily={fonts.ui} fontWeight={700} fontSize={38}>
          {(props.prompt as string) ?? ''}
        </text>
        <text x={960} y={920} textAnchor="middle" fill={C.pearl} opacity={0.7} fontFamily={fonts.mono} fontSize={28} letterSpacing={6}>
          {(props.next as string) ?? ''}
        </text>
      </g>
    </Stage>
  );
};
