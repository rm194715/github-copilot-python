from flask import Blueprint, jsonify, render_template, request

import sudoku_logic
from game_state import CURRENT

sudoku_bp = Blueprint("sudoku", __name__)


@sudoku_bp.route("/")
def index():
    return render_template("index.html")


@sudoku_bp.route("/new")
def new_game():
    difficulty = request.args.get("difficulty")
    clues = request.args.get("clues")
    puzzle, solution = sudoku_logic.generate_puzzle(
        sudoku_logic.get_clue_count_for_difficulty(difficulty, clues)
    )
    CURRENT["puzzle"] = puzzle
    CURRENT["solution"] = solution
    return jsonify({"puzzle": puzzle})


@sudoku_bp.route("/check", methods=["POST"])
def check_solution():
    data = request.json
    board = data.get("board")
    solution = CURRENT.get("solution")
    if solution is None:
        return jsonify({"error": "No game in progress"}), 400

    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if board[i][j] != solution[i][j]:
                incorrect.append([i, j])
    return jsonify({"incorrect": incorrect})


@sudoku_bp.route("/hint", methods=["POST"])
def provide_hint():
    data = request.json
    board = data.get("board")
    solution = CURRENT.get("solution")
    if solution is None:
        return jsonify({"error": "No game in progress"}), 400

    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if board[i][j] == sudoku_logic.EMPTY:
                return jsonify({"row": i, "col": j, "value": solution[i][j]})

    return jsonify({"error": "No empty cells left"}), 400
