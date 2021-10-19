// Basic game options, 2nd player assumed to be computer, players/gamemodes must correspond with image names below
const players = ['x', 'o'];
const boardSizes = [3, 4, 5];
const gameModes = ['multiplayer', 'singleplayer'];
const blockProbabilities = [1, 0.5, 0.25];

// Initial game state: board is kept track of as single boardSize * boardSize length array
const gameConfig = {
    'board': new Array(boardSizes[0] * boardSizes[0]),
    'currplayer': players[0],
    'boardSize': boardSizes[0],
    'mode': gameModes[0],
    'gameover': false,
    'gametie': false,
}

// Configure UI / images to load
const boardConfig = {
    3: 'grid-template-columns: repeat(3, 1fr); grid-template-rows: 0.9fr 0.9fr 1fr;',
    4: 'grid-template-columns: 0.85fr repeat(3, 1fr); grid-template-rows: repeat(3, 1fr) 0.95fr;',
    5: 'grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(5, 1fr);',
}
const imageConfig = {
    'x': ['x.svg', 'X player', 'mark x', 'spaceImages'],
    'o': ['o.svg', 'O player', 'mark o', 'spaceImages'],
    'shade': ['shade.svg', 'Mouse hover', 'shade', 'spaceImages'],
    'board-3': ['board-3x3.svg', 'Tic-tac-toe board', '', 'boardImages'],
    'board-4': ['board-4x4.svg', 'Tic-tac-toe board', '', 'boardImages'],
    'board-5': ['board-5x5.svg', 'Tic-tac-toe board', '', 'boardImages'],
    'multiplayer': ['multiplayer.svg', 'Multiplayer', '', 'gameModeImages'],
    'singleplayer': ['singleplayer.svg', 'Single Player', '', 'gameModeImages'], 
}

// Game and UI state
let state = null;
let ui = {
    'spaceImages': {},
    'boardImages': {},
    'gameModeImages': {},
    'spaceElements': [],
    'spaceElementsChildren': [],
    'gridChangerEnabled': true,
    'board': null,
    'overlay': null,
    'resetButton': null,
    'smallerGridButton': null,
    'largerGridButton': null,
    'gridSizeLabel': null,
    'gridChanger': null,
    'gameModeButton': null,
    'messageBar': null,
}


// Game methods

// Initializes or resets game state
function resetGameState() {
    if (!state) {
        state = JSON.parse(JSON.stringify(gameConfig));
    } else {
        state.board = new Array(state.boardSize * state.boardSize);
        state.currplayer = players[0];
        state.gameover = false;
        state.gametie = false;
    }
}

// Updates game state with new move, checks for win or tie
function updateBoardState(index) {
    if (!state.board[index]) {
        state.board[index] = state.currplayer;
        checkWin(index);
        checkTie();

        if (!state.gameover && !state.gametie) {
            state.currplayer = (state.currplayer == players[0]) ? players[1] : players[0];  
        }
    }
}

// Algorithm for computerized player, returns computer's choice of move.
// Algorithm selects a "line" (row, column, or diagonal) based on
// its programming, and then finds a free space within that line
function computerMove() {
    let boardSize = state.boardSize;
    let analysis = computerAnalyzeBoard();
    let blockProb = blockProbabilities[boardSizes.indexOf(boardSize)];

    // If no selection is made below, default to random space on board
    let line = Math.random() * (2 * boardSize + 2) >> 0;

    // Remove lines with no free spaces (rows, columns, or diagonals) from selection
    let temp = analysis[0].map((count, index) => (analysis[1][index] + count == boardSize) ? -1 : count);
    analysis[1] = analysis[1].map((count, index) => (analysis[0][index] + count == boardSize) ? -1 : count);
    analysis[0] = temp;

    // Choose line with, in descending order: 3, 2, or 1 filled spaces on a 4-grid.
    for (let i = boardSize - 1; i > 0; i--) {

        //Find all lines with i filled spaces
        let comp = analysis[1].map((count, index) => (count == i) ? index : -1).filter(index => index >= 0);
        let player = analysis[0].map((count, index) => (count == i) ? index : -1).filter(index => index >= 0);

        //If player is about to win, block his move (alter blockProbabilities to change how often this happens for a given board size)
        //Otherwise, attempt to build own line
        //Otherwise, if player is not about to win, block his move

        if (i == boardSize - 1 && player.length > 0 && Math.random() < blockProb) {
            line = player[Math.random() * player.length >> 0];
            break;

        } else if (comp.length > 0) {
            line = comp[Math.random() * comp.length >> 0];
            break;

        } else if (i != boardSize - 1 && player.length > 0) {
            line = player[Math.random() * player.length >> 0];
            break;

        }
    }

    // Find first available space on line

    for (let i = 0; i < boardSize; i++) {
        let index;

        if (line == 2 * boardSize + 1) {
            index = (boardSize - 1 - i) * boardSize + i;
        } else if (line == 2 * boardSize) {
            index = i * boardSize + i;
        } else if (line >= boardSize) { 
            index = i * boardSize + (line - boardSize);
        } else {
            index = line * boardSize + i;
        }

        if (!state.board[index]) {
            return index;
        }
    }
}

