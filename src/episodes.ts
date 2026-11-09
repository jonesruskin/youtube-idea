import type {Episode} from './engine/schema';
import {ep01} from '../episodes/ep01-zero-g/script';
import {sun01} from '../episodes/sun01-the-sun-went-out/script';
import {vol02} from '../episodes/vol02-volcano-under-our-city/script';

export const EPISODES: Record<string, Episode> = {ep01, sun01, vol02};
