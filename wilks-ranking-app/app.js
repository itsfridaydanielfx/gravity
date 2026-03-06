(() => {
  const CONFIG = window.APP_CONFIG;
  const ATHLETES = Array.isArray(window.ATHLETES) ? window.ATHLETES : [];

  const FIELD_ORDER = [
    "pullup_added_weight_kg",
    "dip_added_weight_kg",
    "muscleup_added_weight_kg",
    "bench_kg",
    "squat_kg",
    "deadlift_kg",
    "ohp_kg",
    "biceps_kg",
  ];

  const EXERCISES = {
    pullup_added_weight_kg: {
      key: "pullup",
      label: "Pull-up +kg",
      type: "bodyweight",
      multiplierKey: "pullup",
      group: "street",
    },
    dip_added_weight_kg: {
      key: "dip",
      label: "Dip +kg",
      type: "bodyweight",
      multiplierKey: "dip",
      group: "street",
    },
    muscleup_added_weight_kg: {
      key: "muscleup",
      label: "Muscle-up +kg",
      type: "bodyweight",
      multiplierKey: "muscleup",
      group: "street",
    },
    bench_kg: {
      key: "bench",
      label: "Bench",
      type: "external",
      multiplierKey: "bench",
      group: "barbell",
    },
    squat_kg: {
      key: "squat",
      label: "Squat",
      type: "external",
      multiplierKey: "squat",
      group: "barbell",
    },
    deadlift_kg: {
      key: "deadlift",
      label: "Deadlift",
      type: "external",
      multiplierKey: "deadlift",
      group: "barbell",
    },
    ohp_kg: {
      key: "ohp",
      label: "OHP",
      type: "external",
      multiplierKey: "ohp",
      group: "barbell",
    },
    biceps_kg: {
      key: "biceps",
      label: "Biceps curl",
      type: "external",
      multiplierKey: "biceps",
      group: "arms",
    },
  };

  const SORT_OPTIONS = [
    { value: "total_points", label: "Overall" },
    { value: "street_score", label: "Street score" },
    { value: "barbell_score", label: "Barbell score" },
    { value: "arms_score", label: "Arms score" },
    { value: "pullup_points", label: "Pull-up points" },
    { value: "dip_points", label: "Dip points" },
    { value: "muscleup_points", label: "Muscle-up points" },
    { value: "bench_points", label: "Bench points" },
    { value: "squat_points", label: "Squat points" },
    { value: "deadlift_points", label: "Deadlift points" },
    { value: "ohp_points", label: "OHP points" },
    { value: "biceps_points", label: "Biceps points" },
    { value: "bodyweight_kg_asc", label: "Waga rosnąco" },
    { value: "bodyweight_kg_desc", label: "Waga malejąco" },
  ];

  const state = {
    search: "",
    sortBy: "total_points",
    statusFilter: "all",
    selectedAthleteId: null,
  };

  const els = {
    heroStats: document.getElementById("heroStats"),
    podiumGrid: document.getElementById("podiumGrid"),
    rankingBody: document.getElementById("rankingBody"),
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
    statusFilter: document.getElementById("statusFilter"),
    drawer: document.getElementById("detailDrawer"),
    drawerContent: document.getElementById("drawerContent"),
    generatorForm: document.getElementById("generatorForm"),
    generatorPreview: document.getElementById("generatorPreview"),
    athleteCodeBlock: document.getElementById("athleteCodeBlock"),
    copyBlockBtn: document.getElementById("copyBlockBtn"),
    configCards: document.getElementById("configCards"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
  };

  function roundTo(value, precision) {
    const factor = Math.pow(10, precision);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatNumber(value, decimals = 1) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return Number(value).toLocaleString("pl-PL", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function formatDate(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pl-PL");
  }

  function slugify(input) {
    return String(input || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "nowy-zawodnik";
  }

  function getInitials(name) {
    const words = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "??";
    return words.slice(0, 2).map((word) => word[0].toUpperCase()).join("");
  }

  function avatarTemplate(athlete, sizeClass = "") {
    const className = ["avatar", sizeClass].filter(Boolean).join(" ");
    const photo = String(athlete.photo || "").trim();
    if (photo) {
      return `<div class="${className}"><img src="${photo}" alt="${escapeHtml(athlete.name)}" loading="lazy" /></div>`;
    }
    return `<div class="${className}">${escapeHtml(getInitials(athlete.name))}</div>`;
  }

  function escapeHtml(input) {
    return String(input ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function validateAthlete(athlete) {
    const warnings = [];
    const errors = [];

    if (!String(athlete.name || "").trim()) {
      errors.push("Nazwa zawodnika nie może być pusta.");
    }

    const bw = toNumber(athlete.bodyweight_kg);
    if (bw === null || bw <= 0) {
      errors.push("Masa ciała musi być większa od 0.");
    }

    for (const field of FIELD_ORDER) {
      const value = toNumber(athlete[field]);
      if (value !== null && value < 0) {
        errors.push(`${EXERCISES[field].label}: wynik nie może być ujemny.`);
      }
    }

    if (bw !== null) {
      if (bw < CONFIG.warnings.bodyweight_min || bw > CONFIG.warnings.bodyweight_max) {
        warnings.push(`Waga ${formatNumber(bw)} kg wygląda nietypowo.`);
      }
    }

    const reasonableChecks = [
      ["bench_kg", CONFIG.warnings.bench_max],
      ["squat_kg", CONFIG.warnings.squat_max],
      ["deadlift_kg", CONFIG.warnings.deadlift_max],
      ["ohp_kg", CONFIG.warnings.ohp_max],
      ["biceps_kg", CONFIG.warnings.biceps_max],
      ["pullup_added_weight_kg", CONFIG.warnings.pullup_added_max],
      ["dip_added_weight_kg", CONFIG.warnings.dip_added_max],
      ["muscleup_added_weight_kg", CONFIG.warnings.muscleup_added_max],
    ];

    reasonableChecks.forEach(([field, limit]) => {
      const value = toNumber(athlete[field]);
      if (value !== null && value > limit) {
        warnings.push(`${EXERCISES[field].label}: ${formatNumber(value)} kg wygląda jak literówka.`);
      }
    });

    const isComplete = FIELD_ORDER.every((field) => {
      const value = toNumber(athlete[field]);
      return value !== null && value > 0;
    });

    return { warnings, errors, isComplete };
  }

  function calculateAthlete(athlete) {
    const validation = validateAthlete(athlete);
    const bodyweight = toNumber(athlete.bodyweight_kg);
    const scaledBodyweight = bodyweight && bodyweight > 0
      ? Math.pow(bodyweight, CONFIG.allometric_exponent)
      : null;

    const exerciseResults = {};
    let streetScore = 0;
    let barbellScore = 0;
    let armsScore = 0;
    let totalPoints = 0;

    FIELD_ORDER.forEach((field) => {
      const exercise = EXERCISES[field];
      const inputValue = toNumber(athlete[field]);
      let load = null;
      let raw = null;
      let points = 0;

      if (scaledBodyweight && inputValue !== null && inputValue >= 0) {
        load = exercise.type === "bodyweight"
          ? bodyweight + inputValue
          : inputValue;
        raw = load / scaledBodyweight;
        const withScale = raw * CONFIG.readability_scale;
        points = roundTo(withScale * CONFIG.multipliers[exercise.multiplierKey], CONFIG.rounding_precision);
      }

      exerciseResults[field] = {
        inputValue,
        load,
        raw,
        points,
        label: exercise.label,
        group: exercise.group,
      };

      totalPoints += points;
      if (exercise.group === "street") streetScore += points;
      if (exercise.group === "barbell") barbellScore += points;
      if (exercise.group === "arms") armsScore += points;
    });

    streetScore = roundTo(streetScore, CONFIG.rounding_precision);
    barbellScore = roundTo(barbellScore, CONFIG.rounding_precision);
    armsScore = roundTo(armsScore, CONFIG.rounding_precision);
    totalPoints = roundTo(totalPoints, CONFIG.rounding_precision);

    return {
      ...athlete,
      scaled_bodyweight: scaledBodyweight,
      exercise_results: exerciseResults,
      pullup_points: exerciseResults.pullup_added_weight_kg.points,
      dip_points: exerciseResults.dip_added_weight_kg.points,
      muscleup_points: exerciseResults.muscleup_added_weight_kg.points,
      bench_points: exerciseResults.bench_kg.points,
      squat_points: exerciseResults.squat_kg.points,
      deadlift_points: exerciseResults.deadlift_kg.points,
      ohp_points: exerciseResults.ohp_kg.points,
      biceps_points: exerciseResults.biceps_kg.points,
      street_score: streetScore,
      barbell_score: barbellScore,
      arms_score: armsScore,
      total_points: totalPoints,
      is_complete: validation.isComplete,
      validation_errors: validation.errors,
      validation_warnings: validation.warnings,
      rank_position: null,
    };
  }

  function assignOverallRanks(athletes) {
    const complete = athletes
      .filter((athlete) => athlete.is_complete)
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.street_score !== a.street_score) return b.street_score - a.street_score;
        if (b.barbell_score !== a.barbell_score) return b.barbell_score - a.barbell_score;
        return a.bodyweight_kg - b.bodyweight_kg;
      });

    let previousPoints = null;
    let currentRank = 0;

    complete.forEach((athlete, index) => {
      if (athlete.total_points !== previousPoints) {
        currentRank = index + 1;
        previousPoints = athlete.total_points;
      }
      athlete.rank_position = currentRank;
    });

    return athletes;
  }

  function buildComputedAthletes() {
    return assignOverallRanks(ATHLETES.map(calculateAthlete));
  }

  function getSortedAthletes(computedAthletes) {
    const filtered = computedAthletes.filter((athlete) => {
      const matchesSearch = athlete.name.toLowerCase().includes(state.search.toLowerCase());
      const matchesStatus =
        state.statusFilter === "all" ||
        (state.statusFilter === "complete" && athlete.is_complete) ||
        (state.statusFilter === "incomplete" && !athlete.is_complete);
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case "bodyweight_kg_asc":
          return a.bodyweight_kg - b.bodyweight_kg;
        case "bodyweight_kg_desc":
          return b.bodyweight_kg - a.bodyweight_kg;
        default: {
          const aValue = Number(a[state.sortBy] ?? 0);
          const bValue = Number(b[state.sortBy] ?? 0);
          if (bValue !== aValue) return bValue - aValue;
          if (state.sortBy !== "total_points" && b.total_points !== a.total_points) {
            return b.total_points - a.total_points;
          }
          return a.name.localeCompare(b.name, "pl");
        }
      }
    });

    let previousMetric = null;
    let currentRank = 0;

    return filtered.map((athlete, index) => {
      const metricValue = state.sortBy === "bodyweight_kg_asc" || state.sortBy === "bodyweight_kg_desc"
        ? athlete.bodyweight_kg
        : athlete[state.sortBy];
      if (metricValue !== previousMetric) {
        currentRank = index + 1;
        previousMetric = metricValue;
      }
      return {
        ...athlete,
        display_rank: currentRank,
      };
    });
  }

  function renderHeroStats(computedAthletes) {
    const completeCount = computedAthletes.filter((athlete) => athlete.is_complete).length;
    const leader = computedAthletes
      .filter((athlete) => athlete.is_complete)
      .sort((a, b) => b.total_points - a.total_points)[0];
    const averageBodyweight = computedAthletes.length
      ? computedAthletes.reduce((sum, athlete) => sum + athlete.bodyweight_kg, 0) / computedAthletes.length
      : 0;

    const cards = [
      {
        label: "Liczba zawodników",
        value: computedAthletes.length,
        hint: "Wszystkie rekordy z athletes.js",
      },
      {
        label: "Overall eligible",
        value: completeCount,
        hint: "Z kompletem 8 ćwiczeń",
      },
      {
        label: "Lider",
        value: leader ? leader.name : "Brak",
        hint: leader ? `${formatNumber(leader.total_points)} pkt overall` : "Dodaj kompletne rekordy",
      },
      {
        label: "Średnia waga",
        value: `${formatNumber(averageBodyweight)} kg`,
        hint: `Config: ${CONFIG.version_name}`,
      },
    ];

    els.heroStats.innerHTML = cards
      .map((card) => `
        <article class="hero-card">
          <div class="label">${escapeHtml(card.label)}</div>
          <div class="value">${escapeHtml(String(card.value))}</div>
          <div class="hint">${escapeHtml(card.hint)}</div>
        </article>
      `)
      .join("");
  }

  function renderPodium(computedAthletes) {
    const podium = computedAthletes
      .filter((athlete) => athlete.is_complete)
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 3);

    if (!podium.length) {
      els.podiumGrid.innerHTML = `<div class="empty-state panel">Brak kompletnych zawodników do wyświetlenia podium.</div>`;
      return;
    }

    els.podiumGrid.innerHTML = podium.map((athlete, index) => {
      const position = index + 1;
      return `
        <article class="podium-card rank-${position}" data-athlete-id="${escapeHtml(athlete.id)}">
          <span class="rank-chip ${position === 1 ? "gold" : ""}">#${position}</span>
          <div class="athlete-head">
            ${avatarTemplate(athlete)}
            <div>
              <div class="athlete-name">${escapeHtml(athlete.name)}</div>
              <div class="athlete-meta">${formatNumber(athlete.bodyweight_kg)} kg · rank overall #${athlete.rank_position}</div>
            </div>
          </div>
          <div class="metrics-row">
            <div class="metric-box">
              <div class="metric-label">Overall</div>
              <div class="metric-value">${formatNumber(athlete.total_points)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Street</div>
              <div class="metric-value">${formatNumber(athlete.street_score)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Barbell</div>
              <div class="metric-value">${formatNumber(athlete.barbell_score)}</div>
            </div>
          </div>
        </article>
      `;
    }).join("");

    els.podiumGrid.querySelectorAll("[data-athlete-id]").forEach((card) => {
      card.addEventListener("click", () => openDrawer(card.dataset.athleteId));
    });
  }

  function renderTable(sortedAthletes) {
    if (!sortedAthletes.length) {
      els.rankingBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">Brak wyników dla aktualnych filtrów.</div>
          </td>
        </tr>
      `;
      return;
    }

    els.rankingBody.innerHTML = sortedAthletes.map((athlete) => {
      return `
        <tr data-athlete-id="${escapeHtml(athlete.id)}">
          <td>${athlete.display_rank}</td>
          <td>
            <div class="table-athlete">
              ${avatarTemplate(athlete)}
              <div>
                <div class="name">${escapeHtml(athlete.name)}</div>
                <div class="sub">overall rank: ${athlete.rank_position ?? "—"}</div>
              </div>
            </div>
          </td>
          <td>${formatNumber(athlete.bodyweight_kg)} kg</td>
          <td><strong>${formatNumber(athlete.total_points)}</strong></td>
          <td>${formatNumber(athlete.street_score)}</td>
          <td>${formatNumber(athlete.barbell_score)}</td>
          <td>${formatNumber(athlete.arms_score)}</td>
          <td><span class="status-chip ${athlete.is_complete ? "complete" : "incomplete"}">${athlete.is_complete ? "Complete" : "Incomplete"}</span></td>
        </tr>
      `;
    }).join("");

    els.rankingBody.querySelectorAll("tr[data-athlete-id]").forEach((row) => {
      row.addEventListener("click", () => openDrawer(row.dataset.athleteId));
    });
  }

  function getComputedAthleteById(id) {
    return buildComputedAthletes().find((athlete) => athlete.id === id) || null;
  }

  function renderDrawer(athlete) {
    if (!athlete) {
      els.drawerContent.innerHTML = "";
      return;
    }

    const exerciseCards = FIELD_ORDER.map((field) => {
      const result = athlete.exercise_results[field];
      const contribution = athlete.total_points > 0 ? (result.points / athlete.total_points) * 100 : 0;
      return `
        <article class="exercise-card">
          <h4>${escapeHtml(result.label)}</h4>
          <p class="drawer-muted">Input: ${formatNumber(result.inputValue)} kg · Load: ${formatNumber(result.load)} kg</p>
          <div class="detail-stat">
            <span class="label">Raw score</span>
            <span class="big">${formatNumber(result.raw, 3)}</span>
          </div>
          <div class="detail-stat" style="margin-top: 10px;">
            <span class="label">Final points</span>
            <span class="big">${formatNumber(result.points)}</span>
          </div>
          <div class="progress-wrap">
            <div class="small-note">Udział w overall: ${formatNumber(contribution)}%</div>
            <div class="progress-track"><div class="progress-bar" style="width:${Math.min(100, contribution)}%"></div></div>
          </div>
        </article>
      `;
    }).join("");

    const warningHtml = athlete.validation_warnings.length
      ? `<ul class="warning-list">${athlete.validation_warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>`
      : "";

    els.drawerContent.innerHTML = `
      <div class="drawer-head">
        ${avatarTemplate(athlete)}
        <div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
            <h3 class="drawer-title">${escapeHtml(athlete.name)}</h3>
            <span class="status-chip ${athlete.is_complete ? "complete" : "incomplete"}">${athlete.is_complete ? "Complete" : "Incomplete"}</span>
          </div>
          <p class="drawer-muted">ID: <span class="code-inline">${escapeHtml(athlete.id)}</span> · zaktualizowano ${formatDate(athlete.updated_at)}</p>
        </div>
      </div>

      <div class="drawer-meta-row">
        <article class="detail-stat">
          <span class="label">Overall rank</span>
          <span class="big">${athlete.rank_position ?? "—"}</span>
        </article>
        <article class="detail-stat">
          <span class="label">Bodyweight</span>
          <span class="big">${formatNumber(athlete.bodyweight_kg)} kg</span>
        </article>
        <article class="detail-stat">
          <span class="label">Scaled bodyweight</span>
          <span class="big">${formatNumber(athlete.scaled_bodyweight, 3)}</span>
        </article>
      </div>

      <div class="breakdown-grid">
        <article class="breakdown-card">
          <h4>Overall</h4>
          <p>${formatNumber(athlete.total_points)} pkt</p>
        </article>
        <article class="breakdown-card">
          <h4>Street score</h4>
          <p>${formatNumber(athlete.street_score)} pkt</p>
        </article>
        <article class="breakdown-card">
          <h4>Barbell score</h4>
          <p>${formatNumber(athlete.barbell_score)} pkt</p>
        </article>
        <article class="breakdown-card">
          <h4>Arms score</h4>
          <p>${formatNumber(athlete.arms_score)} pkt</p>
        </article>
      </div>

      <div class="section-head section-head-tight" style="margin-top: 24px; margin-bottom: 14px;">
        <div>
          <span class="eyebrow">Breakdown</span>
          <h2 style="font-size:1.2rem;">Punkty za każde ćwiczenie</h2>
        </div>
      </div>

      <div class="exercise-grid">${exerciseCards}</div>
      ${warningHtml}
    `;
  }

  function openDrawer(athleteId) {
    state.selectedAthleteId = athleteId;
    const athlete = getComputedAthleteById(athleteId);
    renderDrawer(athlete);
    els.drawer.classList.add("open");
    els.drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    els.drawer.classList.remove("open");
    els.drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function renderConfigCards() {
    const multiplierList = Object.entries(CONFIG.multipliers)
      .map(([key, value]) => `<div class="small-note">${escapeHtml(CONFIG.labels[key] || key)}: <strong>${formatNumber(value)}</strong></div>`)
      .join("");

    els.configCards.innerHTML = `
      <article class="config-card">
        <span class="small-note">Wersja systemu</span>
        <span class="big">${escapeHtml(CONFIG.version_name)}</span>
        <p>Aktywna: ${CONFIG.is_active ? "tak" : "nie"}</p>
      </article>
      <article class="config-card">
        <span class="small-note">Allometric exponent</span>
        <span class="big">${formatNumber(CONFIG.allometric_exponent, 2)}</span>
        <p>To jest wykładnik używany do <code>bodyweight ^ exponent</code>.</p>
      </article>
      <article class="config-card">
        <span class="small-note">Readability scale</span>
        <span class="big">x${formatNumber(CONFIG.readability_scale, 0)}</span>
        <p>Skaluje wynik, żeby liczby były czytelne.</p>
      </article>
      <article class="config-card">
        <span class="small-note">Rounding precision</span>
        <span class="big">${CONFIG.rounding_precision}</span>
        <p>Ile miejsc po przecinku trafia do finalnego rankingu.</p>
      </article>
      <article class="config-card" style="grid-column: 1 / -1;">
        <span class="small-note">Mnożniki ćwiczeń</span>
        <span class="big">Configurable</span>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px;">
          ${multiplierList}
        </div>
      </article>
    `;
  }

  function getGeneratorAthlete() {
    const formData = new FormData(els.generatorForm);
    const payload = {
      id: slugify(formData.get("name") || "nowy-zawodnik"),
      name: String(formData.get("name") || "Nowy zawodnik").trim(),
      photo: String(formData.get("photo") || "").trim(),
      bodyweight_kg: toNumber(formData.get("bodyweight_kg")),
      pullup_added_weight_kg: toNumber(formData.get("pullup_added_weight_kg")),
      dip_added_weight_kg: toNumber(formData.get("dip_added_weight_kg")),
      muscleup_added_weight_kg: toNumber(formData.get("muscleup_added_weight_kg")),
      bench_kg: toNumber(formData.get("bench_kg")),
      squat_kg: toNumber(formData.get("squat_kg")),
      deadlift_kg: toNumber(formData.get("deadlift_kg")),
      ohp_kg: toNumber(formData.get("ohp_kg")),
      biceps_kg: toNumber(formData.get("biceps_kg")),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return payload;
  }

  function buildAthleteCodeBlock(athlete) {
    const constName = `ATHLETE_${slugify(athlete.name).replace(/-/g, "_").toUpperCase()}`;
    const valueOrNull = (value) => value === null ? "null" : value;
    return `const ${constName} = {\n  id: "${slugify(athlete.name)}",\n  name: "${escapeString(athlete.name)}",\n  photo: "${escapeString(athlete.photo || "")}",\n  bodyweight_kg: ${valueOrNull(athlete.bodyweight_kg)},\n  pullup_added_weight_kg: ${valueOrNull(athlete.pullup_added_weight_kg)},\n  dip_added_weight_kg: ${valueOrNull(athlete.dip_added_weight_kg)},\n  muscleup_added_weight_kg: ${valueOrNull(athlete.muscleup_added_weight_kg)},\n  bench_kg: ${valueOrNull(athlete.bench_kg)},\n  squat_kg: ${valueOrNull(athlete.squat_kg)},\n  deadlift_kg: ${valueOrNull(athlete.deadlift_kg)},\n  ohp_kg: ${valueOrNull(athlete.ohp_kg)},\n  biceps_kg: ${valueOrNull(athlete.biceps_kg)},\n  created_at: "${athlete.created_at}",\n  updated_at: "${athlete.updated_at}",\n};`;
  }

  function escapeString(input) {
    return String(input ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function renderGenerator() {
    const athlete = getGeneratorAthlete();
    const computed = calculateAthlete(athlete);
    const hasName = String(athlete.name || "").trim() && athlete.name !== "Nowy zawodnik";

    els.generatorPreview.innerHTML = `
      <article class="preview-box">
        <span class="small-note">Scaled bodyweight</span>
        <span class="big">${computed.scaled_bodyweight ? formatNumber(computed.scaled_bodyweight, 3) : "—"}</span>
        <p>Liczone z <code>bodyweight ^ ${CONFIG.allometric_exponent}</code>.</p>
      </article>
      <article class="preview-box">
        <span class="small-note">Overall preview</span>
        <span class="big">${formatNumber(computed.total_points)}</span>
        <p>${computed.is_complete ? "Kompletny zawodnik do overall." : "Brakuje kompletu 8 wyników do overall."}</p>
      </article>
      <article class="preview-box">
        <span class="small-note">Street / Barbell / Arms</span>
        <span class="big">${formatNumber(computed.street_score)} / ${formatNumber(computed.barbell_score)} / ${formatNumber(computed.arms_score)}</span>
        <p>To jest szybki breakdown przed wklejeniem do pliku danych.</p>
      </article>
      <article class="preview-box">
        <span class="small-note">Status</span>
        <span class="big">${computed.is_complete ? "Complete" : "Incomplete"}</span>
        <p>${computed.validation_warnings[0] ? escapeHtml(computed.validation_warnings[0]) : "Brak ostrzeżeń walidacyjnych."}</p>
      </article>
    `;

    els.athleteCodeBlock.textContent = hasName ? buildAthleteCodeBlock(athlete) : "Wpisz nazwę i liczby, a tutaj pojawi się gotowy blok do wklejenia.";
  }

  function downloadCsv(rows) {
    const headers = [
      "display_rank",
      "overall_rank",
      "name",
      "bodyweight_kg",
      "total_points",
      "street_score",
      "barbell_score",
      "arms_score",
      "pullup_points",
      "dip_points",
      "muscleup_points",
      "bench_points",
      "squat_points",
      "deadlift_points",
      "ohp_points",
      "biceps_points",
      "is_complete",
    ];

    const csvRows = [headers.join(",")].concat(
      rows.map((athlete) => headers.map((header) => {
        const value = header === "overall_rank" ? athlete.rank_position : athlete[header];
        return `"${String(value ?? "").replace(/"/g, '""')}"`;
      }).join(","))
    );

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "club-friday-strength-ranking.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function hydrateSortSelect() {
    els.sortSelect.innerHTML = SORT_OPTIONS.map((option) => `
      <option value="${option.value}">${option.label}</option>
    `).join("");
    els.sortSelect.value = state.sortBy;
  }

  function render() {
    const computedAthletes = buildComputedAthletes();
    const sortedAthletes = getSortedAthletes(computedAthletes);

    renderHeroStats(computedAthletes);
    renderPodium(computedAthletes);
    renderTable(sortedAthletes);

    els.exportCsvBtn.onclick = () => downloadCsv(sortedAthletes);
  }

  function bindEvents() {
    els.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value.trim();
      render();
    });

    els.sortSelect.addEventListener("change", (event) => {
      state.sortBy = event.target.value;
      render();
    });

    els.statusFilter.addEventListener("change", (event) => {
      state.statusFilter = event.target.value;
      render();
    });

    document.querySelectorAll("[data-close-drawer]").forEach((element) => {
      element.addEventListener("click", closeDrawer);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    });

    els.generatorForm.addEventListener("input", renderGenerator);

    els.copyBlockBtn.addEventListener("click", async () => {
      const text = els.athleteCodeBlock.textContent.trim();
      if (!text || text.startsWith("Wpisz nazwę")) return;
      try {
        await navigator.clipboard.writeText(text);
        const previous = els.copyBlockBtn.textContent;
        els.copyBlockBtn.textContent = "Skopiowano";
        setTimeout(() => {
          els.copyBlockBtn.textContent = previous;
        }, 1400);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function init() {
    hydrateSortSelect();
    bindEvents();
    renderConfigCards();
    renderGenerator();
    render();
  }

  init();
})();
