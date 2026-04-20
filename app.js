// ============================================================
// CONSTANTS
// ============================================================

const TEAM_COLORS = [
  '#dc2626', // rot
  '#16a34a', // grün
  '#d97706', // amber
  '#2563eb', // blau
  '#ea580c', // orange
  '#7c3aed', // lila
  '#db2777', // pink
  '#854d0e', // braun
];

// ============================================================
// JSONBIN
// ============================================================

const JSONBIN_ID  = '69e370a836566621a8c7f7ad';
const JSONBIN_KEY = '$2a$10$Ua0owTKHSRfxmg7ByIAefOBSnHGWr4ZF1fY5L.W4KXFkqrTJ0CHVq';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

// ============================================================
// STATE
// ============================================================

let db = { players: [], sessions: [] };
let dbReady = false;
let currentPlayers   = [];
let currentTeams     = [];
let currentMatches   = [];
let currentRounds    = [];       // rounds ended this session: [{ teams, matches }]
let currentRoundNumber = 1;
let sessionPairings  = new Set(); // player-pair keys used this session
let scheduleActive   = false;     // true while a round is in progress
let quickMode        = false;     // true when playing without DB save

// ============================================================
// DATABASE
// ============================================================

async function saveDB() {
  try {
    const res = await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': JSONBIN_KEY,
        'X-Bin-Versioning': 'false',
      },
      body: JSON.stringify(db),
    });
    if (!res.ok) throw new Error();
  } catch {
    updateSyncStatus('error');
  }
}

async function loadDB() {
  updateSyncStatus('loading');
  updateHomeState();
  try {
    const res = await fetch(`${JSONBIN_URL}/latest`, {
      headers: { 'X-Access-Key': JSONBIN_KEY },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    db = data.record;
    dbReady = true;
    updateSyncStatus('connected');
    renderKnownPlayers();
    renderStats();
    updateHomeState();
    updateHomeBanner();
    updateHomeExtras();
  } catch {
    updateSyncStatus('error');
    updateHomeState();
  }
}


function updateSyncStatus(status) {
  const dot  = document.getElementById('sync-dot');
  const text = document.getElementById('sync-status-text');
  const msg  = document.getElementById('sync-loading-msg');
  if (!dot || !text) return;
  dot.className = `sync-dot sync-${status}`;
  if (status === 'connected') {
    const count = db.sessions.length;
    text.textContent = `Verbunden · ${count} Spieltag${count !== 1 ? 'e' : ''}`;
    if (msg) msg.classList.add('hidden');
    const icon = document.querySelector('.header-icon');
    if (icon) { icon.classList.remove('icon-shimmer'); void icon.offsetWidth; icon.classList.add('icon-shimmer'); }
  } else if (status === 'error') {
    text.textContent = 'Ladefehler — Seite neu laden';
    if (msg) msg.classList.add('hidden');
  } else {
    text.textContent = 'Lade...';
    if (msg) msg.classList.remove('hidden');
  }
}



// ============================================================
// DB LOCK / HOME STATE
// ============================================================

function updateHomeState() {
  const startBtn = document.getElementById('start-game-btn');
  startBtn.disabled      = !dbReady;
  startBtn.style.opacity = dbReady ? '' : '0.4';
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab !== 'home') {
      btn.disabled      = !dbReady && btn.dataset.tab !== 'spieltag';
      btn.style.opacity = (dbReady || btn.dataset.tab === 'spieltag') ? '' : '0.4';
    }
  });
}

// ============================================================
// TABS
// ============================================================

function switchTab(tabId) {
  if (!dbReady && tabId !== 'home' && !(quickMode && tabId === 'spieltag')) return;
  doSwitchTab(tabId);
}

function doSwitchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tabId)
  );
  document.querySelectorAll('.tab-content').forEach(panel =>
    panel.classList.toggle('active', panel.id === `tab-${tabId}`)
  );
  if (tabId === 'statistiken') { renderStats(); if (!document.getElementById('historie-body').classList.contains('hidden')) renderHistorie(); }
  if (tabId === 'home')        { updateHomeBanner(); updateHomeState(); updateHomeExtras(); animateHomeCards(); }
  if (tabId === 'spieltag' && !scheduleActive && currentRounds.length === 0) showSpieltagIdle();
  if (tabId === 'spieltag') updateSectionVisibility();
}

// ============================================================
// CONFIRM / DIALOGS
// ============================================================

function showConfirm(msg, onOk, okText = 'Ja, fortfahren') {
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-ok').textContent = okText;
  document.getElementById('confirm-overlay').classList.remove('hidden');
  document.getElementById('confirm-ok').onclick = () => {
    document.getElementById('confirm-overlay').classList.add('hidden');
    onOk();
  };
}

function closeConfirm() {
  document.getElementById('confirm-overlay').classList.add('hidden');
}

// ============================================================
// PLAYERS
// ============================================================

function renderKnownPlayers() {
  const row   = document.getElementById('known-players-row');
  if (quickMode) { row.classList.add('hidden'); return; }
  const known = db.players.filter(
    p => !currentPlayers.some(c => c.toLowerCase() === p.toLowerCase())
  );
  if (known.length === 0) { row.classList.add('hidden'); return; }
  row.classList.remove('hidden');
  row.innerHTML = '<span class="known-label">Bekannte:</span>';
  known.forEach(name => {
    const chip = document.createElement('button');
    chip.className   = 'player-chip';
    chip.textContent = name;
    chip.addEventListener('click', () => {
      currentPlayers.push(name);
      renderPlayers();
      renderKnownPlayers();
    });
    row.appendChild(chip);
  });
}