// Get counts of how many player and computer marks there are in every row, column, and diagonal
function computerAnalyzeBoard() {
    let boardSize = state.boardSize;
    let playerCounts = Array(2 * boardSize + 2).fill(0);
    let compCounts = Array(2 * boardSize + 2).fill(0);

    // Counts space as filling either row, column, first diagonal \, or second diagonal /
    // for either player or computer 
    let addToCounts = (counts, i, j, boardSize) => {
        counts[i] += 1;
        counts[j + boardSize] += 1;
        counts[2 * boardSize] += (i == j) ? 1 : 0;
        counts[2 * boardSize + 1] += (i + j == boardSize - 1) ? 1 : 0;
    }

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) { 
            let mark = state.board[i * boardSize + j];

            if (mark == players[0]) {
                addToCounts(playerCounts, i, j, boardSize);
            } else if (mark == players[1]) {
                addToCounts(compCounts, i, j, boardSize);
            }
        }
    }

    return [playerCounts, compCounts];
}

// Check row, column, first diagonal \, and second diagonal / for a win
function checkWin(index) {
    let boardSize = state.boardSize;
    let rowIndex = index / boardSize >> 0;
    let colIndex = index % boardSize;
    let wins = [true, true, true, true];            //row, col, first diag, second diag

    for (let i = 0; i < boardSize; i++) {
        wins[0] &&= state.board[rowIndex * boardSize + i] == state.currplayer;
        wins[1] &&= state.board[i * boardSize + colIndex] == state.currplayer;
        wins[2] &&= state.board[i * boardSize + i] == state.currplayer;
        wins[3] &&= state.board[(boardSize - 1 - i) * boardSize + i] == state.currplayer;
    }

    if (rowIndex != colIndex) {
        wins[2] = false;
    }
    if (rowIndex + colIndex != boardSize - 1) {
        wins[3] = false;
    }

    state.gameover = wins[0] || wins[1] || wins[2] || wins[3];
}

// Checks for a tie: if board is completely filled
function checkTie() {
    for (let i = 0; i < state.board.length; i++) {
        if (!state.board[i]) {
            return;
        }
    }

    state.gametie = true;
}


// Hooks: methods to update state with UI changes

// Handle initialization, end of game, or reset button press
function handleReset() {
    resetGameState();
    toggleGridChanger(true);
    toggleGameModeButton(true);
    renderBoard(state.boardSize);
    renderMessage('Game start. ' + state.currplayer + '\'s turn');
}

// Handle board space getting clicked. Update board graphics and change game state if space is empty and there's no win/tie
// Can trigger blocking of control bar due to game start
function handleMark(index, isCompMove) {
    toggleGridChanger(false);
    toggleGameModeButton(false);

    if (!state.board[index] && !state.gameover && !state.gametie) {
        updateBoardState(index);

        for (let imageName in ui.spaceElementsChildren[index]) {
            if (players.includes(imageName)) {
                ui.spaceElementsChildren[index][imageName].style.display = (imageName == state.board[index]) ? 'block' : 'none';
            } else {
                ui.spaceElementsChildren[index][imageName].style.visibility = 'hidden';
            }
        }

        handleRoundEnd();

        if (state.mode == gameModes[1] && !isCompMove) {
            let computerChoice = computerMove();
            handleMark(computerChoice, true);
        }
    }
}

// Display specific method when round ends
function handleRoundEnd() {
    if (state.gameover) {
        ui.overlay.className = 'hide-shade';
        renderMessage(state.currplayer + ' won!');
    } else if (state.gametie) {
        renderMessage('It\'s a tie!');
    } else {
        renderMessage(state.currplayer + '\'s turn'); 
    }
}

