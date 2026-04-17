// ============================================================
// CONSTANTS
// ============================================================

// Set to your shared cloud folder URL to enable cloud links (e.g. Google Drive, Dropbox)
const CLOUD_URL = 'https://www.dropbox.com/scl/fo/qxazrprybzjbs02nb18dn/AFP9C4-QS7EbRVSvFyNoiOU?rlkey=jxxjpb2o197s4eja9dtew3bvm&st=icqjyj4o&dl=0';

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
// STATE
// ============================================================

let db = loadDB();
let currentPlayers   = [];
let currentTeams     = [];
let currentMatches   = [];
let currentRounds    = [];       // rounds ended this session: [{ teams, matches }]
let currentRoundNumber = 1;
let sessionPairings  = new Set(); // player-pair keys used this session
let scheduleActive   = false;     // true while a round is in progress

// ============================================================
// DATABASE
// ============================================================

function loadDB() {
  try {
    const raw = localStorage.getItem('teqball_db');
    if (raw) return JSON.parse(raw);
    const oldPlayers = JSON.parse(localStorage.getItem('players') || '[]');
    return { players: oldPlayers, sessions: [] };
  } catch { return { players: [], sessions: [] }; }
}

function saveDB() {
  localStorage.setItem('teqball_db', JSON.stringify(db));
}

function exportDB() {
  const now  = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(':', '');
  const filename = `teqball_${date}_${time}.json`;
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showExportToast(filename);
}

function showExportToast(filename) {
  const toast = document.getElementById('export-toast');
  document.getElementById('export-toast-filename').textContent = filename;
  const cloudLink = document.getElementById('export-toast-cloud');
  if (CLOUD_URL) { cloudLink.href = CLOUD_URL; cloudLink.classList.remove('hidden'); }
  else           { cloudLink.classList.add('hidden'); }
  toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.add('hidden'), 6000);
}

function importDB(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported.players) || !Array.isArray(imported.sessions)) throw new Error();
      db = imported;
      saveDB();
      localStorage.setItem('teqball_import', JSON.stringify({ filename: file.name, ts: Date.now() }));
      renderImportStatus();
      showDbStatus('Datenbank erfolgreich importiert.');
      renderKnownPlayers();
      renderStats();
    } catch { showDbStatus('Fehler: Ungültige oder beschädigte Datei.'); }
  };
  reader.readAsText(file);
}

function renderImportStatus() {
  const el  = document.getElementById('db-quick-status');
  const raw = localStorage.getItem('teqball_import');
  if (!raw) { el.textContent = 'Keine Datei geladen'; el.classList.remove('loaded'); return; }
  const { filename, ts } = JSON.parse(raw);
  const date = new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  el.textContent = `${filename} · ${date}`;
  el.classList.add('loaded');
}

function initCloudLinks() {
  if (!CLOUD_URL) return;
  ['cloud-link-spieltag', 'cloud-link-stats'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.href = CLOUD_URL; el.classList.remove('hidden'); }
  });
}

function showDbStatus(msg) {
  const el = document.getElementById('db-status');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 3500);
}

// ============================================================
// TABS
// ============================================================

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.tab === tabId)
  );
  document.querySelectorAll('.tab-content').forEach(panel =>
    panel.classList.toggle('active', panel.id === `tab-${tabId}`)
  );
  if (tabId === 'statistiken') renderStats();
  if (tabId === 'historie')    renderHistorie();
  if (tabId === 'home')        updateHomeBanner();
}

// ============================================================
// CONFIRM / DIALOGS
// ============================================================