function renderPlayers() {
  const list = document.getElementById('player-list');
  const header = document.getElementById('selected-players-header');
  list.innerHTML = '';
  header.classList.toggle('hidden', currentPlayers.length === 0);
  currentPlayers.forEach((name, index) => {
    const li         = document.createElement('li');
    const nameSpan   = document.createElement('span');
    nameSpan.textContent = name;
    const removeBtn  = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className   = 'btn-remove';
    removeBtn.addEventListener('click', () => {
      currentPlayers.splice(index, 1);
      renderPlayers();
      renderKnownPlayers();
    });
    li.appendChild(nameSpan);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

function addPlayer() {
  const input = document.getElementById('player-input');
  const name  = input.value.trim();
  if (!name) return;
  if (currentPlayers.some(p => p.toLowerCase() === name.toLowerCase())) {
    showError(`"${name}" ist bereits in der Liste.`);
    return;
  }
  currentPlayers.push(name);
  if (!quickMode && !db.players.some(p => p.toLowerCase() === name.toLowerCase())) {
    db.players.push(name);
    saveDB();
  }
  input.value = '';
  renderPlayers();
  renderKnownPlayers();
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

// ============================================================
// TEAMS
// ============================================================

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pairingKey(a, b) {
  return [a, b].sort().join('|||');
}

function allPairingsExhausted(players) {
  for (let i = 0; i < players.length; i++)
    for (let j = i + 1; j < players.length; j++)
      if (!sessionPairings.has(pairingKey(players[i], players[j]))) return false;
  return true;
}

function buildTeamsAvoidingHistory(players) {
  if (allPairingsExhausted(players)) sessionPairings = new Set();

  // Try up to 30 random shuffles to find a fully-fresh arrangement
  for (let attempt = 0; attempt < 30; attempt++) {
    const shuffled   = shuffle(players);
    const remaining  = [...shuffled];
    const teams      = [];
    let   valid      = true;

    while (remaining.length >= 2) {
      const first      = remaining.shift();
      const partnerIdx = remaining.findIndex(p => !sessionPairings.has(pairingKey(first, p)));
      if (partnerIdx === -1) { valid = false; break; }
      teams.push([first, remaining.splice(partnerIdx, 1)[0]]);
    }
    if (valid) {
      if (remaining.length === 1) teams.push([remaining[0]]);
      return teams;
    }
  }

  // Fallback: best-effort greedy (some repeats unavoidable)
  const remaining = shuffle(players);
  const teams     = [];
  while (remaining.length >= 2) {
    const first = remaining.shift();
    let idx     = remaining.findIndex(p => !sessionPairings.has(pairingKey(first, p)));
    if (idx === -1) idx = 0;
    teams.push([first, remaining.splice(idx, 1)[0]]);
  }
  if (remaining.length === 1) teams.push([remaining[0]]);
  return teams;
}

function generateTeams() {
  const doGenerate = () => {
    if (currentPlayers.length < 2) {
      document.getElementById('teams-container').innerHTML =
        '<p class="message">Mindestens 2 Spieler erforderlich.</p>';
      currentTeams = [];
      return;
    }
    currentTeams   = buildTeamsAvoidingHistory(currentPlayers);
    currentMatches = [];
    scheduleActive = false;
    document.getElementById('schedule-container').innerHTML = '';
    document.getElementById('section-table').classList.add('hidden');
    document.getElementById('end-round-area').classList.add('hidden');
    document.getElementById('post-round-overlay').classList.add('hidden');
    document.getElementById('round-label').textContent = '';
    renderTeams(currentTeams);
    updateSectionVisibility();
  };

  if (scheduleActive) {
    showConfirm(
      'Teams neu generieren? Spielplan und alle eingetragenen Ergebnisse dieser Runde gehen verloren.',
      doGenerate
    );
  } else {
    doGenerate();
  }
}

function renderTeams(teams) {
  const container = document.getElementById('teams-container');
  container.innerHTML = '';
  teams.forEach((team, i) => {
    const color = TEAM_COLORS[i % TEAM_COLORS.length];
    const card  = document.createElement('div');
    card.className = 'team-card';
    card.style.borderLeftColor = color;
    const title = document.createElement('h3');
    title.textContent = `Team ${i + 1}`;
    title.style.color = color;
    const members = document.createElement('p');
    members.textContent = team.length === 1 ? `${team[0]} (Einzel)` : team.join(' & ');
    card.appendChild(title);
    card.appendChild(members);
    container.appendChild(card);
  });
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function teamBadge(teamIndex, teams, helperName = null) {
  const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
  const span  = document.createElement('span');
  span.className = 'team-badge';
  span.style.backgroundColor = hexToRgba(color, 0.13);
  span.style.color = color;
  span.style.border = `1.5px solid ${hexToRgba(color, 0.3)}`;
  if (helperName) {
    span.appendChild(document.createTextNode(`Team ${teamIndex + 1} (${teams[teamIndex][0]} + `));
    const helperEl = document.createElement('span');
    helperEl.className = 'helper-name';
    helperEl.textContent = helperName;
    span.appendChild(helperEl);
    span.appendChild(document.createTextNode(')'));
  } else {
    span.textContent = `Team ${teamIndex + 1} (${teams[teamIndex].join(' & ')})`;
  }
  return span;
}

// ============================================================
// SCHEDULE
// ============================================================

function generateSchedule(teams) {
  const doGenerate = () => {
    const container = document.getElementById('schedule-container');
    container.innerHTML = '';
    document.getElementById('section-table').classList.add('hidden');
    document.getElementById('end-round-area').classList.add('hidden');
    document.getElementById('post-round-overlay').classList.add('hidden');

    if (teams.length < 2) {
      container.innerHTML =
        '<p class="message">Mindestens 2 Teams erforderlich. Bitte zuerst Teams generieren.</p>';
      return;
    }

    // Build all unique pairs
    const pairs = [];
    for (let i = 0; i < teams.length; i++)
      for (let j = i + 1; j < teams.length; j++)
        pairs.push([i, j]);

    // Queue-based rotation: avoid same team back-to-back
    const scheduled = [];
    const remaining = [...pairs];
    let lastUsed    = new Set();
    while (remaining.length > 0) {
      let picked = null, pickedIdx = -1;
      for (let i = 0; i < remaining.length; i++) {
        const [a, b] = remaining[i];
        if (!lastUsed.has(a) && !lastUsed.has(b)) { picked = remaining[i]; pickedIdx = i; break; }
      }
      if (picked === null) { picked = remaining[0]; pickedIdx = 0; }
      scheduled.push(picked);
      remaining.splice(pickedIdx, 1);
      lastUsed = new Set(picked);
    }

    // Assign helpers for solo team
    const soloTeamIndex = teams.findIndex(t => t.length === 1);
    const usedHelpers   = new Set();

    currentMatches = scheduled.map(([a, b]) => {
      const match = { teamA: a, teamB: b, helper: null, scoreA: '', scoreB: '' };
      if (soloTeamIndex !== -1 && (a === soloTeamIndex || b === soloTeamIndex)) {
        const restingIndices = teams.map((_, i) => i).filter(i => i !== a && i !== b);
        let candidates = restingIndices.flatMap(i => teams[i].filter(p => !usedHelpers.has(p)));
        if (candidates.length === 0) {
          usedHelpers.clear();
          candidates = restingIndices.flatMap(i => teams[i]);
        }
        if (candidates.length > 0) {
          const helper = candidates[Math.floor(Math.random() * candidates.length)];
          usedHelpers.add(helper);
          match.helper = helper;
        }
      }
      return match;
    });

    scheduleActive = true;
    document.getElementById('btn-end-round').textContent =
      quickMode ? '✓ Runde beenden' : '✓ Runde beenden & speichern';
    renderSchedule(teams);
    updateRoundLabel();
    updateRoundIndicator();
    document.getElementById('section-table').classList.remove('hidden');
    document.getElementById('end-round-area').classList.remove('hidden');
    document.getElementById('end-round-msg').classList.add('hidden');
    updateStandings();
    updateSectionVisibility();
  };

  if (scheduleActive) {
    showConfirm(
      'Spielplan neu erstellen? Alle eingetragenen Ergebnisse dieser Runde gehen verloren.',
      doGenerate
    );
  } else {
    doGenerate();
  }
}

function updateRoundLabel() {
  document.getElementById('round-label').textContent = `Runde ${currentRoundNumber}`;
}

function renderSchedule(teams) {
  const container     = document.getElementById('schedule-container');
  container.innerHTML = '';
  const soloTeamIndex = teams.findIndex(t => t.length === 1);

  currentMatches.forEach((match, i) => {
    const helperA = (soloTeamIndex !== -1 && match.teamA === soloTeamIndex) ? match.helper : null;
    const helperB = (soloTeamIndex !== -1 && match.teamB === soloTeamIndex) ? match.helper : null;

    const div = document.createElement('div');
    div.className = 'match';

    const num = document.createElement('span');
    num.className   = 'match-num';
    num.textContent = `#${i + 1}`;

    const body = document.createElement('div');
    body.className = 'match-body';

    const sideA = document.createElement('div');
    sideA.className = 'match-side-a';
    sideA.appendChild(teamBadge(match.teamA, teams, helperA));
    sideA.appendChild(createScoreInput(match.scoreA, val => { currentMatches[i].scoreA = val; updateStandings(); }));

    const colon = document.createElement('span');
    colon.className   = 'score-colon';
    colon.textContent = ':';

    const sideB = document.createElement('div');
    sideB.className = 'match-side-b';
    sideB.appendChild(createScoreInput(match.scoreB, val => { currentMatches[i].scoreB = val; updateStandings(); }));
    sideB.appendChild(teamBadge(match.teamB, teams, helperB));

    body.appendChild(sideA);
    body.appendChild(colon);
    body.appendChild(sideB);

    div.appendChild(num);
    div.appendChild(body);
    container.appendChild(div);
  });
}

function createScoreInput(initialValue, onChange) {
  const input    = document.createElement('input');
  input.type     = 'number';
  input.min      = '0';
  input.className = 'score-input';
  input.placeholder = '0';
  input.value    = initialValue;
  input.inputMode = 'numeric';
  input.addEventListener('input', e => onChange(e.target.value));
  return input;
}

// ============================================================
// STANDINGS
// ============================================================

function updateStandings() {
  renderStandings(computeStandings(currentTeams, currentMatches));
  updateScoreValidation();
}

function computeStandings(teams, matches) {
  const stats = teams.map((team, i) => ({
    teamIndex: i, team, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0,
  }));

  matches.forEach(match => {
    const sA = parseInt(match.scoreA);
    const sB = parseInt(match.scoreB);
    if (isNaN(sA) || isNaN(sB) || match.scoreA === '' || match.scoreB === '') return;
    stats[match.teamA].pointsFor     += sA;
    stats[match.teamA].pointsAgainst += sB;
    stats[match.teamB].pointsFor     += sB;
    stats[match.teamB].pointsAgainst += sA;
    if (sA > sB)      { stats[match.teamA].wins++;   stats[match.teamB].losses++; }
    else if (sB > sA) { stats[match.teamB].wins++;   stats[match.teamA].losses++; }
  });

  stats.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const h2h = getH2H(a.teamIndex, b.teamIndex, matches);
    if (h2h !== 0) return -h2h;
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
  });
  return stats;
}

function getH2H(teamA, teamB, matches) {
  for (const m of matches) {
    let sA, sB;
    if      (m.teamA === teamA && m.teamB === teamB) { sA = parseInt(m.scoreA); sB = parseInt(m.scoreB); }
    else if (m.teamA === teamB && m.teamB === teamA) { sA = parseInt(m.scoreB); sB = parseInt(m.scoreA); }
    else continue;
    if (!isNaN(sA) && !isNaN(sB)) return sA > sB ? 1 : sB > sA ? -1 : 0;
  }
  return 0;
}

function renderStandings(standings) {
  const container  = document.getElementById('standings-container');
  const table      = document.createElement('table');
  table.className  = 'standings-table';
  table.innerHTML  = `<thead><tr>
    <th>#</th><th>Team</th><th>S</th><th>N</th><th>+</th><th>−</th><th>Diff</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');
  standings.forEach((row, i) => {
    const color = TEAM_COLORS[row.teamIndex % TEAM_COLORS.length];
    const diff  = row.pointsFor - row.pointsAgainst;
    const tr    = document.createElement('tr');
    tr.innerHTML = `
      <td class="rank">${i + 1}</td>
      <td>
        <span class="table-team-badge" style="background:${color}">T${row.teamIndex + 1}</span>
        <span class="table-team-members">${row.team.join(' & ')}</span>
      </td>
      <td class="stat-cell win">${row.wins}</td>
      <td class="stat-cell loss">${row.losses}</td>
      <td class="stat-cell">${row.pointsFor}</td>
      <td class="stat-cell">${row.pointsAgainst}</td>
      <td class="stat-cell ${diff >= 0 ? 'positive' : 'negative'}">${diff > 0 ? '+' : ''}${diff}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
}

// ============================================================
// ROUND MANAGEMENT
// ============================================================

function finalizeMatch(m) {
  const sA = parseInt(m.scoreA);
  const sB = parseInt(m.scoreB);
  return { teamA: m.teamA, teamB: m.teamB, helper: m.helper,
    scoreA: isNaN(sA) ? null : sA, scoreB: isNaN(sB) ? null : sB };
}

function isValidScore(a, b) {
  const w = Math.max(a, b), l = Math.min(a, b);
  return (w === 11 && l <= 9) || (w >= 12 && l === w - 2);
}

function updateScoreValidation() {
  document.querySelectorAll('.match').forEach((div, i) => {
    const m = currentMatches[i];
    if (!m) return;
    const aFilled = m.scoreA !== '' && !isNaN(parseInt(m.scoreA));
    const bFilled = m.scoreB !== '' && !isNaN(parseInt(m.scoreB));
    const bothFilled = aFilled && bFilled;
    const valid = !bothFilled || isValidScore(parseInt(m.scoreA), parseInt(m.scoreB));
    div.classList.toggle('match--invalid', bothFilled && !valid);
  });
}

function endRound() {
  const missing = currentMatches.filter(
    m => m.scoreA === '' || m.scoreB === '' ||
         isNaN(parseInt(m.scoreA)) || isNaN(parseInt(m.scoreB))
  );
  const invalid = currentMatches.filter(
    m => m.scoreA !== '' && m.scoreB !== '' &&
         !isNaN(parseInt(m.scoreA)) && !isNaN(parseInt(m.scoreB)) &&
         !isValidScore(parseInt(m.scoreA), parseInt(m.scoreB))
  );
  if (missing.length > 0) {
    showEndRoundMsg(`Noch ${missing.length} Ergebnis${missing.length > 1 ? 'se' : ''} fehlen.`);
    return;
  }
  if (invalid.length > 0) {
    showEndRoundMsg(`${invalid.length} ungültige${invalid.length > 1 ? '' : 's'} Ergebnis${invalid.length > 1 ? 'se' : ''}.`);
    return;
  }
  // Record pairings used this round
  currentTeams.forEach(team => {
    if (team.length === 2) sessionPairings.add(pairingKey(team[0], team[1]));
  });
  // Save round
  currentRounds.push({
    teams:   currentTeams.map(t => [...t]),
    matches: currentMatches.map(finalizeMatch),
  });
  currentRoundNumber++;
  scheduleActive = false;

  document.getElementById('section-table').classList.add('hidden');
  document.getElementById('end-round-area').classList.add('hidden');
  updateSectionVisibility();
  updateRoundIndicator();
  updateHomeBanner();
  populatePostRoundModal();
  document.getElementById('post-round-overlay').classList.remove('hidden');
}

function showEndRoundMsg(msg) {
  const el = document.getElementById('end-round-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

function populatePostRoundModal() {
  const round  = currentRounds[currentRounds.length - 1];
  const winner = getRoundWinner(round);

  const winnerEl = document.getElementById('post-round-winner');
  if (!winner) {
    winnerEl.innerHTML = '<span class="post-round-congrats">Unentschieden! 🤝</span>';
  } else {
    const color = TEAM_COLORS[winner.teamIndex % TEAM_COLORS.length];
    winnerEl.innerHTML = `
      <span class="post-round-congrats">🏆 Glückwunsch!</span>
      <div class="post-round-winner-row">
        <span class="table-team-badge" style="background:${color}">T${winner.teamIndex + 1}</span>
        <span class="post-round-winner-name">${winner.team.join(' & ')}</span>
      </div>`;
  }

  const tbody     = document.getElementById('post-round-standings');
  tbody.innerHTML = '';
  computeStandings(round.teams, round.matches).forEach((row, i) => {
    const color = TEAM_COLORS[row.teamIndex % TEAM_COLORS.length];
    const diff  = row.pointsFor - row.pointsAgainst;
    const tr    = document.createElement('tr');
    tr.innerHTML = `
      <td class="rank">${i + 1}</td>
      <td>
        <span class="table-team-badge" style="background:${color}">T${row.teamIndex + 1}</span>
        <span class="table-team-members">${row.team.join(' & ')}</span>
      </td>
      <td class="stat-cell win">${row.wins}</td>
      <td class="stat-cell loss">${row.losses}</td>
      <td class="stat-cell ${diff >= 0 ? 'positive' : 'negative'}">${diff > 0 ? '+' : ''}${diff}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('btn-end-session').textContent =
    quickMode ? 'Quick Match beenden' : 'Spieltag beenden';
}

function startNewRoundSameTeams() {
  currentMatches = [];
  document.getElementById('post-round-overlay').classList.add('hidden');
  renderTeams(currentTeams);
  generateSchedule(currentTeams);
  document.getElementById('section-schedule').scrollIntoView({ behavior: 'smooth' });
}

function startNewRoundNewTeams() {
  currentTeams   = [];
  currentMatches = [];
  scheduleActive = false;
  document.getElementById('post-round-overlay').classList.add('hidden');
  document.getElementById('section-table').classList.add('hidden');
  document.getElementById('teams-container').innerHTML    = '';
  document.getElementById('schedule-container').innerHTML = '';
  document.getElementById('round-label').textContent      = '';
  updateSectionVisibility();
  renderPlayers();
  renderKnownPlayers();
  updateRoundIndicator();
  document.getElementById('section-players').scrollIntoView({ behavior: 'smooth' });
}

function endSession() {
  const saved = currentRounds.length;
  if (scheduleActive) {
    const msg = quickMode
      ? 'Runde abbrechen? Nichts wird gespeichert.'
      : saved > 0
        ? `Runde abbrechen? Die laufende Runde wird verworfen — ${saved} abgeschlossene Runde(n) werden gespeichert.`
        : 'Runde abbrechen? Nichts wird gespeichert.';
    showConfirm(msg, performEndSession, 'Ja, abbrechen');
  } else if (saved > 0) {
    const msg = quickMode
      ? 'Quick Match beenden? Nichts wird gespeichert.'
      : `Neue Runde abbrechen? Spieltag mit ${saved} Runde(n) wird gespeichert.`;
    showConfirm(msg, performEndSession, 'Ja, beenden');
  } else {
    performEndSession();
  }
}

let _summaryRounds  = [];
let _summaryWasQuick = false;

function performEndSession() {
  document.getElementById('post-round-overlay').classList.add('hidden');
  _summaryRounds   = [...currentRounds];
  _summaryWasQuick = quickMode;
  if (_summaryRounds.length > 0) {
    showSessionSummary();
  } else {
    finalizeSession();
  }
}

function finalizeSession() {
  if (_summaryRounds.length > 0 && !_summaryWasQuick) {
    db.sessions.push({ id: Date.now(), date: new Date().toISOString().slice(0, 10), rounds: _summaryRounds });
    saveDB();
  }
  resetGameState();
  switchTab('home');
  renderLastSession();
  if (_summaryRounds.length > 0 && !_summaryWasQuick) {
    setTimeout(() => showSessionSavedModal(_summaryRounds.length), 80);
  }
}

function computeSessionPlayerStats(rounds) {
  const map = {};
  rounds.forEach(round => {
    computeStandings(round.teams, round.matches).forEach(row => {
      row.team.forEach(player => {
        if (!map[player]) map[player] = { wins: 0, losses: 0, played: 0, pFor: 0, pAgainst: 0 };
        map[player].wins    += row.wins;
        map[player].losses  += row.losses;
        map[player].played  += row.wins + row.losses;
        map[player].pFor    += row.pointsFor;
        map[player].pAgainst += row.pointsAgainst;
      });
    });
  });
  return Object.entries(map).map(([name, s]) => ({
    name,
    wins: s.wins,
    losses: s.losses,
    played: s.played,
    winRate: s.played > 0 ? s.wins / s.played : 0,
    diff: s.pFor - s.pAgainst,
  }));
}

function renderSummaryStats(sortKey) {
  const MEDALS = ['🥇', '🥈', '🥉'];
  const players = computeSessionPlayerStats(_summaryRounds)
    .sort((a, b) => sortKey === 'wins'
      ? b.wins - a.wins || b.winRate - a.winRate
      : b.winRate - a.winRate || b.wins - a.wins);

  const container = document.getElementById('summary-stats-container');
  if (!players.length) { container.innerHTML = '<p class="message">Keine Daten.</p>'; return; }

  const table = document.createElement('table');
  table.className = 'stats-table';
  table.innerHTML = `<thead><tr>
    <th class="rank-th"></th><th style="text-align:left">Name</th>
    <th>Sp</th><th>S</th><th>N</th><th>Quote</th><th>Diff</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');
  players.forEach((p, i) => {
    const diff = p.diff;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="stat-rank">${MEDALS[i] ?? i + 1}</td>
      <td>${p.name}</td>
      <td>${p.played}</td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${p.played > 0 ? Math.round(p.winRate * 100) + '%' : '—'}</td>
      <td class="${diff >= 0 ? 'positive' : 'negative'}">${diff > 0 ? '+' : ''}${diff}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
}

function getRoundWinners(round) {
  const standings = computeStandings(round.teams, round.matches);
  if (!standings.length) return [];
  const first = standings[0];
  return standings.filter(s =>
    s.wins === first.wins &&
    getH2H(first.teamIndex, s.teamIndex, round.matches) === 0 &&
    (s.pointsFor - s.pointsAgainst) === (first.pointsFor - first.pointsAgainst)
  );
}

function showSessionSummary() {
  document.getElementById('session-summary-title').textContent =
    (_summaryWasQuick ? '⚡ Quick Match' : 'Spieltag') + ' · Zusammenfassung';

  const roundsEl = document.getElementById('summary-rounds');
  roundsEl.innerHTML = _summaryRounds.map((round, i) => {
    const winners = getRoundWinners(round);
    const isTie   = winners.length > 1;
    const label   = winners.length ? winners.map(w => w.team.join(' & ')).join(' vs. ') : '—';
    return `<div class="summary-round-row">
      <span class="summary-round-num">Runde ${i + 1}</span>
      <span class="summary-round-winner${isTie ? ' summary-round-tie' : ''}">${label}${isTie ? ' <span class="tie-badge">Gleichstand</span>' : ''}</span>
    </div>`;
  }).join('');

  renderSummaryStats(document.getElementById('summary-sort-select').value);
  document.getElementById('session-summary-overlay').classList.remove('hidden');
}

function showSessionSavedModal(roundCount) {
  document.getElementById('session-saved-rounds').textContent =
    `${roundCount} Runde${roundCount !== 1 ? 'n' : ''} gespeichert und synchronisiert.`;
  document.getElementById('session-saved-overlay').classList.remove('hidden');
}

function resetGameState() {
  currentPlayers     = [];
  currentTeams       = [];
  currentMatches     = [];
  currentRounds      = [];
  currentRoundNumber = 1;
  sessionPairings    = new Set();
  scheduleActive     = false;
  quickMode          = false;

  document.getElementById('teams-container').innerHTML    = '';
  document.getElementById('schedule-container').innerHTML = '';
  document.getElementById('standings-container').innerHTML = '';
  document.getElementById('section-table').classList.add('hidden');
  document.getElementById('end-round-area').classList.add('hidden');
  document.getElementById('post-round-overlay').classList.add('hidden');
  document.getElementById('round-indicator').classList.add('hidden');
  document.getElementById('round-label').textContent = '';
  renderPlayers();
  renderKnownPlayers();
  updateHomeBanner();
  showSpieltagIdle();
}

function updateRoundIndicator() {
  const indicator = document.getElementById('round-indicator');
  indicator.classList.remove('hidden');
  indicator.classList.toggle('round-indicator--quick', quickMode);
  document.getElementById('round-indicator-label').textContent = `Runde ${currentRoundNumber}`;
  document.getElementById('btn-end-session-indicator').textContent = quickMode ? 'Beenden' : 'Abbrechen';
  const savedBadge = document.getElementById('round-indicator-saved');
  const quickBadge = document.getElementById('quick-mode-badge');
  if (quickMode) {
    savedBadge.classList.add('hidden');
    quickBadge.classList.remove('hidden');
  } else {
    quickBadge.classList.add('hidden');
    if (currentRounds.length > 0) {
      savedBadge.textContent = `✓ ${currentRounds.length}`;
      savedBadge.classList.remove('hidden');
    } else {
      savedBadge.classList.add('hidden');
    }
  }
}

function updateHomeBanner() {
  const active = currentRounds.length > 0 || scheduleActive;
  const banner = document.getElementById('active-session-banner');
  banner.classList.toggle('hidden', !active);
  if (active) {
    document.getElementById('active-session-text').textContent = quickMode
      ? `⚡ Quick Match · ${currentRounds.length} Runde(n)`
      : `Aktiver Spieltag · ${currentRounds.length} Runde(n) gespeichert`;
  }
}

// ============================================================
// HOME EXTRAS (greeting + last session)
// ============================================================

function getGreeting() {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2, '0');
  const m   = String(now.getMinutes()).padStart(2, '0');
  return `Hi! Es ist ${h}:${m} Uhr — ab anne Platte!`;
}

function formatSessionDate(isoDate) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (isoDate === today)     return 'Heute';
  if (isoDate === yesterday) return 'Gestern';
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}

function renderLastSession() {
  const section   = document.getElementById('section-last-session');
  const container = document.getElementById('last-session-container');
  if (!db.sessions.length) { section.classList.add('hidden'); return; }
  const last    = db.sessions[db.sessions.length - 1];
  const players = computeSessionPlayerStats([last])
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)
    .slice(0, 3);
  const MEDALS  = ['🥇', '🥈', '🥉'];
  const rounds  = last.rounds?.length ?? 0;
  container.innerHTML = `
    <p class="last-session-date">${formatSessionDate(last.date)} · ${rounds} Runde${rounds !== 1 ? 'n' : ''}</p>
    <div class="last-session-top">
      ${players.map((p, i) => `<span>${MEDALS[i]} ${p.name}</span>`).join('')}
    </div>`;
  section.classList.remove('hidden');
}

function updateHomeExtras() {
  if (!dbReady) return;
  document.getElementById('greeting-text').textContent = getGreeting();
  document.getElementById('section-greeting').classList.remove('hidden');
  renderLastSession();
}

// ============================================================
// QUICK MODE
// ============================================================

function backToPathChooser() {
  showConfirm('Wirklich zurück? Alle Änderungen werden verworfen.', () => {
    resetGameState();
    doSwitchTab('home');
  }, 'Ja, zurück');
}

function showSpieltagIdle() {
  document.getElementById('section-spieltag-idle').classList.remove('hidden');
  document.getElementById('section-players').classList.add('hidden');
  document.getElementById('section-teams').classList.add('hidden');
  document.getElementById('section-schedule').classList.add('hidden');
  document.getElementById('btn-back-to-chooser').classList.add('hidden');
  setModeIndicator(null);
}

function updateSectionVisibility() {
  const idle = document.getElementById('section-spieltag-idle');
  if (!idle.classList.contains('hidden')) return;
  document.getElementById('section-players').classList.toggle('hidden', scheduleActive);
  document.getElementById('section-teams').classList.toggle('hidden', scheduleActive);
  document.getElementById('section-schedule').classList.toggle('hidden', currentTeams.length === 0);
}

function startSessionPath() {
  document.getElementById('section-spieltag-idle').classList.add('hidden');
  document.getElementById('btn-back-to-chooser').classList.remove('hidden');
  document.getElementById('section-players').classList.remove('hidden');
  document.getElementById('section-teams').classList.remove('hidden');
  document.getElementById('section-schedule').classList.add('hidden');
  setModeIndicator('session');
}

function startQuickPath() {
  quickMode = true;
  document.getElementById('known-players-row').classList.add('hidden');
  document.getElementById('section-spieltag-idle').classList.add('hidden');
  document.getElementById('btn-back-to-chooser').classList.remove('hidden');
  document.getElementById('section-players').classList.remove('hidden');
  document.getElementById('section-teams').classList.remove('hidden');
  document.getElementById('section-schedule').classList.add('hidden');
  setModeIndicator('quick');
}

// ============================================================
// GAME START
// ============================================================

function pulseHeaderIcon() {
  const icon = document.querySelector('.header-icon');
  if (!icon) return;
  icon.classList.remove('icon-pulse');
  void icon.offsetWidth;
  icon.classList.add('icon-pulse');
}

function animateHomeCards() {
  const container = document.querySelector('#tab-home .container');
  if (!container) return;
  [...container.children]
    .filter(el => !el.classList.contains('hidden'))
    .forEach((el, i) => {
      el.style.animationDelay = `${i * 0.07}s`;
      el.classList.remove('card-enter');
      void el.offsetWidth;
      el.classList.add('card-enter');
    });
}

function setModeIndicator(mode) {
  const el   = document.getElementById('mode-indicator');
  const text = document.getElementById('mode-indicator-text');
  if (mode === 'session') {
    text.textContent = '▶ Spieltag';
    el.className = 'mode-indicator mode-session';
  } else if (mode === 'quick') {
    text.textContent = '⚡ Quick Match';
    el.className = 'mode-indicator mode-quick';
  } else {
    el.className = 'mode-indicator hidden';
  }
}

function startGame() {
  const doStart = () => {
    pulseHeaderIcon();
    resetGameState();
    doSwitchTab('spieltag');
    startSessionPath();
  };
  if (currentRounds.length > 0 || scheduleActive) {
    showConfirm('Neuen Spieltag starten? Der aktuelle Spieltag wird verworfen.', doStart);
    return;
  }
  doStart();
}

function startQuickFromHome() {
  const doStart = () => {
    pulseHeaderIcon();
    resetGameState();
    doSwitchTab('spieltag');
    startQuickPath();
  };
  if (currentRounds.length > 0 || scheduleActive) {
    showConfirm('Quick Match starten? Der aktuelle Spieltag wird verworfen.', doStart);
    return;
  }
  doStart();
}

// ============================================================
// ROUND HISTORY OVERLAY
// ============================================================

function getRoundWinner(round) {
  const standings = computeStandings(round.teams, round.matches);
  if (!standings.length) return null;
  const top = standings[0];
  const second = standings[1];
  if (second && top.wins === second.wins &&
      (top.pointsFor - top.pointsAgainst) === (second.pointsFor - second.pointsAgainst)) {
    return null; // draw
  }
  return top;
}

function showRoundsHistory() {
  const list = document.getElementById('rounds-history-list');
  list.innerHTML = '';

  if (currentRounds.length === 0) {
    list.innerHTML = '<p class="message">Noch keine Runden beendet.</p>';
  } else {
    currentRounds.forEach((round, i) => {
      const row = document.createElement('div');
      row.className = 'rounds-history-row';

      const label = document.createElement('span');
      label.className = 'rounds-history-round-label';
      label.textContent = `Runde ${i + 1}`;

      const winner = getRoundWinner(round);
      const winnerEl = document.createElement('span');
      winnerEl.className = 'rounds-history-winner';

      if (!winner) {
        winnerEl.textContent = 'Unentschieden';
      } else {
        const color = TEAM_COLORS[winner.teamIndex % TEAM_COLORS.length];
        const badge = document.createElement('span');
        badge.className = 'table-team-badge';
        badge.style.background = color;
        badge.textContent = `T${winner.teamIndex + 1}`;
        winnerEl.appendChild(badge);
        const names = document.createElement('span');
        names.textContent = ` ${winner.team.join(' & ')}  ·  ${winner.wins}:${winner.losses}`;
        winnerEl.appendChild(names);
      }

      row.appendChild(label);
      row.appendChild(winnerEl);
      list.appendChild(row);
    });
  }

  document.getElementById('rounds-history-overlay').classList.remove('hidden');
}

// ============================================================
// STATISTICS
// ============================================================

function normalizeSessionRounds(session) {
  return session.rounds ?? [{ teams: session.teams, matches: session.matches }];
}

function computePlayerStats(sessions) {
  const stats = {};
  function get(name) {
    if (!stats[name]) stats[name] = {
      name, sessionIds: new Set(),
      matches: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0,
    };
    return stats[name];
  }
  sessions.forEach(session => {
    normalizeSessionRounds(session).forEach(round => {
      round.matches.forEach(match => {
        const sA = parseInt(match.scoreA);
        const sB = parseInt(match.scoreB);
        if (isNaN(sA) || isNaN(sB)) return;
        const playersA = [...round.teams[match.teamA]];
        const playersB = [...round.teams[match.teamB]];
        if (match.helper) {
          if (playersA.length === 1) playersA.push(match.helper);
          else if (playersB.length === 1) playersB.push(match.helper);
        }
        const aWon = sA > sB;
        playersA.forEach(name => {
          const s = get(name);
          s.sessionIds.add(session.id);
          s.matches++; s.pointsFor += sA; s.pointsAgainst += sB;
          if (aWon) s.wins++; else s.losses++;
        });
        playersB.forEach(name => {
          const s = get(name);
          s.sessionIds.add(session.id);
          s.matches++; s.pointsFor += sB; s.pointsAgainst += sA;
          if (!aWon) s.wins++; else s.losses++;
        });
      });
    });
  });
  return Object.values(stats)
    .map(s => ({ ...s, sessions: s.sessionIds.size,
      winRate: s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 0,
      diff: s.pointsFor - s.pointsAgainst }))
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
}

function renderHistorie() {
  const container = document.getElementById('historie-container');
  if (db.sessions.length === 0) {
    container.innerHTML = '<p class="message">Noch keine Spieltage gespeichert.</p>';
    return;
  }
  container.innerHTML = '';
  [...db.sessions].reverse().forEach(session => {
    const rounds = normalizeSessionRounds(session);
    const block  = document.createElement('div');
    block.className = 'historie-session';

    const header = document.createElement('div');
    header.className = 'historie-session-header';
    const dateEl = document.createElement('span');
    dateEl.className   = 'historie-session-date';
    dateEl.textContent = new Date(session.date).toLocaleDateString('de-DE',
      { day: '2-digit', month: '2-digit', year: 'numeric' });
    const roundsEl = document.createElement('span');
    roundsEl.className   = 'historie-session-rounds';
    roundsEl.textContent = `${rounds.length} Runde${rounds.length !== 1 ? 'n' : ''}`;
    header.appendChild(dateEl);
    header.appendChild(roundsEl);
    block.appendChild(header);

    rounds.forEach((round, i) => {
      const row    = document.createElement('div');
      row.className = 'historie-round';

      const label = document.createElement('span');
      label.className   = 'historie-round-label';
      label.textContent = `Runde ${i + 1}`;

      const winner = getRoundWinner(round);
      const winnerEl = document.createElement('span');
      winnerEl.className = 'historie-winner';

      if (!winner) {
        winnerEl.textContent = 'Unentschieden';
      } else {
        const color = TEAM_COLORS[winner.teamIndex % TEAM_COLORS.length];
        const badge = document.createElement('span');
        badge.className = 'table-team-badge';
        badge.style.background = color;
        badge.textContent = `T${winner.teamIndex + 1}`;
        winnerEl.appendChild(badge);
        const names = document.createTextNode(` ${winner.team.join(' & ')}  ·  ${winner.wins}:${winner.losses}`);
        winnerEl.appendChild(names);
      }

      row.appendChild(label);
      row.appendChild(winnerEl);
      block.appendChild(row);
    });

    container.appendChild(block);
  });
}

function computeTeamPairStats(sessions) {
  const stats = {};
  sessions.forEach(session => {
    normalizeSessionRounds(session).forEach(round => {
      round.matches.forEach(match => {
        const sA = parseInt(match.scoreA), sB = parseInt(match.scoreB);
        if (isNaN(sA) || isNaN(sB)) return;
        [
          { team: round.teams[match.teamA], scored: sA, conceded: sB },
          { team: round.teams[match.teamB], scored: sB, conceded: sA },
        ].forEach(({ team, scored, conceded }) => {
          if (team.length !== 2) return;
          const key = [...team].sort().join('|||');
          if (!stats[key]) stats[key] = { names: [...team].sort(), wins: 0, losses: 0, matches: 0 };
          stats[key].matches++;
          if (scored > conceded) stats[key].wins++; else stats[key].losses++;
        });
      });
    });
  });
  return Object.values(stats).map(s => ({
    ...s,
    winRate: s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 0,
  }));
}

function renderTopTeams() {
  const container = document.getElementById('team-pairs-container');
  if (!container) return;
  if (db.sessions.length === 0) {
    container.innerHTML = '<p class="message">Noch keine Daten gespeichert.</p>';
    return;
  }
  const pairs = computeTeamPairStats(db.sessions);
  if (pairs.length === 0) {
    container.innerHTML = '<p class="message">Noch keine 2er-Teams gespielt.</p>';
    return;
  }

  const sortKey = document.getElementById('duos-sort-select')?.value || 'wins';
  const sorted = [...pairs].sort(
    sortKey === 'wins'
      ? (a, b) => b.wins - a.wins || b.winRate - a.winRate
      : (a, b) => b.winRate - a.winRate || b.wins - a.wins
  ).slice(0, 3);

  const MEDALS = ['🥇', '🥈', '🥉'];
  const ROW_COLORS = ['duo-gold', 'duo-silver', 'duo-bronze'];

  const table = document.createElement('table');
  table.className = 'stats-table duos-table';
  table.innerHTML = `<thead><tr>
    <th class="rank-th"></th><th>Duo</th><th title="Spiele">Sp</th>
    <th>S</th><th>Quote</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');
  sorted.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.className = ROW_COLORS[i] || '';
    tr.innerHTML = `
      <td class="stat-rank">${MEDALS[i]}</td>
      <td class="player-name">${p.names.join(' & ')}</td>
      <td class="stat-cell muted">${p.matches}</td>
      <td class="stat-cell win">${p.wins}</td>
      <td class="stat-cell">${p.winRate}%</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
}

function renderStats() {
  const container = document.getElementById('stats-container');
  if (db.sessions.length === 0) {
    container.innerHTML = '<p class="message">Noch keine Daten gespeichert.</p>';
    renderTopTeams();
    return;
  }
  const sortKey = document.getElementById('stats-sort-select')?.value || 'winRate';
  const players = computePlayerStats(db.sessions);
  if (sortKey === 'wins') {
    players.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
  }
  const table   = document.createElement('table');
  table.className = 'stats-table';
  table.innerHTML = `<thead><tr>
    <th class="rank-th"></th><th>Spieler</th><th title="Spiele">Sp</th>
    <th>S</th><th>N</th><th>Quote</th><th>Diff</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');
  players.forEach((p, i) => {
    const rankDisplay = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="stat-rank">${rankDisplay}</td>
      <td class="player-name">${p.name}</td>
      <td class="stat-cell muted">${p.matches}</td>
      <td class="stat-cell win">${p.wins}</td>
      <td class="stat-cell loss">${p.losses}</td>
      <td class="stat-cell">${p.winRate}%</td>
      <td class="stat-cell ${p.diff >= 0 ? 'positive' : 'negative'}">${p.diff > 0 ? '+' : ''}${p.diff}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
  renderTopTeams();
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

// Help
document.getElementById('help-btn').addEventListener('click', () =>
  document.getElementById('help-overlay').classList.remove('hidden')
);
document.getElementById('help-close').addEventListener('click', () =>
  document.getElementById('help-overlay').classList.add('hidden')
);
document.getElementById('help-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) document.getElementById('help-overlay').classList.add('hidden');
});

// Rounds history
document.getElementById('round-indicator-saved').addEventListener('click', showRoundsHistory);
document.getElementById('rounds-history-close').addEventListener('click', () =>
  document.getElementById('rounds-history-overlay').classList.add('hidden')
);
document.getElementById('rounds-history-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget)
    document.getElementById('rounds-history-overlay').classList.add('hidden');
});

// Confirm modal
document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
document.getElementById('confirm-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeConfirm();
});

// Home
document.getElementById('start-game-btn').addEventListener('click', startGame);
document.getElementById('start-quick-btn').addEventListener('click', startQuickFromHome);
document.getElementById('session-info-btn').addEventListener('click', () =>
  document.getElementById('session-info-overlay').classList.remove('hidden')
);
document.getElementById('session-info-close').addEventListener('click', () =>
  document.getElementById('session-info-overlay').classList.add('hidden')
);
document.getElementById('session-info-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget)
    document.getElementById('session-info-overlay').classList.add('hidden');
});
document.getElementById('quick-info-btn').addEventListener('click', () =>
  document.getElementById('quick-info-overlay').classList.remove('hidden')
);
document.getElementById('quick-info-close').addEventListener('click', () =>
  document.getElementById('quick-info-overlay').classList.add('hidden')
);
document.getElementById('quick-info-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget)
    document.getElementById('quick-info-overlay').classList.add('hidden');
});
document.getElementById('btn-resume-session').addEventListener('click', () => switchTab('spieltag'));

// Players
document.getElementById('add-btn').addEventListener('click', addPlayer);
document.getElementById('player-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addPlayer();
});

// Teams & schedule
document.getElementById('generate-teams-btn').addEventListener('click', generateTeams);
document.getElementById('generate-schedule-btn').addEventListener('click', () =>
  generateSchedule(currentTeams)
);

// Round management
document.getElementById('btn-end-round').addEventListener('click', endRound);
document.getElementById('btn-new-round-same').addEventListener('click', () => {
  document.getElementById('post-round-overlay').classList.add('hidden');
  startNewRoundSameTeams();
});
document.getElementById('btn-new-round-new').addEventListener('click', () => {
  document.getElementById('post-round-overlay').classList.add('hidden');
  startNewRoundNewTeams();
});
document.getElementById('btn-end-session').addEventListener('click', performEndSession);
document.getElementById('btn-end-session-indicator').addEventListener('click', endSession);

// Session saved modal
document.getElementById('session-saved-close').addEventListener('click', () =>
  document.getElementById('session-saved-overlay').classList.add('hidden')
);
document.getElementById('session-saved-dismiss').addEventListener('click', () =>
  document.getElementById('session-saved-overlay').classList.add('hidden')
);
document.getElementById('session-saved-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget)
    document.getElementById('session-saved-overlay').classList.add('hidden');
});

// Stats sort
document.getElementById('stats-sort-select').addEventListener('change', renderStats);
document.getElementById('duos-sort-select').addEventListener('change', renderTopTeams);

// Info overlays
document.getElementById('stats-info-btn').addEventListener('click', () =>
  document.getElementById('stats-info-overlay').classList.remove('hidden')
);
document.getElementById('stats-info-close').addEventListener('click', () =>
  document.getElementById('stats-info-overlay').classList.add('hidden')
);
document.getElementById('stats-info-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) document.getElementById('stats-info-overlay').classList.add('hidden');
});
document.getElementById('standings-info-btn').addEventListener('click', () =>
  document.getElementById('standings-info-overlay').classList.remove('hidden')
);
document.getElementById('standings-info-close').addEventListener('click', () =>
  document.getElementById('standings-info-overlay').classList.add('hidden')
);
document.getElementById('standings-info-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) document.getElementById('standings-info-overlay').classList.add('hidden');
});
document.getElementById('teams-info-btn').addEventListener('click', () =>
  document.getElementById('teams-info-overlay').classList.remove('hidden')
);
document.getElementById('teams-info-close').addEventListener('click', () =>
  document.getElementById('teams-info-overlay').classList.add('hidden')
);
document.getElementById('teams-info-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) document.getElementById('teams-info-overlay').classList.add('hidden');
});
document.getElementById('schedule-info-btn').addEventListener('click', () =>
  document.getElementById('schedule-info-overlay').classList.remove('hidden')
);
document.getElementById('schedule-info-close').addEventListener('click', () =>
  document.getElementById('schedule-info-overlay').classList.add('hidden')
);
document.getElementById('schedule-info-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) document.getElementById('schedule-info-overlay').classList.add('hidden');
});
document.getElementById('summary-dismiss-btn').addEventListener('click', () => {
  document.getElementById('session-summary-overlay').classList.add('hidden');
  finalizeSession();
});
document.getElementById('summary-sort-select').addEventListener('change', e =>
  renderSummaryStats(e.target.value)
);
document.getElementById('btn-back-to-chooser').addEventListener('click', backToPathChooser);
document.getElementById('btn-historie-toggle').addEventListener('click', () => {
  const body = document.getElementById('historie-body');
  const chevron = document.getElementById('historie-chevron');
  const btn = document.getElementById('btn-historie-toggle');
  const isOpen = !body.classList.contains('hidden');
  body.classList.toggle('hidden', isOpen);
  chevron.classList.toggle('open', !isOpen);
  btn.setAttribute('aria-expanded', String(!isOpen));
  if (!isOpen) renderHistorie();
});

// ============================================================
// RELOAD + PULL-TO-REFRESH
// ============================================================

function triggerReload() {
  window.location.reload();
}

document.getElementById('reload-btn').addEventListener('click', triggerReload);

(function initPullToRefresh() {
  const PTR_THRESHOLD = 72;
  let startY = 0, pulling = false, triggered = false;
  const indicator = document.getElementById('ptr-indicator');

  document.addEventListener('touchstart', e => {
    if (window.scrollY === 0) { startY = e.touches[0].clientY; pulling = true; triggered = false; }
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!pulling) return;
    const dy = Math.min(e.touches[0].clientY - startY, PTR_THRESHOLD * 1.5);
    if (dy <= 0) { indicator.style.transform = ''; indicator.classList.remove('ptr-visible'); return; }
    const progress = Math.min(dy / PTR_THRESHOLD, 1);
    indicator.style.transform = `translateY(${dy * 0.55}px)`;
    indicator.classList.toggle('ptr-visible', dy > 16);
    indicator.querySelector('.ptr-spinner').style.transform = `rotate(${progress * 240}deg)`;
    triggered = progress >= 1;
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;
    indicator.style.transform = '';
    indicator.classList.remove('ptr-visible');
    indicator.querySelector('.ptr-spinner').style.transform = '';
    if (triggered) { indicator.classList.add('ptr-spinning'); triggerReload(); setTimeout(() => indicator.classList.remove('ptr-spinning'), 1200); }
  });
})();

// ============================================================
// INIT
// ============================================================

updateHomeBanner();
updateHomeState();
loadDB();

// Shrink header on scroll
const _stickyEl = document.getElementById('app-sticky');
window.addEventListener('scroll', () => {
  _stickyEl.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });
