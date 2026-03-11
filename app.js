(function () {
  const categorySelect = document.getElementById('categorySelect');
  const rankingList = document.getElementById('rankingList');
  const emptyState = document.getElementById('emptyState');
  const updatedVersion = document.getElementById('versionName');
  const categoryBadge = document.getElementById('categoryBadge');
  const filterToggle = document.getElementById('filterToggle');
  const nextCategoryBtn = document.getElementById('nextCategoryBtn');
  const filterWrap = filterToggle ? filterToggle.closest('.filter-trigger-wrap') : null;

  const aggregateCategories = ['overall', 'street', 'barbell', 'arms'];

  function subtitleForCategory(athlete, category) {
    const current = window.SCoringConfig.categories.find((cat) => cat.key === category);
    const currentLabel = current ? current.label : category;

    if (aggregateCategories.includes(category)) {
      return `<div class="athlete-subtitle">${currentLabel}</div>`;
    }

    return `<div class="athlete-subtitle">waga: ${exerciseBodyweightLabel(athlete, category)} • ${currentLabel}</div>`;
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

  function exerciseBodyweightLabel(athlete, category) {
    const bw = athlete.exercise_bodyweights?.[category] || athlete.bodyweight_kg || 0;
    return `${Number(bw || 0).toFixed(1).replace(/\.0$/, '')} kg`;
  }

  function scoreMetaForCategory(athlete, category) {
    if (aggregateCategories.includes(category)) return null;
    return {
      bodyweight: exerciseBodyweightLabel(athlete, category),
      lifted: exerciseAmountLabel(athlete, category),
    };
  }

  function detailItem(athlete, label, key, amount, points) {
    const bw = athlete.exercise_bodyweights?.[key] || athlete.bodyweight_kg || 0;
    return `
      <div class="detail-item">
        <span class="detail-label">${label}</span>
        <strong class="detail-value">${amount}</strong>
        <span class="detail-points">${Number(bw).toFixed(1).replace(/\.0$/, '')} kg BW • ${Number(points).toFixed(1)} pkt</span>
      </div>
    `;
  }

  function breakdownHtml(a) {
    return `
      <div class="detail-grid">
        <div class="detail-item detail-item--meta"><span class="detail-label">Waga bazowa</span><strong class="detail-value">${a.bodyweight_kg} kg</strong></div>
        ${detailItem(a, 'Pull-up', 'pullup', exerciseAmountLabel(a, 'pullup'), a.points.pullup)}
        ${detailItem(a, 'Dip', 'dip', exerciseAmountLabel(a, 'dip'), a.points.dip)}
        ${detailItem(a, 'Muscle-up', 'muscleup', exerciseAmountLabel(a, 'muscleup'), a.points.muscleup)}
        ${detailItem(a, 'Bench', 'bench', exerciseAmountLabel(a, 'bench'), a.points.bench)}
        ${detailItem(a, 'Squat', 'squat', exerciseAmountLabel(a, 'squat'), a.points.squat)}
        ${detailItem(a, 'Deadlift', 'deadlift', exerciseAmountLabel(a, 'deadlift'), a.points.deadlift)}
        ${detailItem(a, 'OHP', 'ohp', exerciseAmountLabel(a, 'ohp'), a.points.ohp)}
        ${detailItem(a, 'Biceps', 'biceps', exerciseAmountLabel(a, 'biceps'), a.points.biceps)}
      </div>
    `;
  }

  function avatarMarkup(athlete) {
    const photo = String(athlete.photo || '').trim();
    if (photo && !/placeholder/i.test(photo)) {
      return `<img class="avatar" src="${photo}" alt="${athlete.name}">`;
    }
    const initial = (athlete.name || '?').trim().charAt(0).toUpperCase();
    return `<div class="avatar avatar-fallback">${initial}</div>`;
  }

  function createRow(athlete, category) {
    const row = document.createElement('article');
    row.className = 'athlete-row';
    if (athlete.rank_position <= 3) row.classList.add(`top-${athlete.rank_position}`);

    row.innerHTML = `
      <button class="athlete-button" type="button" aria-expanded="false">
        <div class="rank-badge">#${athlete.rank_position}</div>
        ${avatarMarkup(athlete)}
        <div class="athlete-main">
          <div>
            <div class="athlete-name-row">
              <div class="athlete-name">${athlete.name}</div>
              ${athlete.rank_position <= 3 ? `<span class="place-tag place-tag--${athlete.rank_position}">#${athlete.rank_position}</span>` : ''}
            </div>
            ${subtitleForCategory(athlete, category)}
          </div>
        </div>
        <div class="athlete-score athlete-score--centered">
          <div class="score-value">${scoreMarkup(athlete.ranking_value)}</div>
          ${!aggregateCategories.includes(category) ? `<div class="score-meta">ciężar: ${exerciseAmountLabel(athlete, category)}</div>` : ''}
        </div>
      </button>
      <div class="athlete-details hidden">
        ${breakdownHtml(athlete)}
      </div>
    `;

    const button = row.querySelector('.athlete-button');
    const details = row.querySelector('.athlete-details');
    const img = row.querySelector('img.avatar');
    if (img) {
      img.addEventListener('error', () => {
        const fallback = document.createElement('div');
        fallback.className = 'avatar avatar-fallback';
        fallback.textContent = (athlete.name || '?').trim().charAt(0).toUpperCase();
        img.replaceWith(fallback);
      });
    }
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
    updatedVersion.textContent = window.SCoringConfig.versionName;
    renderRanking();
    initFilters();
    nextCategoryBtn?.addEventListener('click', cycleCategory);
  }

  init();
})();
