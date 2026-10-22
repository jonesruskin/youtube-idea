import React from 'react';
import {Composition, Still} from 'remotion';
import {CharacterSheet} from './CharacterSheet';
import {calculateEpisodeMetadata, Episode, type EpisodeProps} from './engine/Episode';
import {EPISODES} from './episodes';
import {Thumbnail} from './Thumbnail';
import {Bd01Thumb} from './thumbs/Bd01Thumb';

/** Per-episode thumbnails; episodes without one use the channel's default art. */
const THUMBS: Record<string, React.FC<any>> = {bd01: Bd01Thumb};

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
        <Still id={`${ep.id}-thumbnail`} component={(THUMBS[ep.id] ?? Thumbnail) as any} width={1280} height={720} defaultProps={{text: ep.thumbnailText, heir: ''}} />
      </React.Fragment>
    ))}
    <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={60} fps={30} width={1920} height={1080} />
  </>
);
