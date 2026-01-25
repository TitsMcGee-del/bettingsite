function renderAdminTeams() {
    let html = `<div class="card"><div class="card-header">Admin: Team Performance</div><table>`;
    globalTeams.forEach(t => {
        const history = t.history || [0,0,0,0,0];
        html += `<tr><td>${t.name}</td><td>
            <input type="number" value="${history[0]}" onchange="updateHistory('${t.id}', 0, this.value)" style="width:40px">
            <input type="number" value="${history[1]}" onchange="updateHistory('${t.id}', 1, this.value)" style="width:40px">
        </td></tr>`;
    });
    html += `</table></div>`;
    document.getElementById('admin-team-list').innerHTML = html;
}

function updateHistory(id, index, val) {
    db.ref(`teams/${id}/history/${index}`).set(parseInt(val));
}

function renderAdminMatches() {
    let html = `<div class="card"><div class="card-header">Set Results</div>`;
    Object.entries(globalMatches).forEach(([id, m]) => {
        html += `<div style="padding:10px; border-bottom:1px solid #444; display:flex; justify-content:space-between;">
            <span>${m.home} v ${m.away}</span>
            <button class="refresh-btn" onclick="setRes('${id}')">${m.result || 'Enter Score'}</button>
        </div>`;
    });
    html += `</div>`;
    document.getElementById('admin-match-list').innerHTML = html;
}

function setRes(id) {
    const s = prompt("Score (e.g. 1-0):");
    if(s) db.ref(`matches/${id}/result`).set(s);
}
