import type React from 'react';
import {Card, EndCard, Ledger, TitleCard, WillDoc} from './ui/cards';
import {Bus} from './env/ep01/bus';
import {GlobeThreads, Holo} from './env/ep01/holo';
import {House, KadeCall, Market, OkadaRide, RadioNight, Teaser} from './env/ep01/places';
import {Roof} from './env/ep01/roof';
import {Street} from './env/ep01/street';
import {SUN01_SCENES} from './env/sun01';

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
  // File 001 · The Sun Went Out (scene keys don't collide with Ep1's)
  ...SUN01_SCENES,
};
