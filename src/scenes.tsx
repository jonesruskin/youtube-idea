import type React from 'react';
import {Card, EndCard, Ledger, TitleCard, WillDoc} from './ui/cards';
import {Bus} from './env/ep01/bus';
import {GlobeThreads, Holo} from './env/ep01/holo';
import {House, KadeCall, Market, OkadaRide, RadioNight, Teaser} from './env/ep01/places';
import {Roof} from './env/ep01/roof';
import {Street} from './env/ep01/street';
import {SUN_SCENES} from './env/sun';
import {SEA_SCENES} from './env/sea';
import {VOL_SCENES} from './env/vol';
import {MOON_SCENES} from './env/moon';

/** Scene keys used by episode scripts → components. New episodes add environments here. */
export const SCENES: Record<string, React.FC> = {
  // shared cards
  card: Card,
  titleCard: TitleCard,
  willDoc: WillDoc,
  ledger: Ledger,
  endCard: EndCard,
  // Episode 1 · Zero-G
  bus: Bus,
  street: Street,
  roof: Roof,
  holo: Holo,
  globeThreads: GlobeThreads,
  house: House,
  market: Market,
  okada: OkadaRide,
  kadeCall: KadeCall,
  radioWindow: RadioNight,
  teaser: Teaser,
  // File 001 · The Sun Went Out (v2). Keys don't collide with Ep1's.
  ...SUN_SCENES,
  // File 002 · The Sun Went Out While My Mum Was at Sea
  ...SEA_SCENES,
  // File 002 · A Volcano Started Growing Under Our City
  ...VOL_SCENES,
  ...MOON_SCENES,
};
