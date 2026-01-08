const GameBoard = (() => {
    const board = ["", "", "", "", "", "", "", "", ""];

    const getBoard = () => board;

    const placeMark = (index, mark) => {
        if (board[index] !== "") {
            return false;
        }
        board[index] = mark;
        return true;
    };

    const reset = () => {
        for (let i = 0; i < board.length; i++) {
            board[i] = "";
        }
    };

    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    const checkWin = (mark) => {
        return winningCombinations.some(combination => 
            combination.every(index => board[index] === mark)
        );
    };

    const checkTie = () => {
        return board.every(cell => cell !== "");
    };

    const getWinningCombination = (mark) => {
        return winningCombinations.find(combination => 
            combination.every(index => board[index] === mark)
        );
    };

    return { getBoard, placeMark, reset, checkWin, checkTie, getWinningCombination };
})();

const Player = (name, mark, isBot = false) => {
    let score = 0;

    const getScore = () => score;
    const incrementScore = () => score++;
    const resetScore = () => score = 0;

    return { name, mark, isBot, getScore, incrementScore, resetScore };
};

const GameController = (() => {
    let players = [];
    let currentPlayer;
    let gameOver = false;
    let difficulty = 'easy';

    const startGame = ({ opponent, mode }) => {
        GameBoard.reset();
        gameOver = false;
        difficulty = mode || 'easy';

        if (opponent === "human") {
            players = [
                Player("Player X", "X"),
                Player("Player O", "O")
            ];
        } else {
            players = [
                Player("Player X", "X"),
                Player("Computer", "O", true)
            ];
        }

        currentPlayer = players[0];
        DisplayController.updateBoard();
        DisplayController.updateTurnIndicator();
    };

    const playRound = (index) => {
        if (gameOver) return;

        const success = GameBoard.placeMark(index, currentPlayer.mark);
        if (!success) return;

        DisplayController.updateBoard();

        if (GameBoard.checkWin(currentPlayer.mark)) {
            gameOver = true;
            currentPlayer.incrementScore();
            DisplayController.updateScores();
            const winningCombo = GameBoard.getWinningCombination(currentPlayer.mark);
            DisplayController.highlightWinner(winningCombo);
            DisplayController.showGameResult(`${currentPlayer.name} Menang! 🎉`);
            return;
        }

        if (GameBoard.checkTie()) {
            gameOver = true;
            DisplayController.showGameResult("Permainan Seri! 🤝");
            return;
        }

        switchPlayer();
        DisplayController.updateTurnIndicator();

        if (currentPlayer.isBot) {
            DisplayController.disableCells();
            setTimeout(() => {
                botMove();
                DisplayController.enableCells();
            }, 500);
        }
    };

    const switchPlayer = () => {
        currentPlayer = currentPlayer === players[0] ? players[1] : players[0];
    };

    const botMove = () => {
        let index;

        switch(difficulty) {
            case 'hard':
                index = getBestMove();
                break;
            case 'medium':
                index = Math.random() < 0.5 ? getBestMove() : getRandomMove();
                break;
            case 'easy':
            default:
                index = getRandomMove();
                break;
        }

        playRound(index);
    };

    const getRandomMove = () => {
        const emptyIndexes = GameBoard.getBoard()
            .map((cell, index) => cell === "" ? index : null)
            .filter(i => i !== null);

        return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
    };

    const getBestMove = () => {
        const board = GameBoard.getBoard();
        let bestScore = -Infinity;
        let bestMove;

        for (let i = 0; i < board.length; i++) {
            if (board[i] === "") {
                board[i] = currentPlayer.mark;
                let score = minimax(board, 0, false);
                board[i] = "";

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    };

    const minimax = (board, depth, isMaximizing) => {
        const botMark = currentPlayer.mark;
        const humanMark = currentPlayer.mark === "X" ? "O" : "X";

        if (GameBoard.checkWin(botMark)) return 10 - depth;
        if (GameBoard.checkWin(humanMark)) return depth - 10;
        if (GameBoard.checkTie()) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === "") {
                    board[i] = botMark;
                    let score = minimax(board, depth + 1, false);
                    board[i] = "";
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === "") {
                    board[i] = humanMark;
                    let score = minimax(board, depth + 1, true);
                    board[i] = "";
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    };

    const resetGame = () => {
        GameBoard.reset();
        gameOver = false;
        currentPlayer = players[0];
        DisplayController.updateBoard();
        DisplayController.updateTurnIndicator();
        DisplayController.clearHighlight();
    };

    const getPlayers = () => players;
    const getCurrentPlayer = () => currentPlayer;
    const isGameOver = () => gameOver;

    return { startGame, playRound, resetGame, getPlayers, getCurrentPlayer, isGameOver };
})();

const DisplayController = (() => {
    const cells = document.querySelectorAll('.cell');
    const scoreXElement = document.getElementById('score-x');
    const scoreOElement = document.getElementById('score-o');
    const gameSetup = document.getElementById('gameSetup');
    const gameArena = document.getElementById('gameArena');
    const startGameBtn = document.getElementById('startGameBtn');
    const resetBtn = document.querySelector('.reset-btn');
    const darkModeBtn = document.querySelector('.dark-mode');
    const difficultyButtons = document.querySelectorAll('[data-mode]');
    const opponentRadios = document.querySelectorAll('input[name="opponent"]');
    const difficultySection = document.querySelector('.difficulty-section');

    let selectedMode = null;
    let selectedOpponent = 'human';

    const init = () => {
        cells.forEach(cell => {
            cell.addEventListener('click', handleCellClick);
        });

        startGameBtn.addEventListener('click', handleStartGame);
        resetBtn.addEventListener('click', handleReset);
        darkModeBtn.addEventListener('click', toggleDarkMode);

        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', handleDifficultySelect);
        });

        opponentRadios.forEach(radio => {
            radio.addEventListener('change', handleOpponentChange);
        });

        // Hide difficulty section initially
        difficultySection.style.display = 'none';
        updateStartButtonState();
    };

    const handleCellClick = (e) => {
        const index = parseInt(e.target.dataset.index);
        if (!GameController.isGameOver() && !e.target.disabled) {
            GameController.playRound(index);
        }
    };

    const handleStartGame = () => {
        GameController.startGame({
            opponent: selectedOpponent,
            mode: selectedMode
        });
        gameSetup.classList.add('hidden');
        gameArena.classList.remove('hidden');
        resetBtn.disabled = false;
    };

    const handleReset = () => {
        GameController.resetGame();
    };

    const handleDifficultySelect = (e) => {
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        selectedMode = e.target.dataset.mode;
        updateStartButtonState();
    };

    const handleOpponentChange = (e) => {
        selectedOpponent = e.target.value;
        
        if (selectedOpponent === 'computer') {
            difficultySection.style.display = 'flex';
            selectedMode = null;
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
        } else {
            difficultySection.style.display = 'none';
            selectedMode = null;
        }
        
        updateStartButtonState();
    };

    const updateStartButtonState = () => {
        if (selectedOpponent === 'human') {
            startGameBtn.disabled = false;
        } else {
            startGameBtn.disabled = selectedMode === null;
        }
    };

    const toggleDarkMode = () => {
        document.body.classList.toggle('dark-theme');
        const icon = darkModeBtn.querySelector('i');
        
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    };

    const updateBoard = () => {
        const board = GameBoard.getBoard();
        cells.forEach((cell, index) => {
            cell.textContent = board[index];
            cell.dataset.mark = board[index];
            cell.disabled = board[index] !== "" || GameController.isGameOver();
        });
    };

    const updateScores = () => {
        const players = GameController.getPlayers();
        scoreXElement.textContent = players[0].getScore();
        scoreOElement.textContent = players[1].getScore();
    };

    const updateTurnIndicator = () => {
        const currentPlayer = GameController.getCurrentPlayer();
        const playerXCard = document.querySelector('.player-x');
        const playerOCard = document.querySelector('.player-o');

        if (currentPlayer.mark === 'X') {
            playerXCard.style.transform = 'scale(1.05)';
            playerXCard.style.boxShadow = '0 8px 16px rgba(99, 102, 241, 0.3)';
            playerOCard.style.transform = 'scale(1)';
            playerOCard.style.boxShadow = '';
        } else {
            playerOCard.style.transform = 'scale(1.05)';
            playerOCard.style.boxShadow = '0 8px 16px rgba(236, 72, 153, 0.3)';
            playerXCard.style.transform = 'scale(1)';
            playerXCard.style.boxShadow = '';
        }
    };

    const highlightWinner = (winningCombo) => {
        winningCombo.forEach(index => {
            cells[index].style.background = 'linear-gradient(135deg, #10b981, #34d399)';
            cells[index].style.transform = 'scale(1.1)';
            cells[index].style.color = '#ffffff';
        });
    };

    const clearHighlight = () => {
        cells.forEach(cell => {
            cell.style.background = '';
            cell.style.transform = '';
            cell.style.color = '';
        });
    };

    const disableCells = () => {
        cells.forEach(cell => {
            if (cell.textContent === '') {
                cell.style.opacity = '0.5';
                cell.style.cursor = 'wait';
            }
        });
    };

    const enableCells = () => {
        cells.forEach(cell => {
            cell.style.opacity = '';
            cell.style.cursor = '';
        });
    };

    const showGameResult = (message) => {
        setTimeout(() => {
            const result = confirm(`${message}\n\nMain lagi?`);
            if (result) {
                handleReset();
            }
        }, 300);
    };

    init();

    return { 
        updateBoard, 
        updateScores, 
        updateTurnIndicator, 
        highlightWinner, 
        clearHighlight, 
        showGameResult,
        disableCells,
        enableCells
    };
})();
