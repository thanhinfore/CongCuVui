// ================================
// CỜ CARO 10.0 - MCTS
// Version: 10.0.0
// Monte Carlo Tree Search (V9.1)
// ================================

import { checkWinCondition, isTerminalState } from '../core/rules.js';
import { getValidMoves, makeMove, undoMove, copyBoard } from '../core/board.js';
import { MCTS } from '../config/constants.js';

/**
 * MCTS Node
 */
class MCTSNode {
    constructor(board, player, move = null, parent = null) {
        this.board = copyBoard(board);
        this.player = player;
        this.move = move;
        this.parent = parent;
        this.children = [];
        this.wins = 0;
        this.visits = 0;
        this.untriedMoves = null;
    }

    ucb1(explorationConstant = MCTS.EXPLORATION_CONSTANT) {
        if (this.visits === 0) return Infinity;
        const exploitation = this.wins / this.visits;
        const exploration = Math.sqrt(Math.log(this.parent.visits) / this.visits);
        return exploitation + explorationConstant * exploration;
    }

    isFullyExpanded() {
        return this.untriedMoves && this.untriedMoves.length === 0;
    }

    isTerminal() {
        return isTerminalState(this.board);
    }
}

/**
 * MCTS Search
 */
export function mctsSearch(board, player, numSimulations = MCTS.DEFAULT_SIMULATIONS) {
    const root = new MCTSNode(board, player);

    for (let i = 0; i < numSimulations; i++) {
        let node = selectNode(root);

        if (!node.isTerminal() && node.visits > 0) {
            node = expandNode(node);
        }

        const result = simulateGame(node);
        backpropagate(node, result);
    }

    // Select best child
    const bestChild = root.children.reduce((best, child) =>
        child.visits > best.visits ? child : best
    );

    return bestChild.move;
}

/**
 * Selection phase - select most promising node
 */
function selectNode(node) {
    while (!node.isTerminal()) {
        if (!node.isFullyExpanded()) return node;

        node = node.children.reduce((best, child) =>
            child.ucb1() > best.ucb1() ? child : best
        );
    }
    return node;
}

/**
 * Expansion phase - add new child
 */
function expandNode(node) {
    if (!node.untriedMoves) {
        node.untriedMoves = getValidMoves(node.board);
    }

    if (node.untriedMoves.length === 0) return node;

    const move = node.untriedMoves.pop();
    const newBoard = copyBoard(node.board);
    makeMove(newBoard, move.row, move.col, node.player);

    const opponent = node.player === 'X' ? 'O' : 'X';
    const child = new MCTSNode(newBoard, opponent, move, node);
    node.children.push(child);

    return child;
}

/**
 * Simulation phase - play random game
 */
function simulateGame(node) {
    const board = copyBoard(node.board);
    let currentPlayer = node.player;

    while (!isTerminalState(board)) {
        const moves = getValidMoves(board);
        if (moves.length === 0) break;

        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        makeMove(board, randomMove.row, randomMove.col, currentPlayer);

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }

    const result = checkWinCondition(board);
    return result ? result.winner : null;
}

/**
 * Backpropagation phase - update statistics
 */
function backpropagate(node, winner) {
    while (node !== null) {
        node.visits++;
        if (winner === node.player) {
            node.wins++;
        }
        node = node.parent;
    }
}
