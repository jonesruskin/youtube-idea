import type React from 'react';
import {Card, EndCard, Ledger, TitleCard, WillDoc} from './ui/cards';
import {Alley, CityFlight, GrandmaHome, JonahRoom, LagosStall, Launch, News, RadioWindow} from './env/lagos';
import {Atmosphere, Aurora, Broadcast, CityNight, Desert, Frenzy, GlobeScene, MoonApproach, MoonScene, Sky, WorldMontage} from './env/space';
import {Beach, Cockpit, KadeIntro, KadeOffice, Storm} from './env/drama';

/** Scene keys used by episode scripts → components. New episodes add environments here. */
export const SCENES: Record<string, React.FC> = {
  card: Card,
  titleCard: TitleCard,
  willDoc: WillDoc,
  ledger: Ledger,
  endCard: EndCard,
  lagosStall: LagosStall,
  jonahRoom: JonahRoom,
  alley: Alley,
  grandmaHome: GrandmaHome,
  radioWindow: RadioWindow,
  launch: Launch,
  cityFlight: CityFlight,
  news: News,
  sky: Sky,
  worldMontage: WorldMontage,
  broadcast: Broadcast,
  frenzy: Frenzy,
  atmosphere: Atmosphere,
  globe: GlobeScene,
  desert: Desert,
  cityNight: CityNight,
  aurora: Aurora,
  moonApproach: MoonApproach,
  moon: MoonScene,
  cockpit: Cockpit,
  storm: Storm,
  beach: Beach,
  kadeIntro: KadeIntro,
  kadeOffice: KadeOffice,
};
