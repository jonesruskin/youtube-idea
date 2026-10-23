import type React from 'react';
import {City} from './city';
import {Apartment, Crowd, RadioScene, WindowScene} from './home';
import {Kitchen} from './kitchen';
import {EndSun, Metro} from './metro';
import {Blink, Ground, Sea, SnowScene, Surface, Vents} from './outside';
import {Space} from './space';
import {Title} from './title';
import {WatchScene} from './watch';

/** File 001 · The Sun Went Out — scene keys used by episodes/sun01-the-sun-went-out/script.ts. */
export const SUN01_SCENES: Record<string, React.FC> = {
  watch: WatchScene,
  title: Title,
  kitchen: Kitchen,
  city: City,
  space: Space,
  crowd: Crowd,
  apartment: Apartment,
  window: WindowScene,
  radio: RadioScene,
  snow: SnowScene,
  ground: Ground,
  metro: Metro,
  sea: Sea,
  vents: Vents,
  surface: Surface,
  blink: Blink,
  endSun: EndSun,
};
