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
// STATE
// ============================================================

let db = loadDB();          // { players: [], sessions: [] }
let currentPlayers = [];    // players chosen for this game day
let currentTeams = [];      // array of player-name arrays
let currentMatches = [];    // { teamA, teamB, helper, scoreA, scoreB }

// ============================================================
// DATABASE
// ============================================================

function loadDB() {
  try {
    const raw = localStorage.getItem('teqball_db');
    if (raw) return JSON.parse(raw);
    // Migrate old player list if it exists
    const oldPlayers = JSON.parse(localStorage.getItem('players') || '[]');
    return { players: oldPlayers, sessions: [] };
  } catch {
    return { players: [], sessions: [] };
  }
}

function saveDB() {
  localStorage.setItem('teqball_db', JSON.stringify(db));
}

function exportDB() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `teqball_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importDB(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported.players) || !Array.isArray(imported.sessions)) throw new Error();
      db = imported;
      saveDB();
      showDbStatus('Datenbank erfolgreich importiert.');
      renderKnownPlayers();
      renderStats();
    } catch {
      showDbStatus('Fehler: Ungültige oder beschädigte Datei.');
    }
  };
  reader.readAsText(file);
}

function showDbStatus(msg) {
  const el = document.getElementById('db-status');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 3000);
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
}

// ============================================================
// PLAYERS
// ============================================================

function renderKnownPlayers() {
  const row = document.getElementById('known-players-row');
  const known = db.players.filter(
    p => !currentPlayers.some(c => c.toLowerCase() === p.toLowerCase())
  );
  if (known.length === 0) {
    row.classList.add('hidden');
    return;
  }
  row.classList.remove('hidden');
  row.innerHTML = '<span class="known-label">Bekannte:</span>';
  known.forEach(name => {
    const chip = document.createElement('button');
    chip.className = 'player-chip';
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
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'btn-remove';
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
  const name = input.value.trim();
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

function generateTeams() {
  const container = document.getElementById('teams-container');
  if (currentPlayers.length < 2) {
    container.innerHTML = '<p class="message">Mindestens 2 Spieler erforderlich.</p>';
    currentTeams = [];
    return;
  }
  const shuffled = shuffle(currentPlayers);
  currentTeams = [];
  currentMatches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    currentTeams.push(shuffled.slice(i, i + 2));
  }
  document.getElementById('schedule-container').innerHTML = '';
  document.getElementById('section-table').classList.add('hidden');
  document.getElementById('save-area').classList.add('hidden');
  renderTeams(currentTeams);
}

function renderTeams(teams) {
  const container = document.getElementById('teams-container');
  container.innerHTML = '';
  teams.forEach((team, i) => {
    const color = TEAM_COLORS[i % TEAM_COLORS.length];
    const card = document.createElement('div');
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
  const span = document.createElement('span');
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
  const container = document.getElementById('schedule-container');
  container.innerHTML = '';
  document.getElementById('section-table').classList.add('hidden');
  document.getElementById('save-area').classList.add('hidden');

  if (teams.length < 2) {
    container.innerHTML =
      '<p class="message">Mindestens 2 Teams erforderlich. Bitte zuerst Teams generieren.</p>';
    return;
  }

  // Build all unique pairs
  const pairs = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push([i, j]);
    }
  }

  // Queue-based rotation: avoid same team back-to-back
  const scheduled = [];
  const remaining = [...pairs];
  let lastUsed = new Set();
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
  const usedHelpers = new Set();

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

  renderSchedule(teams);
  document.getElementById('section-table').classList.remove('hidden');
  document.getElementById('save-area').classList.remove('hidden');
  updateStandings();
}

function renderSchedule(teams) {
  const container = document.getElementById('schedule-container');
  container.innerHTML = '';
  const soloTeamIndex = teams.findIndex(t => t.length === 1);

  currentMatches.forEach((match, i) => {
    const div = document.createElement('div');
    div.className = 'match';

    // Team badges row
    const header = document.createElement('div');
    header.className = 'match-header';

    const num = document.createElement('span');
    num.className = 'match-num';
    num.textContent = `#${i + 1}`;

    const vs = document.createElement('span');
    vs.className = 'match-vs';
    vs.textContent = 'vs';

    const helperA = (soloTeamIndex !== -1 && match.teamA === soloTeamIndex) ? match.helper : null;
    const helperB = (soloTeamIndex !== -1 && match.teamB === soloTeamIndex) ? match.helper : null;

    header.appendChild(num);
    header.appendChild(teamBadge(match.teamA, teams, helperA));
    header.appendChild(vs);
    header.appendChild(teamBadge(match.teamB, teams, helperB));

    // Score inputs row
    const scoreRow = document.createElement('div');
    scoreRow.className = 'score-row';

    const inputA = createScoreInput(match.scoreA, (val) => {
      currentMatches[i].scoreA = val;
      updateStandings();
    });

    const colon = document.createElement('span');
    colon.className = 'score-colon';
    colon.textContent = ':';

    const inputB = createScoreInput(match.scoreB, (val) => {
      currentMatches[i].scoreB = val;
      updateStandings();
    });

    scoreRow.appendChild(inputA);
    scoreRow.appendChild(colon);
    scoreRow.appendChild(inputB);

    div.appendChild(header);
    div.appendChild(scoreRow);
    container.appendChild(div);
  });
}

