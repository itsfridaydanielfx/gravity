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

  function round(value, precision = CFG().roundingPrecision) {
    const factor = Math.pow(10, precision);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function scaledBodyweight(bodyweight) {
    return Math.pow(bodyweight, CFG().allometricExponent);
  }

  function getRawScore(athlete, exerciseKey) {
    const bwScaled = scaledBodyweight(athlete.bodyweight_kg);
    const field = exerciseMap[exerciseKey];
    const value = Number(athlete[field] || 0);
    if (!bwScaled || !value) return 0;

    if (bodyweightLifts.includes(exerciseKey)) {
      return (athlete.bodyweight_kg + value) / bwScaled;
    }

    return value / bwScaled;
  }

  function getExercisePoints(athlete, exerciseKey) {
    const raw = getRawScore(athlete, exerciseKey);
    const points = raw * CFG().readabilityScale * CFG().multipliers[exerciseKey];
    return round(points);
  }

  function hasCompleteOverall(athlete) {
    return Object.values(exerciseMap).every((field) => Number(athlete[field]) > 0) && Number(athlete.bodyweight_kg) > 0;
  }

  function calculateAthlete(athlete) {
    const scaled = scaledBodyweight(athlete.bodyweight_kg);
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

    const street = round(points.pullup + points.dip + points.muscleup);
    const barbell = round(points.bench + points.squat + points.deadlift + points.ohp);
    const arms = round(points.biceps);
    const overall = round(street + barbell + arms);

    return {
      ...athlete,
      scaled_bodyweight: round(scaled, 3),
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
      case 'overall': return calculated.completeOverall ? calculated.total_points : -1;
      case 'street': return calculated.street_score;
      case 'barbell': return calculated.barbell_score;
      case 'arms': return calculated.arms_score;
      default: return calculated.points[category] || 0;
    }
  }

  function rankAthletes(athletes, category = 'overall') {
    const calculated = athletes.map(calculateAthlete);
    const filtered = category === 'overall'
      ? calculated.filter((a) => a.completeOverall)
      : calculated;

    const sorted = filtered.sort((a, b) => {
      const diff = getCategoryValue(b, category) - getCategoryValue(a, category);
      if (diff !== 0) return diff;
      return a.bodyweight_kg - b.bodyweight_kg;
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
    round,
    scaledBodyweight,
    getRawScore,
    getExercisePoints,
    hasCompleteOverall,
    calculateAthlete,
    getCategoryValue,
    rankAthletes,
    getWarnings,
  };
})();
