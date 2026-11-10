import type React from 'react';
import './sets';
import './interiors';
import {MoonScene} from './scene';

/** File 002 (moon02) scene keys. */
export const MOON_SCENES: Record<string, React.FC> = {
  moon: MoonScene,
};