function showConfirm(msg, onOk) {
  document.getElementById('confirm-msg').textContent = msg;
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
  list.innerHTML = '';
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
  if (!db.players.some(p => p.toLowerCase() === name.toLowerCase())) {
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

function teamBadge(teamIndex, teams, helperName = null) {
  const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
  const span  = document.createElement('span');
  span.className = 'team-badge';
  span.style.backgroundColor = color;
  const membersText = helperName
    ? `${teams[teamIndex][0]} + ${helperName}`
    : teams[teamIndex].join(' & ');
  span.textContent = `Team ${teamIndex + 1} (${membersText})`;
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
    renderSchedule(teams);
    updateRoundLabel();
    updateRoundIndicator();
    document.getElementById('section-table').classList.remove('hidden');
    document.getElementById('end-round-area').classList.remove('hidden');
    document.getElementById('end-round-msg').classList.add('hidden');
    updateStandings();
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
    const div    = document.createElement('div');
    div.className = 'match';

    const header = document.createElement('div');
    header.className = 'match-header';

    const num = document.createElement('span');
    num.className   = 'match-num';
    num.textContent = `#${i + 1}`;

    const vs = document.createElement('span');
    vs.className   = 'match-vs';
    vs.textContent = 'vs';

    const helperA = (soloTeamIndex !== -1 && match.teamA === soloTeamIndex) ? match.helper : null;
    const helperB = (soloTeamIndex !== -1 && match.teamB === soloTeamIndex) ? match.helper : null;

    header.appendChild(num);
    header.appendChild(teamBadge(match.teamA, teams, helperA));
    header.appendChild(vs);
    header.appendChild(teamBadge(match.teamB, teams, helperB));

    const scoreRow = document.createElement('div');
    scoreRow.className = 'score-row';
    const inputA = createScoreInput(match.scoreA, val => { currentMatches[i].scoreA = val; updateStandings(); });
    const colon  = document.createElement('span');
    colon.className   = 'score-colon';
    colon.textContent = ':';
    const inputB = createScoreInput(match.scoreB, val => { currentMatches[i].scoreB = val; updateStandings(); });
    scoreRow.appendChild(inputA);
    scoreRow.appendChild(colon);
    scoreRow.appendChild(inputB);

    div.appendChild(header);
    div.appendChild(scoreRow);
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

function hasActiveRoundResult() {
  return currentMatches.some(
    m => m.scoreA !== '' && m.scoreB !== '' &&
         !isNaN(parseInt(m.scoreA)) && !isNaN(parseInt(m.scoreB))
  );
}

function endRound() {
  if (!hasActiveRoundResult()) {
    showEndRoundMsg('Bitte mindestens ein Ergebnis eintragen.');
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
  document.getElementById('post-round-overlay').classList.remove('hidden');
  updateRoundIndicator();
  updateHomeBanner();
  document.getElementById('post-round-overlay').scrollIntoView({ behavior: 'smooth' });
}

function showEndRoundMsg(msg) {
  const el = document.getElementById('end-round-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
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
  renderPlayers();
  renderKnownPlayers();
  updateRoundIndicator();
  document.getElementById('section-players').scrollIntoView({ behavior: 'smooth' });
}

function endSession() {
  if (currentRounds.length === 0) {
    document.getElementById('post-round-overlay').classList.remove('hidden'); // stay visible
    return;
  }
  showConfirm(
    `Spieltag beenden? ${currentRounds.length} Runde(n) werden in der Datenbank gespeichert.`,
    () => {
      const session = {
        id:     Date.now(),
        date:   new Date().toISOString().slice(0, 10),
        rounds: currentRounds,
      };
      db.sessions.push(session);
      saveDB();
      resetGameState();
      switchTab('statistiken');
      setTimeout(() => showDbStatus('Spieltag gespeichert! Bitte exportieren und Datei teilen.'), 200);
    }
  );
}

function resetGameState() {
  currentPlayers     = [];
  currentTeams       = [];
  currentMatches     = [];
  currentRounds      = [];
  currentRoundNumber = 1;
  sessionPairings    = new Set();
  scheduleActive     = false;

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
}

function updateRoundIndicator() {
  const el = document.getElementById('round-indicator');
  el.classList.remove('hidden');
  document.getElementById('round-indicator-label').textContent = `Runde ${currentRoundNumber}`;
  const badge = document.getElementById('round-indicator-saved');
  if (currentRounds.length > 0) {
    badge.textContent = `${currentRounds.length} gespeichert`;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function updateHomeBanner() {
  const active  = currentRounds.length > 0 || scheduleActive;
  const banner  = document.getElementById('active-session-banner');
  const startBtn = document.getElementById('start-game-btn');
  banner.classList.toggle('hidden', !active);
  if (active) {
    document.getElementById('active-session-text').textContent =
      `Aktiver Spieltag · ${currentRounds.length} Runde(n) gespeichert`;
    startBtn.textContent = 'Neuen Spieltag starten';
  } else {
    startBtn.textContent = 'Spieltag starten';
  }
}

// ============================================================
// GAME START
// ============================================================

function startGame() {
  const doStart = () => {
    resetGameState();
    switchTab('spieltag');
    document.getElementById('section-players').scrollIntoView({ behavior: 'smooth' });
  };

  // If active session: confirm discard
  if (currentRounds.length > 0 || scheduleActive) {
    showConfirm(
      'Neuen Spieltag starten? Der aktuelle, nicht gespeicherte Spieltag wird verworfen.',
      doStart
    );
    return;
  }

  // If no DB ever imported: warn
  if (!localStorage.getItem('teqball_import') && db.sessions.length === 0 && db.players.length === 0) {
    document.getElementById('no-db-overlay').classList.remove('hidden');
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

function renderStats() {
  const container = document.getElementById('stats-container');
  if (db.sessions.length === 0) {
    container.innerHTML = '<p class="message">Noch keine Daten gespeichert.</p>';
    return;
  }
  const players = computePlayerStats(db.sessions);
  const table   = document.createElement('table');
  table.className = 'stats-table';
  table.innerHTML = `<thead><tr>
    <th>Spieler</th><th title="Spieltage">ST</th><th title="Spiele">Sp</th>
    <th>S</th><th>N</th><th>Quote</th><th>Diff</th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');
  players.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="player-name">${p.name}</td>
      <td class="stat-cell muted">${p.sessions}</td>
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

// No-DB warning
document.getElementById('no-db-continue').addEventListener('click', () => {
  document.getElementById('no-db-overlay').classList.add('hidden');
  resetGameState();
  switchTab('spieltag');
});
document.getElementById('import-input-home').addEventListener('change', e => {
  if (!e.target.files[0]) return;
  importDB(e.target.files[0]);
  document.getElementById('no-db-overlay').classList.add('hidden');
  setTimeout(() => { resetGameState(); switchTab('spieltag'); }, 400);
  e.target.value = '';
});

// Home
document.getElementById('start-game-btn').addEventListener('click', startGame);
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
document.getElementById('btn-new-round-same').addEventListener('click', startNewRoundSameTeams);
document.getElementById('btn-new-round-new').addEventListener('click', startNewRoundNewTeams);
document.getElementById('btn-end-session').addEventListener('click', endSession);

// Database
document.getElementById('export-btn').addEventListener('click', exportDB);
document.getElementById('import-input').addEventListener('change', e => {
  if (e.target.files[0]) { importDB(e.target.files[0]); e.target.value = ''; }
});
document.getElementById('import-input-quick').addEventListener('change', e => {
  if (e.target.files[0]) { importDB(e.target.files[0]); e.target.value = ''; }
});

// ============================================================
// INIT
// ============================================================

renderKnownPlayers();
renderStats();
renderImportStatus();
initCloudLinks();
updateHomeBanner();
