// 1. CONFIGURATION (Replace with your actual Firebase config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. GLOBAL STATE
let currentUser = null;
let globalTeams = [];
let globalMatches = {};

// 3. LOGIN LOGIC
function login() {
  const user = document.getElementById('username').value.trim();
  if(!user) return alert("Enter username");
  currentUser = user;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('main-nav').style.display = 'flex';
  document.getElementById('user-info').innerText = `User: ${user}`;
  
  if(user.toLowerCase() === 'admin') {
    document.getElementById('admin-tab-link').style.display = 'block';
  }
  initData();
}

function logout() { location.reload(); }

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active-tab'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active-tab');
  event.currentTarget.classList.add('active');
}

// 4. DATA SYNC
function initData() {
  db.ref('teams').on('value', snap => {
    const val = snap.val();
    globalTeams = val ? Object.values(val) : [];
    renderStandings();
    if(currentUser === 'admin') renderAdminTeams();
  });

  db.ref('matches').on('value', snap => {
    globalMatches = snap.val() || {};
    renderMatches();
    renderBracket();
    if(currentUser === 'admin') renderAdminMatches();
  });

  db.ref('chat').limitToLast(20).on('value', snap => {
    const box = document.getElementById('chat-box');
    box.innerHTML = '';
    snap.forEach(child => {
      const m = child.val();
      const div = document.createElement('div');
      div.innerHTML = `<small style="color:#888">${m.user}:</small> <span style="color:#ddd">${m.text}</span>`;
      div.style.marginBottom = "5px";
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
  });
}

// 5. RENDERING FUNCTIONS
function calcStrength(history) {
    if(!history) return 0;
    const h = Object.values(history);
    return h.reduce((a,b)=>a+b,0) / h.length;
}

function renderStandings() {
  const groups = {};
  globalTeams.forEach(t => {
    if(!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  });

  let html = '';
  // Sort and display (Exclude Group E logic here if needed)
  Object.keys(groups).sort().forEach(gName => {
    if(gName === 'E') return; 
    html += `<div class="card"><div class="card-header">Group ${gName}</div><table>
      <tr><th>Team</th><th>Str</th></tr>`;
    groups[gName].forEach(t => {
      html += `<tr><td>${t.name}</td><td>${calcStrength(t.history).toFixed(1)}</td></tr>`;
    });
    html += `</table></div>`;
  });
  document.getElementById('group-tables-container').innerHTML = html;
}

function renderMatches() {
    const list = document.getElementById('match-list');
    list.innerHTML = Object.entries(globalMatches).map(([id, m]) => {
        const sH = calcStrength(globalTeams.find(t=>t.id===m.homeId)?.history);
        const sA = calcStrength(globalTeams.find(t=>t.id===m.awayId)?.history);
        const total = sH + sA;
        const oddH = total ? (total/sH).toFixed(2) : "2.00";
        const oddA = total ? (total/sA).toFixed(2) : "2.00";

        return `<div class="card">
            <div class="card-header">${m.home} vs ${m.away}</div>
            <div style="display:flex; justify-content:space-around; padding:15px;">
                <button class="bet-btn" onclick="placeBet('${id}','H')">${oddH}<br><small>Home</small></button>
                <div style="font-size:1.2rem; font-weight:bold; color:var(--b365-accent-yellow)">${m.result || 'VS'}</div>
                <button class="bet-btn" onclick="placeBet('${id}','A')">${oddA}<br><small>Away</small></button>
            </div>
        </div>`;
    }).join('');
}

function sendChat() {
  const txt = document.getElementById('chatInput').value;
  if(!txt) return;
  db.ref('chat').push({ user: currentUser, text: txt });
  document.getElementById('chatInput').value = '';
}
