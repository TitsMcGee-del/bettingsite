// REPLACE WITH YOUR FIREBASE KEYS
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_DOMAIN.firebaseapp.com",
    databaseURL: "https://YOUR_URL-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "12345",
    appId: "1:12345:web:6789"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = null;
let isAdmin = false;
let teams = [];
let matches = {};

function handleLogin() {
    const u = document.getElementById('userIn').value.trim();
    const p = document.getElementById('passIn').value;
    if(!u || !p) return alert("Fill all fields");

    // Admin bypass
    if(u === 'Admin' && p === 'IBM99ibm') {
        currentUser = 'Admin'; isAdmin = true; launch();
    } else {
        db.ref('users/' + u).once('value', s => {
            const data = s.val();
            if(data) {
                if(data.pass === p) { currentUser = u; isAdmin = false; launch(); }
                else alert("Wrong Password");
            } else {
                db.ref('users/' + u).set({ pass: p }).then(() => {
                    currentUser = u; isAdmin = false; launch();
                });
            }
        });
    }
}

function launch() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('main-nav').style.display = 'flex';
    document.getElementById('user-info').innerText = "Logged in as: " + currentUser;
    if(isAdmin) document.getElementById('admin-tab-link').style.display = 'block';
    loadData();
}

function loadData() {
    db.ref('teams').on('value', s => {
        const val = s.val();
        teams = val ? Object.keys(val).map(k => ({id: k, ...val[k]})) : [];
        renderStandings();
        renderBracket();
        if(isAdmin) renderAdminTeams();
    });
    db.ref('matches').on('value', s => {
        matches = s.val() || {};
        renderMatches();
        if(isAdmin) renderAdminMatches();
    });
}

function calcStrength(h) {
    if(!h) return 0;
    // 50% last match, 30% previous, 20% average of remaining 3
    const w1 = (h[0]||0) * 0.50;
    const w2 = (h[1]||0) * 0.30;
    const w3 = (((h[2]||0)+(h[3]||0)+(h[4]||0))/3) * 0.20;
    return w1 + w2 + w3;
}

function renderStandings() {
    const container = document.getElementById('group-tables-container');
    let html = '';
    ['A', 'B'].forEach(g => {
        html += `<div class="card"><div class="card-header">Group ${g} Performance Table</div>
        <table><tr><th>Team</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>STR</th></tr>`;
        teams.filter(t => t.group === g).forEach(t => {
            const h = t.history || [0,0,0,0,0];
            html += `<tr><td>${t.name}</td>
                <td>${h[0]}</td><td>${h[1]}</td><td>${h[2]}</td><td>${h[3]}</td><td>${h[4]}</td>
                <td style="color:var(--b365-bright); font-weight:bold">${calcStrength(h).toFixed(1)}</td>
            </tr>`;
        });
        html += `</table></div>`;
    });
    container.innerHTML = html;
}

function renderMatches() {
    const list = document.getElementById('match-list');
    list.innerHTML = Object.entries(matches).map(([id, m]) => `
        <div class="card"><div class="card-header">${m.home} vs ${m.away}</div>
        <div style="padding:15px; display:flex; justify-content:space-around; align-items:center;">
            <button class="bet-btn">Home</button>
            <div style="font-size:1.2rem; font-weight:bold">${m.result || 'vs'}</div>
            <button class="bet-btn">Away</button>
        </div>
        <div style="background:#222; padding:5px; text-align:center; font-size:0.7rem">
            Leg Selector: <select onchange="console.log('leg changed')"><option>1st Leg</option><option>2nd Leg</option></select>
        </div></div>`).join('');
}

function renderBracket() {
    const container = document.getElementById('bracket-container');
    container.innerHTML = `<div class="bracket-grid">
        <div><h4>Quarter</h4><div class="match-box">TBD v TBD</div><div class="match-box">TBD v TBD</div></div>
        <div><h4>Semi</h4><div class="match-box" style="margin-top:25px">TBD v TBD</div></div>
        <div><h4>Final</h4><div class="match-box" style="margin-top:50px">TBD v TBD</div></div>
    </div>`;
}

function showTab(id, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active-tab'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active-tab');
    el.classList.add('active');
}

// ADMIN FUNCTIONS
function renderAdminTeams() {
    let html = `<div class="card"><div class="card-header">Update Team Strength (Last 5)</div><table>`;
    teams.forEach(t => {
        const h = t.history || [0,0,0,0,0];
        html += `<tr><td>${t.name}</td><td>
            <input class="strength-input" type="number" value="${h[0]}" onchange="updStr('${t.id}',0,this.value)">
            <input class="strength-input" type="number" value="${h[1]}" onchange="updStr('${t.id}',1,this.value)">
            <input class="strength-input" type="number" value="${h[2]}" onchange="updStr('${t.id}',2,this.value)">
            <input class="strength-input" type="number" value="${h[3]}" onchange="updStr('${t.id}',3,this.value)">
            <input class="strength-input" type="number" value="${h[4]}" onchange="updStr('${t.id}',4,this.value)">
        </td></tr>`;
    });
    html += `</table></div>`;
    document.getElementById('admin-team-list').innerHTML = html;
}

function updStr(id, idx, val) {
    db.ref(`teams/${id}/history/${idx}`).set(parseInt(val));
}

function renderAdminMatches() {
    let html = `<div class="card"><div class="card-header">Set Scores</div>`;
    Object.entries(matches).forEach(([id, m]) => {
        html += `<div style="padding:10px; border-bottom:1px solid #444; display:flex; justify-content:space-between;">
            ${m.home} v ${m.away} <button onclick="setScore('${id}')">${m.result || 'Set'}</button>
        </div>`;
    });
    document.getElementById('admin-match-list').innerHTML = html + `</div>`;
}

function setScore(id) {
    const s = prompt("Score:");
    if(s) db.ref(`matches/${id}/result`).set(s);
}
