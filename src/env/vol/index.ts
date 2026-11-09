import type React from 'react';
import './sets';
import {VolScene} from './scene';

/** File 002 (vol02) scene keys. */
export const VOL_SCENES: Record<string, React.FC> = {
  vol: VolScene,
};
