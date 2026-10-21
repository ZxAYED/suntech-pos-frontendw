export const motionTokens = {
  easeOut: [0.22, 1, 0.36, 1] as const,
  easeInOut: [0.76, 0, 0.24, 1] as const,

  duration: {
    micro: 0.18,
    fast: 0.32,
    standard: 0.55,
    reveal: 0.75,
    cinematic: 1.05,
  },

  spring: {
    stiffness: 260,
    damping: 30,
    mass: 0.8,
  },

  stagger: {
    fast: 0.055,
    standard: 0.09,
  },
} as const;
