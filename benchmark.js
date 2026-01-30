
const { performance } = require('perf_hooks');

// Mock Data
const globalTeams = [];
const groups = ['A', 'B', 'C', 'D']; // Exclude E as per code
const teamsPerGroup = 50; // Use a decent number to make it noticeable

let teamIdCounter = 0;
groups.forEach(grp => {
    for (let i = 0; i < teamsPerGroup; i++) {
        globalTeams.push({
            id: `team_${++teamIdCounter}`,
            name: `Team ${teamIdCounter}`,
            group: grp,
            history: ['-', '-', '-', '-', '-']
        });
    }
});

// Mock existing matches
const globalMatches = {};
let matchIdCounter = 0;
// Fill with some matches (e.g., half of potential matches already exist)
globalTeams.forEach(t1 => {
    globalTeams.forEach(t2 => {
        if (t1.id !== t2.id && Math.random() < 0.5) {
            const id = `m_${++matchIdCounter}`;
            globalMatches[id] = {
                homeId: t1.id,
                awayId: t2.id,
                result: null
            };
        }
    });
});

console.log(`Setup: ${globalTeams.length} teams, ${Object.keys(globalMatches).length} existing matches.`);

// Mock helper functions
function calculateOddsForTeams(tA, tB) {
    return { '1': '2.00', 'X': '3.00', '2': '4.00' };
}

// Original Implementation Logic
function runOriginal(legs) {
    const checkExists = (hId, aId) => {
        return Object.values(globalMatches || {}).some(m => m.homeId === hId && m.awayId === aId);
    };

    const grouped = {};
    globalTeams.forEach(t => {
        if (t.group === 'E') return;
        if (!grouped[t.group]) grouped[t.group] = [];
        grouped[t.group].push(t);
    });

    const updates = {};
    let count = 0;
    let skipped = 0;

    Object.keys(grouped).forEach(grp => {
        const teams = grouped[grp];
        const uniqueTeams = [];
        const seenIds = new Set();
        teams.forEach(t => {
            if (!seenIds.has(t.id)) {
                seenIds.add(t.id);
                uniqueTeams.push(t);
            }
        });

        for (let i = 0; i < uniqueTeams.length; i++) {
            for (let j = i + 1; j < uniqueTeams.length; j++) {
                const tA = uniqueTeams[i];
                const tB = uniqueTeams[j];

                // Leg 1
                if (!checkExists(tA.id, tB.id)) {
                    // heavy calc mock
                    const odds1 = calculateOddsForTeams(tA, tB);
                    const id1 = 'm_new_' + count;
                    updates[`matches/${id1}`] = { homeId: tA.id, awayId: tB.id };
                    count++;
                } else {
                    skipped++;
                }

                // Leg 2
                if (legs === 2) {
                    if (!checkExists(tB.id, tA.id)) {
                        const odds2 = calculateOddsForTeams(tB, tA);
                        const id2 = 'm_new_' + count;
                        updates[`matches/${id2}`] = { homeId: tB.id, awayId: tA.id };
                        count++;
                    } else {
                        skipped++;
                    }
                }
            }
        }
    });
    return count;
}

// Optimized Implementation Logic
function runOptimized(legs) {
    // Optimization: Create a Set of existing matches
    const existingMatchesSet = new Set();
    Object.values(globalMatches || {}).forEach(m => {
        existingMatchesSet.add(`${m.homeId}_${m.awayId}`);
    });

    const checkExists = (hId, aId) => {
        return existingMatchesSet.has(`${hId}_${aId}`);
    };

    const grouped = {};
    globalTeams.forEach(t => {
        if (t.group === 'E') return;
        if (!grouped[t.group]) grouped[t.group] = [];
        grouped[t.group].push(t);
    });

    const updates = {};
    let count = 0;
    let skipped = 0;

    Object.keys(grouped).forEach(grp => {
        const teams = grouped[grp];
        const uniqueTeams = [];
        const seenIds = new Set();
        teams.forEach(t => {
            if (!seenIds.has(t.id)) {
                seenIds.add(t.id);
                uniqueTeams.push(t);
            }
        });

        for (let i = 0; i < uniqueTeams.length; i++) {
            for (let j = i + 1; j < uniqueTeams.length; j++) {
                const tA = uniqueTeams[i];
                const tB = uniqueTeams[j];

                // Leg 1
                if (!checkExists(tA.id, tB.id)) {
                    const odds1 = calculateOddsForTeams(tA, tB);
                    const id1 = 'm_new_' + count;
                    updates[`matches/${id1}`] = { homeId: tA.id, awayId: tB.id };
                    count++;
                } else {
                    skipped++;
                }

                // Leg 2
                if (legs === 2) {
                    if (!checkExists(tB.id, tA.id)) {
                        const odds2 = calculateOddsForTeams(tB, tA);
                        const id2 = 'm_new_' + count;
                        updates[`matches/${id2}`] = { homeId: tB.id, awayId: tA.id };
                        count++;
                    } else {
                        skipped++;
                    }
                }
            }
        }
    });
    return count;
}

console.log('Running benchmarks...');

const startOriginal = performance.now();
const countOriginal = runOriginal(2);
const endOriginal = performance.now();
console.log(`Original: ${(endOriginal - startOriginal).toFixed(2)}ms, generated ${countOriginal} matches`);

const startOptimized = performance.now();
const countOptimized = runOptimized(2);
const endOptimized = performance.now();
console.log(`Optimized: ${(endOptimized - startOptimized).toFixed(2)}ms, generated ${countOptimized} matches`);

const improvement = ((endOriginal - startOriginal) - (endOptimized - startOptimized));
console.log(`Improvement: ${improvement.toFixed(2)}ms`);
