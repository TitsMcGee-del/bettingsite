function renderAdminTeams() {
  let html = `<div class="card"><div class="card-header">Edit Team Strength (5 Column History)</div>
  <table><tr><th>Team</th><th>Grp</th><th colspan="5">Last 5 Games (Points)</th><th>Avg</th></tr>`;

  globalTeams.forEach(t => {
    const history = t.history || [0, 0, 0, 0, 0];
    let inputs = '';
    history.forEach((val, index) => {
      inputs += `<td><input type="number" class="strength-input" value="${val}" 
                 onchange="updateStrength('${t.id}', ${index}, this.value)"></td>`;
    });

    html += `<tr>
        <td>${t.name}</td>
        <td>${t.group}</td>
        ${inputs}
        <td style="color:var(--b365-bright-green); font-weight:bold">${calcStrength(history).toFixed(1)}</td>
    </tr>`;
  });

  html += `</table></div>`;
  document.getElementById('admin-team-list').innerHTML = html;
}

async function updateStrength(teamId, index, newValue) {
    const val = parseInt(newValue) || 0;
    await db.ref(`teams/${teamId}/history/${index}`).set(val);
}

function adminSetResult(matchId) {
    const res = prompt("Enter score (e.g. 2-1):");
    if(res) db.ref(`matches/${matchId}/result`).set(res);
}

function renderAdminMatches() {
    const container = document.getElementById('admin-match-list');
    let html = `<div class="card"><div class="card-header">Manage Scores</div>`;
    Object.entries(globalMatches).forEach(([id, m]) => {
        html += `<div style="padding:10px; border-bottom:1px solid #444; display:flex; justify-content:space-between;">
            <span>${m.home} v ${m.away}</span>
            <button class="refresh-btn" onclick="adminSetResult('${id}')">${m.result || 'Set Score'}</button>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}
