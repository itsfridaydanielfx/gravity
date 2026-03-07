(function () {
  const form = document.getElementById('generatorForm');
  if (!form) return;

  const preview = document.getElementById('livePreview');
  const warningsEl = document.getElementById('warnings');
  const output = document.getElementById('generatedOutput');
  const copyBtn = document.getElementById('copyOutput');

  function getFormData() {
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const numericFields = [
      'bodyweight_kg', 'pullup_added_weight_kg', 'dip_added_weight_kg', 'muscleup_added_weight_kg',
      'bench_kg', 'squat_kg', 'deadlift_kg', 'ohp_kg', 'biceps_kg'
    ];
    numericFields.forEach((key) => data[key] = Number(data[key] || 0));
    return data;
  }

  function makeObjectText(data, calculated) {
    const id = (data.name || 'athlete').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'athlete';
    return `{
  id: "${id}",
  name: "${data.name || ''}",
  photo: "${data.photo || 'assets/athletes/placeholder-1.svg'}",
  bodyweight_kg: ${data.bodyweight_kg},
  pullup_added_weight_kg: ${data.pullup_added_weight_kg},
  dip_added_weight_kg: ${data.dip_added_weight_kg},
  muscleup_added_weight_kg: ${data.muscleup_added_weight_kg},
  bench_kg: ${data.bench_kg},
  squat_kg: ${data.squat_kg},
  deadlift_kg: ${data.deadlift_kg},
  ohp_kg: ${data.ohp_kg},
  biceps_kg: ${data.biceps_kg},
  created_at: "${new Date().toISOString()}",
  updated_at: "${new Date().toISOString()}"
},

// Preview points
// Total: ${calculated.total_points}
// Street: ${calculated.street_score}
// Barbell: ${calculated.barbell_score}
// Arms: ${calculated.arms_score}`;
  }

  function render() {
    const data = getFormData();
    const calculated = window.GravityScoring.calculateAthlete(data);
    const warnings = window.GravityScoring.getWarnings(data);

    preview.innerHTML = `
      <div class="preview-stat"><span>Total</span><strong>${calculated.total_points}</strong></div>
      <div class="preview-stat"><span>Street</span><strong>${calculated.street_score}</strong></div>
      <div class="preview-stat"><span>Barbell</span><strong>${calculated.barbell_score}</strong></div>
      <div class="preview-stat"><span>Arms</span><strong>${calculated.arms_score}</strong></div>
      <div class="preview-stat"><span>Scaled BW</span><strong>${calculated.scaled_bodyweight}</strong></div>
      <div class="preview-stat"><span>Overall eligible</span><strong>${calculated.completeOverall ? 'Yes' : 'No'}</strong></div>
    `;

    warningsEl.innerHTML = warnings.length
      ? warnings.map((w) => `<div class="warning-item">⚠️ ${w}</div>`).join('')
      : '<div class="muted">No warning flags.</div>';

    output.value = makeObjectText(data, calculated);
  }

  form.addEventListener('input', render);
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      copyBtn.textContent = 'Copied';
      setTimeout(() => { copyBtn.textContent = 'Copy block'; }, 1200);
    } catch {
      copyBtn.textContent = 'Copy failed';
      setTimeout(() => { copyBtn.textContent = 'Copy block'; }, 1200);
    }
  });

  render();
})();
