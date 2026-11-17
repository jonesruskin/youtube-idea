import type {Episode} from './engine/schema';
import {ep01} from '../episodes/ep01-zero-g/script';
import {bd01} from '../episodes/bd01-richest/script';

export const EPISODES: Record<string, Episode> = {ep01, bd01};
