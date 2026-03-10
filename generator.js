(function () {
  const form = document.getElementById('generatorForm');
  if (!form) return;

  const output = document.getElementById('generatedOutput');
  const copyBtn = document.getElementById('copyOutput');
  const PHOTO_BASE_PATH = 'assets/athletes/';

  function normalizePhotoName(photo) {
    return String(photo || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^assets\/athletes\//i, '')
      .replace(/^\/+/, '');
  }

  function getFormData() {
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const numericFields = [
      'bodyweight_kg',
      'pullup_added_weight_kg','pullup_bodyweight_kg',
      'dip_added_weight_kg','dip_bodyweight_kg',
      'muscleup_added_weight_kg','muscleup_bodyweight_kg',
      'bench_kg','bench_bodyweight_kg',
      'squat_kg','squat_bodyweight_kg',
      'deadlift_kg','deadlift_bodyweight_kg',
      'ohp_kg','ohp_bodyweight_kg',
      'biceps_kg','biceps_bodyweight_kg'
    ];
    numericFields.forEach((key) => data[key] = Number(data[key] || 0));
    return data;
  }

  function makeObjectText(data) {
    const id = (data.name || 'athlete').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'athlete';
    const photoName = normalizePhotoName(data.photo);
    const photoPath = photoName ? `${PHOTO_BASE_PATH}${photoName}` : `${PHOTO_BASE_PATH}placeholder-1.svg`;

    return `{
  id: "${id}",
  name: "${data.name || ''}",
  photo: "${photoPath}",
  bodyweight_kg: ${data.bodyweight_kg},
  pullup_added_weight_kg: ${data.pullup_added_weight_kg},
  pullup_bodyweight_kg: ${data.pullup_bodyweight_kg},
  dip_added_weight_kg: ${data.dip_added_weight_kg},
  dip_bodyweight_kg: ${data.dip_bodyweight_kg},
  muscleup_added_weight_kg: ${data.muscleup_added_weight_kg},
  muscleup_bodyweight_kg: ${data.muscleup_bodyweight_kg},
  bench_kg: ${data.bench_kg},
  bench_bodyweight_kg: ${data.bench_bodyweight_kg},
  squat_kg: ${data.squat_kg},
  squat_bodyweight_kg: ${data.squat_bodyweight_kg},
  deadlift_kg: ${data.deadlift_kg},
  deadlift_bodyweight_kg: ${data.deadlift_bodyweight_kg},
  ohp_kg: ${data.ohp_kg},
  ohp_bodyweight_kg: ${data.ohp_bodyweight_kg},
  biceps_kg: ${data.biceps_kg},
  biceps_bodyweight_kg: ${data.biceps_bodyweight_kg},
  created_at: "${new Date().toISOString()}",
  updated_at: "${new Date().toISOString()}"
},`;
  }

  function render() {
    output.value = makeObjectText(getFormData());
  }

  form.addEventListener('input', render);
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      copyBtn.textContent = 'Skopiowano';
      setTimeout(() => { copyBtn.textContent = 'Skopiuj blok'; }, 1200);
    } catch {
      copyBtn.textContent = 'Błąd kopiowania';
      setTimeout(() => { copyBtn.textContent = 'Skopiuj blok'; }, 1200);
    }
  });

  render();
})();
