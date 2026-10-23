import type {Episode} from './engine/schema';
import {ep01} from '../episodes/ep01-zero-g/script';
import {sun01} from '../episodes/sun01-the-sun-went-out/script';

export const EPISODES: Record<string, Episode> = {ep01, sun01};
