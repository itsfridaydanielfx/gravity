(function () {
  const categorySelect = document.getElementById('categorySelect');
  const rankingList = document.getElementById('rankingList');
  const emptyState = document.getElementById('emptyState');
  const updatedVersion = document.getElementById('versionName');
  const categoryBadge = document.getElementById('categoryBadge');
  const filterToggle = document.getElementById('filterToggle');
  const nextCategoryBtn = document.getElementById('nextCategoryBtn');
  const filterWrap = filterToggle ? filterToggle.closest('.filter-trigger-wrap') : null;

  function subtitleForCategory(athlete, category) {
    if (category === 'overall') return `${athlete.bodyweight_kg} kg • overall`;
    if (category === 'street') return `${athlete.bodyweight_kg} kg • street`;
    if (category === 'barbell') return `${athlete.bodyweight_kg} kg • barbell`;
    if (category === 'arms') return `${athlete.bodyweight_kg} kg • arms`;
    const current = window.SCoringConfig.categories.find((cat) => cat.key === category);
    return `${athlete.bodyweight_kg} kg • ${current ? current.label : category}`;
  }

  function scoreMarkup(value) {
    return `<span class="score-number">${Number(value).toFixed(2)}</span><span class="score-unit">pkt</span>`;
  }

  function exerciseAmountLabel(athlete, key) {
    const map = {
      pullup: athlete.pullup_added_weight_kg,
      dip: athlete.dip_added_weight_kg,
      muscleup: athlete.muscleup_added_weight_kg,
      bench: athlete.bench_kg,
      squat: athlete.squat_kg,
      deadlift: athlete.deadlift_kg,
      ohp: athlete.ohp_kg,
      biceps: athlete.biceps_kg,
    };
    return `${Number(map[key] || 0).toFixed(1).replace(/\.0$/, '')} kg`;
  }

  function detailItem(label, amount, points) {
    return `
      <div class="detail-item">
        <span class="detail-label">${label}</span>
        <strong class="detail-value">${amount}</strong>
        <span class="detail-points">${Number(points).toFixed(1)} pkt</span>
      </div>
    `;
  }

  function breakdownHtml(a) {
    return `
      <div class="detail-grid">
        <div class="detail-item detail-item--meta"><span class="detail-label">Waga</span><strong class="detail-value">${a.bodyweight_kg} kg</strong><span class="detail-points">bodyweight</span></div>
        ${detailItem('Pull-up', exerciseAmountLabel(a, 'pullup'), a.points.pullup)}
        ${detailItem('Dip', exerciseAmountLabel(a, 'dip'), a.points.dip)}
        ${detailItem('Muscle-up', exerciseAmountLabel(a, 'muscleup'), a.points.muscleup)}
        ${detailItem('Bench', exerciseAmountLabel(a, 'bench'), a.points.bench)}
        ${detailItem('Squat', exerciseAmountLabel(a, 'squat'), a.points.squat)}
        ${detailItem('Deadlift', exerciseAmountLabel(a, 'deadlift'), a.points.deadlift)}
        ${detailItem('OHP', exerciseAmountLabel(a, 'ohp'), a.points.ohp)}
        ${detailItem('Biceps', exerciseAmountLabel(a, 'biceps'), a.points.biceps)}
      </div>
    `;
  }

  function createRow(athlete, category) {
    const row = document.createElement('article');
    row.className = 'athlete-row';
    if (athlete.rank_position <= 3) row.classList.add(`top-${athlete.rank_position}`);

    row.innerHTML = `
      <button class="athlete-button" type="button" aria-expanded="false">
        <div class="rank-badge">#${athlete.rank_position}</div>
        <img class="avatar" src="${athlete.photo}" alt="${athlete.name}">
        <div class="athlete-main">
          <div>
            <div class="athlete-name-row">
              <div class="athlete-name">${athlete.name}</div>
              ${athlete.rank_position <= 3 ? `<span class="place-tag place-tag--${athlete.rank_position}">#${athlete.rank_position}</span>` : ''}
            </div>
            <div class="athlete-subtitle">${subtitleForCategory(athlete, category)}</div>
          </div>
        </div>
        <div class="athlete-score">
          <div class="score-value">${scoreMarkup(athlete.ranking_value)}</div>
          <div class="score-label">${athlete.rank_position <= 3 ? 'Elite' : 'Noob'}</div>
        </div>
      </button>
      <div class="athlete-details hidden">
        ${breakdownHtml(athlete)}
      </div>
    `;

    const button = row.querySelector('.athlete-button');
    const details = row.querySelector('.athlete-details');
    button.addEventListener('click', () => {
      const isHidden = details.classList.toggle('hidden');
      button.setAttribute('aria-expanded', String(!isHidden));
    });
    return row;
  }

  function renderRanking() {
    const category = categorySelect.value;
    const currentLabel = window.SCoringConfig.categories.find((cat) => cat.key === category)?.label || category;
    categoryBadge.textContent = currentLabel;
    const ranked = window.GravityScoring.rankAthletes(window.ATHLETES, category);
    rankingList.innerHTML = '';

    if (!ranked.length) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    ranked.forEach((athlete) => rankingList.appendChild(createRow(athlete, category)));
  }

  function initCategories() {
    window.SCoringConfig.categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat.key;
      option.textContent = cat.label;
      categorySelect.appendChild(option);
    });
  }

  function cycleCategory() {
    const categories = window.SCoringConfig.categories;
    const currentIndex = categories.findIndex((cat) => cat.key === categorySelect.value);
    const nextIndex = (currentIndex + 1) % categories.length;
    categorySelect.value = categories[nextIndex].key;
    renderRanking();
  }

  function initFilters() {
    if (!filterToggle || !filterWrap) return;

    filterToggle.addEventListener('click', () => {
      filterWrap.classList.toggle('open');
      if (filterWrap.classList.contains('open')) categorySelect.focus();
    });

    document.addEventListener('click', (event) => {
      if (!filterWrap.contains(event.target)) filterWrap.classList.remove('open');
    });

    categorySelect.addEventListener('change', () => {
      filterWrap.classList.remove('open');
      renderRanking();
    });
  }

  function init() {
    initCategories();
    categorySelect.value = 'overall';
    updatedVersion.textContent = window.SCoringConfig.version_name;
    renderRanking();
    initFilters();
    nextCategoryBtn?.addEventListener('click', cycleCategory);
  }

  init();
})();
