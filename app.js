(function () {
  const categorySelect = document.getElementById('categorySelect');
  const rankingList = document.getElementById('rankingList');
  const emptyState = document.getElementById('emptyState');
  const updatedVersion = document.getElementById('versionName');

  function iconForRank(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  function subtitleForCategory(athlete, category) {
    if (category === 'overall') return `${athlete.bodyweight_kg} kg • Overall`;
    if (category === 'street') return `${athlete.bodyweight_kg} kg • Street`;
    if (category === 'barbell') return `${athlete.bodyweight_kg} kg • Barbell`;
    if (category === 'arms') return `${athlete.bodyweight_kg} kg • Arms`;
    return `${athlete.bodyweight_kg} kg • ${category}`;
  }

  function breakdownHtml(a) {
    return `
      <div class="detail-grid">
        <div><span>Scaled BW</span><strong>${a.scaled_bodyweight}</strong></div>
        <div><span>Street</span><strong>${a.street_score}</strong></div>
        <div><span>Barbell</span><strong>${a.barbell_score}</strong></div>
        <div><span>Arms</span><strong>${a.arms_score}</strong></div>
        <div><span>Pull-up</span><strong>${a.points.pullup}</strong></div>
        <div><span>Dip</span><strong>${a.points.dip}</strong></div>
        <div><span>Muscle-up</span><strong>${a.points.muscleup}</strong></div>
        <div><span>Bench</span><strong>${a.points.bench}</strong></div>
        <div><span>Squat</span><strong>${a.points.squat}</strong></div>
        <div><span>Deadlift</span><strong>${a.points.deadlift}</strong></div>
        <div><span>OHP</span><strong>${a.points.ohp}</strong></div>
        <div><span>Biceps</span><strong>${a.points.biceps}</strong></div>
      </div>
    `;
  }

  function createRow(athlete, category) {
    const row = document.createElement('article');
    row.className = 'athlete-row';
    if (athlete.rank_position <= 3) row.classList.add(`top-${athlete.rank_position}`);

    row.innerHTML = `
      <button class="athlete-button" type="button" aria-expanded="false">
        <div class="rank-badge">${iconForRank(athlete.rank_position)}</div>
        <img class="avatar" src="${athlete.photo}" alt="${athlete.name}">
        <div class="athlete-main">
          <div class="athlete-name">${athlete.name}</div>
          <div class="athlete-subtitle">${subtitleForCategory(athlete, category)}</div>
        </div>
        <div class="athlete-score">
          <div class="score-value">${athlete.ranking_value}</div>
          <div class="score-label">pkt</div>
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

  function init() {
    initCategories();
    categorySelect.value = 'overall';
    updatedVersion.textContent = window.SCoringConfig.versionName;
    categorySelect.addEventListener('change', renderRanking);
    renderRanking();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