function createScoreInput(initialValue, onChange) {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.className = 'score-input';
  input.placeholder = '0';
  input.value = initialValue;
  input.inputMode = 'numeric';
  input.addEventListener('input', (e) => onChange(e.target.value));
  return input;
}

// ============================================================
// STANDINGS
// ============================================================

function updateStandings() {
  const standings = computeStandings(currentTeams, currentMatches);
  renderStandings(standings);
}

function computeStandings(teams, matches) {
  const stats = teams.map((team, i) => ({
    teamIndex: i, team,
    wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0,
  }));

  matches.forEach(match => {
    const sA = parseInt(match.scoreA);
    const sB = parseInt(match.scoreB);
    if (isNaN(sA) || isNaN(sB) || match.scoreA === '' || match.scoreB === '') return;
    stats[match.teamA].pointsFor += sA;
    stats[match.teamA].pointsAgainst += sB;
    stats[match.teamB].pointsFor += sB;
    stats[match.teamB].pointsAgainst += sA;
    if (sA > sB) { stats[match.teamA].wins++; stats[match.teamB].losses++; }
    else if (sB > sA) { stats[match.teamB].wins++; stats[match.teamA].losses++; }
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
    if (m.teamA === teamA && m.teamB === teamB) { sA = parseInt(m.scoreA); sB = parseInt(m.scoreB); }
    else if (m.teamA === teamB && m.teamB === teamA) { sA = parseInt(m.scoreB); sB = parseInt(m.scoreA); }
    else continue;
    if (!isNaN(sA) && !isNaN(sB)) return sA > sB ? 1 : sB > sA ? -1 : 0;
  }
  return 0;
}

function renderStandings(standings) {
  const container = document.getElementById('standings-container');
  const table = document.createElement('table');
  table.className = 'standings-table';
  table.innerHTML = `<thead><tr>
    <th>#</th><th>Team</th><th>S</th><th>N</th><th>+</th><th>−</th><th>Diff</th>
  </tr></thead>`;

  const tbody = document.createElement('tbody');
  standings.forEach((row, i) => {
    const color = TEAM_COLORS[row.teamIndex % TEAM_COLORS.length];
    const diff = row.pointsFor - row.pointsAgainst;
    const tr = document.createElement('tr');
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
      <td class="stat-cell ${diff >= 0 ? 'positive' : 'negative'}">${diff > 0 ? '+' : ''}${diff}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
}

// ============================================================
// SAVE SESSION
// ============================================================

function saveSession() {
  const saveMsg = document.getElementById('save-msg');
  const hasAnyResult = currentMatches.some(
    m => m.scoreA !== '' && m.scoreB !== '' && !isNaN(parseInt(m.scoreA)) && !isNaN(parseInt(m.scoreB))
  );
  if (!hasAnyResult) {
    saveMsg.textContent = 'Bitte mindestens ein Ergebnis eintragen.';
    saveMsg.classList.remove('hidden');
    setTimeout(() => saveMsg.classList.add('hidden'), 2500);
    return;
  }

  const session = {
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    teams: currentTeams,
    matches: currentMatches.map(m => {
      const sA = parseInt(m.scoreA);
      const sB = parseInt(m.scoreB);
      return {
        teamA: m.teamA, teamB: m.teamB, helper: m.helper,
        scoreA: isNaN(sA) ? null : sA,
        scoreB: isNaN(sB) ? null : sB,
      };
    }),
  };

  db.sessions.push(session);
  saveDB();

  const btn = document.getElementById('save-session-btn');
  btn.textContent = '✓ Gespeichert!';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Spieltag speichern';
    btn.disabled = false;
  }, 2500);
}

// ============================================================
// STATISTICS
// ============================================================

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
    session.matches.forEach(match => {
      const sA = parseInt(match.scoreA);
      const sB = parseInt(match.scoreB);
      if (isNaN(sA) || isNaN(sB)) return;

      const playersA = [...session.teams[match.teamA]];
      const playersB = [...session.teams[match.teamB]];
      if (match.helper) {
        if (playersA.length === 1) playersA.push(match.helper);
        else if (playersB.length === 1) playersB.push(match.helper);
      }

      const aWon = sA > sB;

      playersA.forEach(name => {
        const s = get(name);
        s.sessionIds.add(session.id);
        s.matches++;
        s.pointsFor += sA;
        s.pointsAgainst += sB;
        if (aWon) s.wins++; else s.losses++;
      });
      playersB.forEach(name => {
        const s = get(name);
        s.sessionIds.add(session.id);
        s.matches++;
        s.pointsFor += sB;
        s.pointsAgainst += sA;
        if (!aWon) s.wins++; else s.losses++;
      });
    });
  });

  return Object.values(stats)
    .map(s => ({
      ...s,
      sessions: s.sessionIds.size,
      winRate: s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 0,
      diff: s.pointsFor - s.pointsAgainst,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
}

function renderStats() {
  const container = document.getElementById('stats-container');
  if (db.sessions.length === 0) {
    container.innerHTML = '<p class="message">Noch keine Daten gespeichert.</p>';
    return;
  }

  const players = computePlayerStats(db.sessions);
  const table = document.createElement('table');
  table.className = 'stats-table';
  table.innerHTML = `<thead><tr>
    <th>Spieler</th>
    <th title="Spieltage">ST</th>
    <th title="Spiele">Sp</th>
    <th>S</th>
    <th>N</th>
    <th>Quote</th>
    <th>Diff</th>
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
      <td class="stat-cell ${p.diff >= 0 ? 'positive' : 'negative'}">${p.diff > 0 ? '+' : ''}${p.diff}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

document.querySelectorAll('.tab-btn').forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

document.getElementById('add-btn').addEventListener('click', addPlayer);
document.getElementById('player-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addPlayer();
});
document.getElementById('generate-teams-btn').addEventListener('click', generateTeams);
document.getElementById('generate-schedule-btn').addEventListener('click', () =>
  generateSchedule(currentTeams)
);
document.getElementById('save-session-btn').addEventListener('click', saveSession);
document.getElementById('export-btn').addEventListener('click', exportDB);
document.getElementById('import-input').addEventListener('change', e => {
  if (e.target.files[0]) importDB(e.target.files[0]);
});

// ============================================================
// INIT
// ============================================================

renderKnownPlayers();
renderStats();
