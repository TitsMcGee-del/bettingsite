// 1. DATABASE CONFIG (Replace with your actual keys)
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

// 2. STATE
let currentUser = null;
let isAdmin = false;
let globalTeams = [];
let globalMatches = {};

// 3. LOGIN LOGIC
function handleLogin() {
    const u = document.getElementById('userIn').value.trim();
    const p = document.getElementById('passIn').value;
    
    if(!u || !p) return alert("Please fill all fields");

    if(u === 'Admin' && p === 'IBM99ibm') {
        currentUser = 'Admin';
        isAdmin = true;
        launchApp();
    } else {
        db.ref('users/' + u).once('value', s => {
            const userData = s.val();
            if(userData) {
                if(userData.pass === p) {
                    currentUser = u;
                    isAdmin = false;
                    launchApp();
                } else {
                    alert("Wrong password");
                }
            } else {
                // Register new user
                db.ref('users/' + u).set({ pass: p, credits: 100 }).then(() => {
                    currentUser = u;
                    isAdmin = false;
                    launchApp();
                });
            }
        });
    }
}

function launchApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('main-nav').style.display = 'flex';
    document.getElementById('user-info').innerText = `Logged in as: ${currentUser}`;
    if(isAdmin) document.getElementById('admin-tab-link').style.display = 'block';
    initData();
}

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active-tab'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active-tab');
    event.currentTarget.classList.add('active');
}

// 4. DATA SYNC
function initData() {
    db.ref('teams').on('value', s => { 
        globalTeams = s.val() ? Object.values(s.val()) : []; 
        renderStandings(); 
        if(isAdmin) renderAdminTeams();
    });
    db.ref('matches').on('value', s => { 
        globalMatches = s.val() || {}; 
        renderMatches(); 
        if(isAdmin) renderAdminMatches();
    });
}

function calcStrength(history) {
    if(!history) return 0;
    const h = Object.values(history);
    return h.reduce((a,b)=>a+b,0) / h.length;
}

function renderMatches() {
    const list = document.getElementById('match-list');
    list.innerHTML = Object.entries(globalMatches).map(([id, m]) => {
        // Admin sees the match but NO bet buttons
        if(isAdmin) {
            return `<div class="card"><div class="card-header">${m.home} vs ${m.away}</div>
                    <div style="padding:15px; text-align:center;">Score: ${m.result || 'Pending'}</div></div>`;
        }
        // Users see bet buttons
        return `<div class="card">
            <div class="card-header">${m.home} vs ${m.away}</div>
            <div style="display:flex; justify-content:space-around; padding:15px;">
                <button class="bet-btn" onclick="alert('Bet Placed')">Home</button>
                <div style="font-weight:bold">${m.result || 'VS'}</div>
                <button class="bet-btn" onclick="alert('Bet Placed')">Away</button>
            </div>
        </div>`;
    }).join('');
}