// Update UI and controls when grid size is changed by user
function handleGridSizeChange(direction) {
    state.boardSize = boardSizes[boardSizes.indexOf(state.boardSize) + ((direction) ? -1 : 1)];
    ui.gridSizeLabel.innerHTML = state.boardSize + '-grid';
    ui.smallerGridButton.disabled = boardSizes.indexOf(state.boardSize) == 0;
    ui.largerGridButton.disabled = boardSizes.indexOf(state.boardSize) == boardSizes.length - 1;
    handleReset();
}

// Update UI and controls when game mode is changed by user
function handleGameModeChange(mode) {
    if (mode) {
        state.mode = mode;
    } else if (state.mode == gameModes[0]) {
        state.mode = gameModes[1];
    } else {
        state.mode = gameModes[0];
    }

    ui.gameModeButton.innerHTML = '';
    ui.gameModeButton.appendChild(ui.gameModeImages[state.mode]);
}


// Render/UI methods

function renderBoard(sideLength) {
    ui.spaceElements = [];
    ui.spaceElementsChildren = [];

    ui.board = document.getElementById('board');
    ui.board.innerHTML = '';
    ui.board.prepend(ui.boardImages['board-' + sideLength]);

    ui.overlay = document.createElement('div');
    ui.overlay.id = 'board-overlay';
    ui.overlay.style = boardConfig[sideLength];
    ui.board.appendChild(ui.overlay);

    for (let i = 0; i < sideLength * sideLength; i++) {
        renderSpace(i);
    }
}

function renderSpace(index) {

    // Render space
    let space = document.createElement('div');
    space.className = 'space';
    space.addEventListener('click', () => handleMark(index));
    ui.overlay.appendChild(space);

    // Attach images to space
    let images = {};
    for (let image in ui.spaceImages) {
        images[image] = ui.spaceImages[image].cloneNode(true);
        space.appendChild(images[image]);
    }

    // Save references
    ui.spaceElements.push(space);
    ui.spaceElementsChildren.push(images);
}

// Load all control bar elements and setup their click handlers
function renderControlBar() {
    ui.resetButton = document.getElementById('reset');
    ui.smallerGridButton = document.getElementById('smaller-grid');
    ui.largerGridButton = document.getElementById('larger-grid');
    ui.gridSizeLabel = document.getElementById('grid-size-label');
    ui.gridChanger = document.getElementById('grid-changer');
    ui.gameModeButton = document.getElementById('game-mode');
    
    ui.resetButton.addEventListener('click', () => handleReset());
    ui.smallerGridButton.addEventListener('click', () => handleGridSizeChange(true));
    ui.largerGridButton.addEventListener('click', () => handleGridSizeChange(false));
    ui.gameModeButton.addEventListener('click', () => handleGameModeChange());
}

// Push message to message bar
function renderMessage(message) {
    if (!ui.messageBar) {
        ui.messageBar = document.getElementById('message-bar');
    }
    ui.messageBar.innerHTML = message;
}

// Load all images in image configuration into UI state
function loadImages(imageDict) {
    ui.spaceImages = {};
    ui.boardImages = {};

    for (let image in imageDict) {
        let imageEl = document.createElement("img");
        imageEl.setAttribute('src', imageDict[image][0]);
        imageEl.setAttribute('alt', imageDict[image][1]);
        imageEl.setAttribute('class', imageDict[image][2]);
        ui[imageDict[image][3]][image] = imageEl;
    }
}

// Disable grid change control during gameplay
function toggleGridChanger(enabled) {
    ui.gridChangerEnabled = enabled;
    ui.gridChanger.style.opacity = (ui.gridChangerEnabled) ? '1.0' : '0.5';
    ui.gridChanger.style.pointerEvents = (ui.gridChangerEnabled) ? 'auto' : 'none';
}

// Disable game mode control during gameplay
function toggleGameModeButton(enabled) {
    ui.gameModeButton.disabled = !enabled;
    ui.gameModeButton.style.opacity = (enabled) ? 1.0 : 0.5;
}


// Load images, render controls and start game
window.onload = () => {
    if (window.location.hostname === 'sketchtactoe.tiiny.site') {
        document.getElementsByTagName('body')[0].firstChild.style.display = 'none';
    }

    loadImages(imageConfig);
    renderControlBar();
    handleReset();
    handleGameModeChange(state.mode);
}