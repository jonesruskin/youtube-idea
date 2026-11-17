// Channel-level branding as plain data, so Node scripts (metadata, screenplay) and the renderer share it.
// One engine, several channels: an episode picks its channel with `channel` (default 'blink').

export type ChannelId = 'blink' | 'borrowed';

export type Channel = {
  name: string;
  /** Appended to the comment prompt in the description. */
  commentTail: string;
  /** Header for the sourced facts block in the description. */
  factsHeader: string;
  /** Closing lines of the description (tagline, disclaimer, hashtags). */
  footer: string;
};

export const CHANNELS: Record<ChannelId, Channel> = {
  blink: {
    name: 'THE BLINK FILES',
    commentTail: 'Tell us below — the Executor is still reading.',
    factsHeader: 'THE REAL SCIENCE IN THIS EPISODE',
    footer: `THE BLINK FILES — twelve gifts from a dead star, twelve ordinary people. New heir every week.

This is a work of fiction. Betelgeuse is real — and has not gone dark (yet).
#whatif #space #superpower #animation #theblinkfiles`,
  },
  borrowed: {
    name: 'BORROWED DAY',
    commentTail: 'Tell us below, and tell us whose day you want to borrow next.',
    factsHeader: 'THE REAL NUMBERS IN THIS EPISODE',
    footer: `BORROWED DAY — every episode, you borrow someone's life for 24 hours. At midnight, you give it back.

The characters in this episode are fictional and do not depict any real person. The facts above are real.
#whatif #oneday #richest #billionaire #animation #borrowedday`,
  },
};
