import React from 'react';
import {Composition, Still} from 'remotion';
import {CharacterSheet} from './CharacterSheet';
import {calculateEpisodeMetadata, Episode, type EpisodeProps} from './engine/Episode';
import {EPISODES} from './episodes';
import {Thumbnail} from './Thumbnail';
import {EarthLab, ToonLab} from './ToonLab';
import {SunThumbnail} from './env/sun/thumbnail';

export const RemotionRoot: React.FC = () => (
  <>
    {Object.values(EPISODES).map((ep) => (
      <React.Fragment key={ep.id}>
        <Composition<any, EpisodeProps>
          id={ep.id}
          component={Episode}
          durationInFrames={300}
          fps={ep.fps}
          width={1920}
          height={1080}
          defaultProps={{episodeId: ep.id, voice: {}, hasScore: false}}
          calculateMetadata={calculateEpisodeMetadata}
        />
        <Still id={`${ep.id}-thumbnail`} component={(ep.id === 'sun01' ? SunThumbnail : Thumbnail) as any} width={1280} height={720} defaultProps={{text: ep.thumbnailText, heir: ''}} />
      </React.Fragment>
    ))}
    <Composition id="ToonLab" component={ToonLab as any} durationInFrames={300} fps={30} width={1920} height={1080} defaultProps={{scene: 'lineup'}} />
    <Composition id="EarthLab" component={EarthLab as any} durationInFrames={30} fps={30} width={1920} height={1080} defaultProps={{v: 0}} />
    <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={60} fps={30} width={1920} height={1080} />
  </>
);
