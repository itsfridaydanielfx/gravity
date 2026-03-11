(function () {
  const CFG = () => window.SCoringConfig;

  const bodyweightLifts = ['pullup', 'dip', 'muscleup'];
  const exerciseMap = {
    pullup: 'pullup_added_weight_kg',
    dip: 'dip_added_weight_kg',
    muscleup: 'muscleup_added_weight_kg',
    bench: 'bench_kg',
    squat: 'squat_kg',
    deadlift: 'deadlift_kg',
    ohp: 'ohp_kg',
    biceps: 'biceps_kg',
  };

  const exerciseBodyweightMap = {
    pullup: 'pullup_bodyweight_kg',
    dip: 'dip_bodyweight_kg',
    muscleup: 'muscleup_bodyweight_kg',
    bench: 'bench_bodyweight_kg',
    squat: 'squat_bodyweight_kg',
    deadlift: 'deadlift_bodyweight_kg',
    ohp: 'ohp_bodyweight_kg',
    biceps: 'biceps_bodyweight_kg',
  };

  function round(value, precision = CFG().roundingPrecision) {
    const factor = Math.pow(10, precision);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function scaledBodyweight(bodyweight) {
    return Math.pow(bodyweight, CFG().allometricExponent);
  }

  function getExerciseBodyweight(athlete, exerciseKey) {
    const specificField = exerciseBodyweightMap[exerciseKey];
    const specific = Number(athlete[specificField] || 0);
    const base = Number(athlete.bodyweight_kg || 0);
    return specific > 0 ? specific : base;
  }

  function getRawScore(athlete, exerciseKey) {
    const bodyweight = getExerciseBodyweight(athlete, exerciseKey);
    const bwScaled = scaledBodyweight(bodyweight);
    const field = exerciseMap[exerciseKey];
    const value = Number(athlete[field] || 0);
    if (!bwScaled || !value) return 0;

    if (bodyweightLifts.includes(exerciseKey)) {
      return (bodyweight + value) / bwScaled;
    }

    return value / bwScaled;
  }

  function getExercisePoints(athlete, exerciseKey) {
    const raw = getRawScore(athlete, exerciseKey);
    const points = raw * CFG().readabilityScale * CFG().multipliers[exerciseKey];
    return round(points);
  }

  const groupedExercises = {
    street: ['pullup', 'dip', 'muscleup'],
    barbell: ['bench', 'squat', 'deadlift', 'ohp'],
    arms: ['biceps'],
  };

  function hasExerciseEntry(athlete, exerciseKey) {
    const resultField = exerciseMap[exerciseKey];
    return Number(athlete[resultField] || 0) > 0 && getExerciseBodyweight(athlete, exerciseKey) > 0;
  }

  function hasAnyEntryInExercises(athlete, exerciseKeys) {
    return exerciseKeys.some((exerciseKey) => hasExerciseEntry(athlete, exerciseKey));
  }

  function hasCompleteOverall(athlete) {
    return Object.keys(exerciseMap).every((exerciseKey) => hasExerciseEntry(athlete, exerciseKey));
  }

  function isEligibleForCategory(athlete, category) {
    if (category === 'overall') {
      return hasAnyEntryInExercises(athlete, Object.keys(exerciseMap));
    }

    if (groupedExercises[category]) {
      return hasAnyEntryInExercises(athlete, groupedExercises[category]);
    }

    return hasExerciseEntry(athlete, category);
  }

  function calculateAthlete(athlete) {
    const points = {
      pullup: getExercisePoints(athlete, 'pullup'),
      dip: getExercisePoints(athlete, 'dip'),
      muscleup: getExercisePoints(athlete, 'muscleup'),
      bench: getExercisePoints(athlete, 'bench'),
      squat: getExercisePoints(athlete, 'squat'),
      deadlift: getExercisePoints(athlete, 'deadlift'),
      ohp: getExercisePoints(athlete, 'ohp'),
      biceps: getExercisePoints(athlete, 'biceps'),
    };

    const exerciseBodyweights = {
      pullup: getExerciseBodyweight(athlete, 'pullup'),
      dip: getExerciseBodyweight(athlete, 'dip'),
      muscleup: getExerciseBodyweight(athlete, 'muscleup'),
      bench: getExerciseBodyweight(athlete, 'bench'),
      squat: getExerciseBodyweight(athlete, 'squat'),
      deadlift: getExerciseBodyweight(athlete, 'deadlift'),
      ohp: getExerciseBodyweight(athlete, 'ohp'),
      biceps: getExerciseBodyweight(athlete, 'biceps'),
    };

    const street = round(points.pullup + points.dip + points.muscleup);
    const barbell = round(points.bench + points.squat + points.deadlift + points.ohp);
    const arms = round(points.biceps);
    const overall = round(street + barbell + arms);

    return {
      ...athlete,
      scaled_bodyweight: round(scaledBodyweight(Number(athlete.bodyweight_kg || 0)), 3),
      exercise_bodyweights: exerciseBodyweights,
      points,
      street_score: street,
      barbell_score: barbell,
      arms_score: arms,
      total_points: overall,
      completeOverall: hasCompleteOverall(athlete),
    };
  }

  function getCategoryValue(calculated, category) {
    switch (category) {
      case 'overall': return calculated.total_points;
      case 'street': return calculated.street_score;
      case 'barbell': return calculated.barbell_score;
      case 'arms': return calculated.arms_score;
      default: return calculated.points[category] || 0;
    }
  }

  function rankAthletes(athletes, category = 'overall') {
    const calculated = athletes.map(calculateAthlete);
    const filtered = calculated.filter((a) => isEligibleForCategory(a, category));

    const sorted = filtered.sort((a, b) => {
      const diff = getCategoryValue(b, category) - getCategoryValue(a, category);
      if (diff !== 0) return diff;
      return Number(a.bodyweight_kg || 0) - Number(b.bodyweight_kg || 0);
    });

    let lastScore = null;
    let lastRank = 0;
    return sorted.map((athlete, index) => {
      const score = getCategoryValue(athlete, category);
      const rank = score === lastScore ? lastRank : index + 1;
      lastScore = score;
      lastRank = rank;
      return { ...athlete, rank_position: rank, ranking_value: score };
    });
  }

  function getWarnings(form) {
    const warnings = [];
    const w = CFG().warnings;
    const bw = Number(form.bodyweight_kg || 0);
    if (bw > 0 && (bw < w.bodyweightMin || bw > w.bodyweightMax)) {
      warnings.push(`Bodyweight looks unusual: ${bw} kg.`);
    }
    if (Number(form.bench_kg || 0) > w.benchMax) warnings.push('Bench looks unusually high. Check for typo.');
    if (Number(form.biceps_kg || 0) > w.bicepsMax) warnings.push('Biceps looks unusually high. Check for typo.');
    if (Number(form.muscleup_added_weight_kg || 0) > w.muscleupAddedMax) warnings.push('Muscle-up added weight looks unusually high. Check for typo.');
    return warnings;
  }

  window.GravityScoring = {
    exerciseMap,
    exerciseBodyweightMap,
    round,
    scaledBodyweight,
    getExerciseBodyweight,
    getRawScore,
    getExercisePoints,
    hasCompleteOverall,
    hasExerciseEntry,
    hasAnyEntryInExercises,
    isEligibleForCategory,
    calculateAthlete,
    getCategoryValue,
    rankAthletes,
    getWarnings,
  };
})();
