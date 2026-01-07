
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
    }

    return {getBoard, placeMark, reset, checkWin, checkTie};
})();

const Player = (name, mark, isBot = false) => {
    return {name, mark, isBot};
}

const GameController = (() => {
    let players = [];
    let currentPlayer;
    let gameOver = false;

    const startGame = ({opponent, mode}) => {
        const player1 = Player("Player 1", "X");
        let player2;