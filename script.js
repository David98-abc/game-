const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const startButton = document.getElementById('start-button');
const leaderboardList = document.getElementById('leaderboard');

const items = ['🐦', '💰', '📱']; // 羽毛、黃金、手機
const boardSize = 8;
const matchMin = 3; // 至少三個才能消除
let board = [];
let score = 0;
let time = 60; // 遊戲時間 (秒)
let timer;
let selectedCell = null; // 儲存選中的第一個方塊

// --- 遊戲初始化與核心邏輯 ---

function initializeBoard() {
    board = Array(boardSize).fill(0).map(() => Array(boardSize).fill(0));
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            board[r][c] = getRandomItem();
        }
    }
    // 確保初始時沒有即時消除
    while (checkMatches().length > 0) {
        fillBoard();
    }
    renderBoard();
    score = 0;
    scoreDisplay.textContent = score;
    time = 60;
    timeDisplay.textContent = time;
    startButton.disabled = false;
    startButton.textContent = '開始遊戲';
}

function getRandomItem() {
    return items[Math.floor(Math.random() * items.length)];
}

function renderBoard() {
    gameBoard.innerHTML = '';
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.textContent = board[r][c];
            cell.addEventListener('click', handleCellClick);
            gameBoard.appendChild(cell);
        }
    }
}

function handleCellClick(event) {
    if (startButton.disabled === false) return; // 遊戲未開始不能點擊

    const clickedCell = event.target;
    const row = parseInt(clickedCell.dataset.row);
    const col = parseInt(clickedCell.dataset.col);

    if (selectedCell) {
        const sRow = parseInt(selectedCell.dataset.row);
        const sCol = parseInt(selectedCell.dataset.col);

        // 判斷是否為相鄰方塊 (水平或垂直)
        const isAdjacent = (Math.abs(row - sRow) === 1 && col === sCol) ||
                           (Math.abs(col - sCol) === 1 && row === sRow);

        if (isAdjacent) {
            swapCells(sRow, sCol, row, col);
            selectedCell.classList.remove('selected');
            selectedCell = null;

            setTimeout(() => {
                const matches = checkMatches();
                if (matches.length > 0) {
                    processMatches(matches);
                } else {
                    // 如果沒有匹配，換回去
                    swapCells(row, col, sRow, sCol);
                }
            }, 300); // 延遲一下讓交換動畫可見
        } else {
            // 重新選擇
            selectedCell.classList.remove('selected');
            selectedCell = clickedCell;
            selectedCell.classList.add('selected');
        }
    } else {
        // 第一次選擇方塊
        selectedCell = clickedCell;
        selectedCell.classList.add('selected');
    }
}

function swapCells(r1, c1, r2, c2) {
    const temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;
    renderBoard(); // 重新渲染棋盤
}

function checkMatches() {
    const matches = [];

    // 檢查水平匹配
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize - (matchMin - 1); c++) {
            const item = board[r][c];
            if (item === board[r][c + 1] && item === board[r][c + 2]) {
                let currentMatch = [{ row: r, col: c }, { row: r, col: c + 1 }, { row: r, col: c + 2 }];
                for (let k = 3; c + k < boardSize && board[r][c + k] === item; k++) {
                    currentMatch.push({ row: r, col: c + k });
                }
                if (currentMatch.length >= matchMin) {
                    matches.push(currentMatch);
                    c += currentMatch.length - 1; // 跳過已匹配的方塊
                }
            }
        }
    }

    // 檢查垂直匹配
    for (let c = 0; c < boardSize; c++) {
        for (let r = 0; r < boardSize - (matchMin - 1); r++) {
            const item = board[r][c];
            if (item === board[r + 1][c] && item === board[r + 2][c]) {
                let currentMatch = [{ row: r, col: c }, { row: r + 1, col: c }, { row: r + 2, col: c }];
                for (let k = 3; r + k < boardSize && board[r + k][c] === item; k++) {
                    currentMatch.push({ row: r + k, col: c });
                }
                if (currentMatch.length >= matchMin) {
                    matches.push(currentMatch);
                    r += currentMatch.length - 1; // 跳過已匹配的方塊
                }
            }
        }
    }
    return matches;
}

function processMatches(matches) {
    let cellsToClear = new Set();
    matches.forEach(match => {
        match.forEach(cell => {
            cellsToClear.add(`${cell.row}-${cell.col}`); // 修正這裡的語法
        });
        score += match.length * 10; // 每個消除的方塊加10分
    });
    scoreDisplay.textContent = score;

    // 清除匹配的方塊
    cellsToClear.forEach(coord => {
        const [r, c] = coord.split('-').map(Number);
        board[r][c] = null; // 將匹配的方塊設為 null
    });

    setTimeout(() => {
        dropItems(); // 讓上方方塊掉落
        fillBoard(); // 填充新方塊
        renderBoard(); // 重新渲染
        // 持續檢查和處理新的匹配
        const newMatches = checkMatches();
        if (newMatches.length > 0) {
            processMatches(newMatches);
        }
    }, 400); // 延遲一下讓清除動畫可見
}

function dropItems() {
    for (let c = 0; c < boardSize; c++) {
        let emptyCells = [];
        for (let r = boardSize - 1; r >= 0; r--) {
            if (board[r][c] === null) {
                emptyCells.push(r);
            } else if (emptyCells.length > 0) {
                const targetRow = emptyCells.shift();
                board[targetRow][c] = board[r][c];
                board[r][c] = null;
                emptyCells.push(r); // 將原來的空位重新加入
            }
        }
    }
}

function fillBoard() {
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (board[r][c] === null) {
                board[r][c] = getRandomItem();
            }
        }
    }
}

// --- 遊戲流程控制 ---

function startGame() {
    startButton.disabled = true;
    startButton.textContent = '遊戲中...';
    initializeBoard(); // 重新初始化遊戲
    timer = setInterval(() => {
        time--;
        timeDisplay.textContent = time;
        if (time <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(timer);
    alert(`遊戲結束！你的分數是：${score}`);
    startButton.disabled = false;
    startButton.textContent = '重新開始';
    saveScore(score);
    displayLeaderboard();
}

// --- 排行榜邏輯 ---

function getLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('match3Leaderboard')) || [];
    return leaderboard.sort((a, b) => b.score - a.score); // 依分數降序排列
}

function saveScore(newScore) {
    const name = prompt('請輸入你的
