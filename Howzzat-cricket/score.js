let match = {
    team1: '',
    team2: '',
    toss: { winner: '', decision: '' },
    innings: 1,
    maxOvers: 3, // Default value, will be updated from setup
    current: {
        battingTeam: '',
        bowlingTeam: '',
        score: { runs: 0, wickets: 0, extras: 0 },
        overs: 0,
        balls: 0,
        striker: null,
        nonStriker: null,
        currentBowler: null,
        target: null
    },
    allBatters: [],
    allBowlers: [],
    commentary: []
};

// Setup Page Functions
function startMatch() {
    const details = {
        team1: document.getElementById('team1').value,
        team2: document.getElementById('team2').value,
        tossWinner: document.getElementById('tossWinner').value,
        tossDecision: document.getElementById('tossDecision').value,
        maxOvers: parseInt(document.getElementById('maxOvers').value) || 3 // Get the user-defined overs
    };
    
    if (!details.team1 || !details.team2 || !details.tossWinner || !details.tossDecision || !details.maxOvers) {
        alert('Please fill all fields!');
        return;
    }
    
    // Clear any previous match data to ensure a fresh start.
    localStorage.removeItem('matchData');
    localStorage.setItem('matchDetails', JSON.stringify(details));
    window.location.href = 'live.html';
}

// Live Match Functions
function initMatch() {
    // Check if match data already exists (e.g., when returning from scorecard)
    const storedMatchData = localStorage.getItem('matchData');
    if (storedMatchData) {
        match = JSON.parse(storedMatchData);
        updateDisplay();
        return;
    }

    const stored = JSON.parse(localStorage.getItem('matchDetails'));
    if (!stored) {
        alert('Match details missing! Redirecting to setup...');
        window.location.href = 'setup.html';
        return;
    }
    
    match = {
        team1: stored.team1,
        team2: stored.team2,
        toss: { winner: stored.tossWinner, decision: stored.tossDecision },
        innings: 1,
        maxOvers: stored.maxOvers || 3, // Use the stored value or default to 3
        current: {
            battingTeam: stored.tossDecision === 'bat' ? stored.tossWinner : 
                        (stored.tossWinner === 'team1' ? 'team2' : 'team1'),
            bowlingTeam: '',
            score: { runs: 0, wickets: 0, extras: 0 },
            overs: 0,
            balls: 0,
            striker: null,
            nonStriker: null,
            currentBowler: null,
            target: null
        },
        allBatters: [],
        allBowlers: [],
        commentary: []
    };
    
    match.current.bowlingTeam = match.current.battingTeam === 'team1' ? 'team2' : 'team1';
    
    const striker = prompt("Enter striker batter name:");
    const nonStriker = prompt("Enter non-striker batter name:");
    const bowler = prompt("Enter current bowler name:");
    
    match.current.striker = createBatter(striker, true);
    match.current.nonStriker = createBatter(nonStriker, false);
    match.current.currentBowler = createBowler(bowler);
    
    updateDisplay();
}

function createBatter(name, isStriker) {
    return {
        name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        out: false,
        striker: isStriker
    };
}

function createBowler(name) {
    return {
        name,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        balls: 0
    };
}

function addRuns(runs) {
    match.current.striker.runs += runs;
    match.current.striker.balls++;
    match.current.score.runs += runs;
    
    if (runs === 4) match.current.striker.fours++;
    if (runs === 6) match.current.striker.sixes++;
    
    if (runs % 2 !== 0) {
        [match.current.striker, match.current.nonStriker] = 
        [match.current.nonStriker, match.current.striker];
    }
    
    updateBall();
    addCommentary(`${match.current.striker.name} scores ${runs} run${runs !== 1 ? 's' : ''}!`);
    updateDisplay();
}

function addWicket() {
    // Store the name of the out batter before replacing them
    const outBatterName = match.current.striker.name;
    
    // Update wicket counts
    match.current.score.wickets++;
    match.current.currentBowler.wickets++;
    
    // Add the out batter to the list and mark them as out
    match.current.striker.out = true;
    match.allBatters.push(match.current.striker);
    
    addCommentary(`WICKET! ${outBatterName} is out!`);
    
    // Check if this was the 10th wicket (all out)
    if (match.current.score.wickets >= 10) {
        addCommentary(`All out! End of innings.`);
        endInnings();
        return;
    }
    
    // If not all out, get a new batter
    const newBatter = prompt("Enter new batter name:");
    match.current.striker = createBatter(newBatter, true);
    
    updateDisplay();
}

