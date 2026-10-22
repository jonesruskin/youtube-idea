import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

/** Film finish over every frame: soft vignette + animated grain, so flat vector art feels shot, not drawn. */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <defs>
          <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.42} />
          </radialGradient>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 17} result="n" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={1920} height={1080} fill="url(#vig)" />
        <rect width={1920} height={1080} filter="url(#grain)" opacity={0.06} style={{mixBlendMode: 'overlay'}} />
      </svg>
    </AbsoluteFill>
  );
};
