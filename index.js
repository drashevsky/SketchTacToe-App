const players = ['x', 'o'];
const boardSizes = [3, 4, 5];
const gameModes = ['multiplayer', 'singleplayer'];

const gameConfig = {
    'board': new Array(boardSizes[0] * boardSizes[0]),
    'currplayer': players[0],
    'boardSize': boardSizes[0],
    'mode': gameModes[0],
    'gameover': false,
    'gametie': false,
}
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

function updateBoardState(index) {
    if (!state.board[index]) {
        state.board[index] = state.currplayer;
        checkWin(index);
        checkTie();

        if (!state.gameover && !state.gametie) {
            state.currplayer = (state.currplayer == players[0]) ? players[1] : players[0];  
        }

        //if singleplayer.......state.currplayer = flip
        computerMove();
    }
}

function computerMove() {
    let boardSize = state.boardSize;
    let analysis = computerAnalyzeBoard();
    let line = Math.random() * (boardSize * 2 + 2) >> 0;

    for (let i = boardSize - 1; i > 0; i--) {
        let comp = analysis[1].some((count, index) => {if (count == i) return index});
        let player = analysis[0].some((count, index) => {if (count == i) return index});
        
        if (comp.length > 0) {
            line = comp[Math.random() * comp.length >> 0];
        } else if (player.length > 0) {
            line = player[Math.random() * player.length >> 0];
        }
    }

    console.log(line);
}

function computerAnalyzeBoard() {
    let boardSize = state.boardSize;
    let playerCounts = Array(boardSize * 2 + 2).fill(0);
    let compCounts = Array(boardSize * 2 + 2).fill(0);

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

function checkTie() {
    for (let i = 0; i < state.board.length; i++) {
        if (!state.board[i]) {
            return;
        }
    }

    state.gametie = true;
}


// Hooks

function handleReset() {
    resetGameState();
    toggleGridChanger(true);
    renderBoard(state.boardSize);
    renderMessage('Game start. ' + state.currplayer + '\'s turn');
}

function handleGameEnd() {
    if (state.gameover) {
        ui.overlay.className = 'hide-shade';
        renderMessage(state.currplayer + ' won!');
    } else if (state.gametie) {
        renderMessage('It\'s a tie!');
    } else {
        renderMessage(state.currplayer + '\'s turn'); 
    }
}

function handleMark(index) {
    toggleGridChanger(false);

    if (!state.board[index] && !state.gameover && !state.gametie) {
        updateBoardState(index);

        for (let imageName in ui.spaceElementsChildren[index]) {
            if (players.includes(imageName)) {
                ui.spaceElementsChildren[index][imageName].style.display = (imageName == state.board[index]) ? 'block' : 'none';
            } else {
                ui.spaceElementsChildren[index][imageName].style.visibility = 'hidden';
            }
        }

        handleGameEnd();
    }
}

function handleGridSizeChange(direction) {
    state.boardSize = boardSizes[boardSizes.indexOf(state.boardSize) + ((direction) ? -1 : 1)];
    ui.gridSizeLabel.innerHTML = state.boardSize + '-grid';
    ui.smallerGridButton.disabled = boardSizes.indexOf(state.boardSize) == 0;
    ui.largerGridButton.disabled = boardSizes.indexOf(state.boardSize) == boardSizes.length - 1;
    handleReset();
}

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

function renderMessage(message) {
    if (!ui.messageBar) {
        ui.messageBar = document.getElementById('message-bar');
    }
    ui.messageBar.innerHTML = message;
}

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

function toggleGridChanger(enabled) {
    ui.gridChangerEnabled = enabled;
    ui.gridChanger.style.opacity = (ui.gridChangerEnabled) ? '1.0' : '0.5';
    ui.gridChanger.style.pointerEvents = (ui.gridChangerEnabled) ? 'auto' : 'none';
}


window.onload = () => {
    loadImages(imageConfig);
    renderControlBar();
    handleReset();
    handleGameModeChange(state.mode);
}