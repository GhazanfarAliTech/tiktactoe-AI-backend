const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tic_tac_toe', // Replace with your database name
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Endpoint to get the AI's move
app.post('/api/move', (req, res) => {
  const { board } = req.body;

  // Find the best move using Alpha-Beta Pruning
  const bestMove = findBestMove(board);

  // Save the game state to the database
  const query = 'INSERT INTO games (board_state, move) VALUES (?, ?)';
  connection.query(query, [JSON.stringify(board), JSON.stringify(bestMove)], (err) => {
    if (err) {
      console.error('Error saving game state:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ move: bestMove });
  });
});

// Alpha-Beta Pruning logic
const findBestMove = (board) => {
  let bestScore = -Infinity;
  let bestMove = null;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === '') {
        board[i][j] = 'O';
        const score = alphaBeta(board, 0, false, -Infinity, Infinity);
        board[i][j] = '';

        if (score > bestScore) {
          bestScore = score;
          bestMove = { row: i, col: j };
        }
      }
    }
  }

  return bestMove;
};

const alphaBeta = (board, depth, isMaximizing, alpha, beta) => {
  const winner = checkWinner(board);
  if (winner !== null) {
    return winner === 'O' ? 10 - depth : depth - 10;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === '') {
          board[i][j] = 'O';
          const score = alphaBeta(board, depth + 1, false, alpha, beta);
          board[i][j] = '';
          bestScore = Math.max(score, bestScore);
          alpha = Math.max(alpha, bestScore);
          if (beta <= alpha) break;
        }
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === '') {
          board[i][j] = 'X';
          const score = alphaBeta(board, depth + 1, true, alpha, beta);
          board[i][j] = '';
          bestScore = Math.min(score, bestScore);
          beta = Math.min(beta, bestScore);
          if (beta <= alpha) break;
        }
      }
    }
    return bestScore;
  }
};

const checkWinner = (board) => {
  const lines = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (
      board[a[0]][a[1]] !== '' &&
      board[a[0]][a[1]] === board[b[0]][b[1]] &&
      board[a[0]][a[1]] === board[c[0]][c[1]]
    ) {
      return board[a[0]][a[1]];
    }
  }

  if (board.flat().every(cell => cell !== '')) {
    return 'tie';
  }

  return null;
};

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});