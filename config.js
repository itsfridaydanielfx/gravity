window.SCoringConfig = {
  versionName: 'v1',
  allometricExponent: 0.67,
  readabilityScale: 10,
  roundingPrecision: 1,
  multipliers: {
    pullup: 1.6,
    dip: 1.2,
    muscleup: 2.0,
    bench: 1.7,
    squat: 1.1,
    deadlift: 0.9,
    ohp: 2.2,
    biceps: 2.8,
  },
  categories: [
    { key: 'overall', label: 'Overall' },
    { key: 'street', label: 'Street' },
    { key: 'barbell', label: 'Barbell' },
    { key: 'arms', label: 'Arms' },
    { key: 'pullup', label: 'Pull-up' },
    { key: 'dip', label: 'Dip' },
    { key: 'muscleup', label: 'Muscle-up' },
    { key: 'bench', label: 'Bench' },
    { key: 'squat', label: 'Squat' },
    { key: 'deadlift', label: 'Deadlift' },
    { key: 'ohp', label: 'OHP' },
    { key: 'biceps', label: 'Biceps' }
  ],
  warnings: {
    bodyweightMin: 30,
    bodyweightMax: 250,
    benchMax: 500,
    bicepsMax: 200,
    muscleupAddedMax: 150,
  }
};
