import type React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../engine/shot-context';
import {Stage} from './stage';
import {GlobeScene, Space} from './space';
import {CityScene, EndScene, SkyScene, ThermalScene, TitleScene} from './views';
import {DiagramScene} from './diagram';
import {CloseupScene} from './inserts';
import './sets/kitchen';
import './sets/outdoor';
import './sets/roof';
import './sets/home';
import './sets/market';
import './sets/metro';

/** Development stand-in for scenes not built yet: shows the stage direction so the cut can be timed. */
const Pending: React.FC = () => {
  const {shot} = useShot();
  return (
    <AbsoluteFill style={{background: '#111', color: '#888', fontSize: 36, padding: 120, fontFamily: 'sans-serif'}}>
      [{shot.scene} {String((shot.props as any)?.v ?? '')}] {shot.action}
    </AbsoluteFill>
  );
};

/** File 001 (v2) scene keys used by episodes/sun01-the-sun-went-out/script.ts. */
export const SUN_SCENES: Record<string, React.FC> = {
  stage: Stage,
  space: Space,
  globe: GlobeScene,
  city: CityScene,
  sky: SkyScene,
  diagram: DiagramScene,
  thermal: ThermalScene,
  closeup: CloseupScene,
  title: TitleScene,
  end: EndScene,
};