function addExtra(type) {
    match.current.score.extras++;
    match.current.score.runs++;
    
    const messages = {
        'wide': "Wide ball! +1 run",
        'no-ball': "No ball! +1 run",
        'bye': "Byes! +1 run",
        'leg-bye': "Leg byes! +1 run"
    };
    
    addCommentary(messages[type]);
    updateDisplay();
}

function updateBall() {
    match.current.balls++;
    match.current.currentBowler.balls++;
    
    if (match.current.balls >= 6) {
        match.current.overs++;
        match.current.balls = 0;
        match.current.currentBowler.overs++;
        
        [match.current.striker, match.current.nonStriker] = 
        [match.current.nonStriker, match.current.striker];
        
        const newBowler = prompt("Enter new bowler name:");
        match.allBowlers.push(match.current.currentBowler);
        match.current.currentBowler = createBowler(newBowler);
    }
    
    // End innings if maximum overs reached or all 10 wickets are out
    if (match.current.overs >= match.maxOvers || match.current.score.wickets >= 10) {
        endInnings();
    }
}

function endInnings() {
    if (match.innings === 1) {
        match.current.target = match.current.score.runs + 1;
        match.innings = 2;
        
        [match.current.battingTeam, match.current.bowlingTeam] = 
        [match.current.bowlingTeam, match.current.battingTeam];
        
        match.current.score = { runs: 0, wickets: 0, extras: 0 };
        match.current.overs = 0;
        match.current.balls = 0;
        
        const striker = prompt("Enter new striker batter:");
        const nonStriker = prompt("Enter new non-striker batter:");
        const bowler = prompt("Enter new bowler:");
        
        match.allBatters.push(match.current.striker, match.current.nonStriker);
        match.allBowlers.push(match.current.currentBowler);
        
        match.current.striker = createBatter(striker, true);
        match.current.nonStriker = createBatter(nonStriker, false);
        match.current.currentBowler = createBowler(bowler);
    } else {
        localStorage.setItem('matchData', JSON.stringify(match));
        window.location.href = 'summary.html';
    }
    updateDisplay();
}

function updateDisplay() {
    const battingTeam = match.current.battingTeam === 'team1' ? 
        match.team1 : match.team2;
    const bowlingTeam = match.current.bowlingTeam === 'team1' ? 
        match.team1 : match.team2;
    
    // Display "All out" instead of wickets count when 10 wickets are gone
    let scoreDisplay = match.current.score.wickets === 10 ? 
        `${match.current.score.runs} (All out)` :
        `${match.current.score.runs}/${match.current.score.wickets}`;

    document.getElementById('scoreDisplay').innerHTML = `
        <h2>${battingTeam} ${scoreDisplay}</h2>
        <p>Overs: ${getOversDisplay(match.current.overs, match.current.balls)}</p>
        ${match.innings === 2 ? `<p>Target: ${match.current.target}</p>` : ''}
        <p>vs ${bowlingTeam}</p>
    `;

    document.getElementById('battersDisplay').innerHTML = `
        <div class="batter striker">
            🏏 ${match.current.striker.name}<br>
            ${match.current.striker.runs} (${match.current.striker.balls})<br>
            ${match.current.striker.fours}×4 ${match.current.striker.sixes}×6
        </div>
        <div class="batter">
            ${match.current.nonStriker.name}<br>
            ${match.current.nonStriker.runs} (${match.current.nonStriker.balls})
        </div>
    `;

    document.getElementById('bowlersDisplay').innerHTML = `
        <div class="bowler">
            🎯 ${match.current.currentBowler.name}<br>
            Overs: ${match.current.currentBowler.overs}.${match.current.currentBowler.balls}<br>
            Wickets: ${match.current.currentBowler.wickets}<br>
            Runs: ${match.current.currentBowler.runs}
        </div>
    `;
}

function addCommentary(text) {
    const over = `${match.current.overs}.${match.current.balls}`;
    const entry = document.createElement('div');
    entry.className = 'commentary-entry';
    entry.textContent = `${over} - ${text}`;
    document.getElementById('commentary').prepend(entry);
}

// Navigation Functions
function goToScorecard() {
    localStorage.setItem('matchData', JSON.stringify(match));
    window.location.href = 'scorecard.html';
}

function resetMatch() {
    // Remove both stored match data and details so a new match starts fresh.
    localStorage.removeItem('matchData');
    localStorage.removeItem('matchDetails');
    window.location.href = 'setup.html';
}

// Initialize match
window.onload = function() {
    if(window.location.pathname.includes('live.html')) {
        initMatch();
    }
};

function getOversDisplay(overs, balls) {
    return `${overs + Math.floor(balls / 6)}.${balls % 6}`;
}