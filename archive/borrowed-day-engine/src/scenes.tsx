import type React from 'react';
import {Card, EndCard, Ledger, TitleCard, WillDoc} from './ui/cards';
import {Bus} from './env/ep01/bus';
import {GlobeThreads, Holo} from './env/ep01/holo';
import {House, KadeCall, Market, OkadaRide, RadioNight, Teaser} from './env/ep01/places';
import {Roof} from './env/ep01/roof';
import {Street} from './env/ep01/street';
import {Avenue} from './env/bd01/avenue';
import {BdEnd, BdTitle} from './env/bd01/bookends';
import {CallSet} from './env/bd01/call';
import {JetSet} from './env/bd01/jet';
import {LagosSet} from './env/bd01/lagos';
import {MidnightSet} from './env/bd01/midnight';
import {Penthouse} from './env/bd01/penthouse';
import {Stadium} from './env/bd01/stadium';

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
  // Borrowed Day · Episode 1 · The Richest Person on Earth
  bdTitle: BdTitle,
  bdEnd: BdEnd,
  stadium: Stadium,
  penthouse: Penthouse,
  jet: JetSet,
  avenue: Avenue,
  call: CallSet,
  midnight: MidnightSet,
  lagos: LagosSet,
};
