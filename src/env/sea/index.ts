import type React from 'react';
import './sets';
import {SeaScene} from './scene';

/** File 002 scene keys (sets register themselves with the shared stage). */
export const SEA_SCENES: Record<string, React.FC> = {
  sea: SeaScene,
};
