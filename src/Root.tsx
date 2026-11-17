import React from 'react';
import {Composition, Still} from 'remotion';
import {CharacterSheet} from './CharacterSheet';
import {calculateEpisodeMetadata, Episode, type EpisodeProps} from './engine/Episode';
import {EPISODES} from './episodes';
import {Thumbnail} from './Thumbnail';
import {EarthLab, EyeLab, ScaleLab, ToonLab} from './ToonLab';
import {SunThumbnail, SunThumbnailB, SunThumbnailC} from './env/sun/thumbnail';
import {SeaThumbnail, SeaThumbnailB, SeaThumbnailC} from './env/sea/thumbnail';
import {VolThumbnail, VolThumbnailB, VolThumbnailC} from './env/vol/thumbnail';
import {MoonThumbnail, MoonThumbnailB, MoonThumbnailC} from './env/moon/thumbnail';

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
        <Still id={`${ep.id}-thumbnail`} component={(ep.id === 'sun01' ? SunThumbnail : ep.id === 'sun02' ? SeaThumbnail : ep.id === 'vol02' ? VolThumbnail : ep.id === 'moon02' ? MoonThumbnail : Thumbnail) as any} width={1280} height={720} defaultProps={{text: ep.thumbnailText, heir: ''}} />
      </React.Fragment>
    ))}
    <Still id="sun01-thumbnail-b" component={SunThumbnailB} width={1280} height={720} />
    <Still id="sun01-thumbnail-c" component={SunThumbnailC} width={1280} height={720} />
    <Still id="sun02-thumbnail-b" component={SeaThumbnailB} width={1280} height={720} />
    <Still id="sun02-thumbnail-c" component={SeaThumbnailC} width={1280} height={720} />
    <Still id="vol02-thumbnail-b" component={VolThumbnailB} width={1280} height={720} />
    <Still id="vol02-thumbnail-c" component={VolThumbnailC} width={1280} height={720} />
    <Still id="moon02-thumbnail-b" component={MoonThumbnailB} width={1280} height={720} />
    <Still id="moon02-thumbnail-c" component={MoonThumbnailC} width={1280} height={720} />
    <Composition id="ToonLab" component={ToonLab as any} durationInFrames={300} fps={30} width={1920} height={1080} defaultProps={{scene: 'lineup'}} />
    <Composition id="EyeLab" component={EyeLab as any} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{who: 'mira'}} />
    <Composition id="ScaleLab" component={ScaleLab as any} durationInFrames={30} fps={30} width={1920} height={1080} />
    <Composition id="EarthLab" component={EarthLab as any} durationInFrames={30} fps={30} width={1920} height={1080} defaultProps={{v: 0}} />
    <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={60} fps={30} width={1920} height={1080} />
  </>
);
