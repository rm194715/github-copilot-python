import pytest

import app as app_module
import sudoku_logic


@pytest.fixture(autouse=True)
def reset_current_state():
    app_module.CURRENT["puzzle"] = None
    app_module.CURRENT["solution"] = None
    yield
    app_module.CURRENT["puzzle"] = None
    app_module.CURRENT["solution"] = None


@pytest.fixture()
def client():
    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as test_client:
        yield test_client


def test_index_page_renders(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Sudoku Game" in response.data


def test_new_game_creates_puzzle_and_solution(client):
    response = client.get("/new?clues=40")

    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload["puzzle"], list)
    assert len(payload["puzzle"]) == sudoku_logic.SIZE
    assert all(isinstance(row, list) for row in payload["puzzle"])
    assert app_module.CURRENT["puzzle"] is not None
    assert app_module.CURRENT["solution"] is not None


def test_check_solution_reports_incorrect_cells(client):
    solution = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
    ]
    app_module.CURRENT["solution"] = solution

    board = [row[:] for row in solution]
    board[0][0] = 9

    response = client.post("/check", json={"board": board})

    assert response.status_code == 200
    assert response.get_json() == {"incorrect": [[0, 0]]}


def test_check_solution_without_active_game_returns_error(client):
    response = client.post("/check", json={"board": [[0] * sudoku_logic.SIZE for _ in range(sudoku_logic.SIZE)]})

    assert response.status_code == 400
    assert response.get_json()["error"] == "No game in progress"


def test_generate_puzzle_returns_puzzle_and_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(35)

    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert all(len(row) == sudoku_logic.SIZE for row in solution)
    assert puzzle != solution


def test_generate_puzzle_supports_difficulty_and_unique_solution():
    puzzle, solution = sudoku_logic.generate_puzzle("medium")

    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    assert sudoku_logic.count_solutions(sudoku_logic.deep_copy(puzzle), 2) == 1

    clues = sum(cell != sudoku_logic.EMPTY for row in puzzle for cell in row)
    assert 35 <= clues <= 40


def test_new_game_endpoint_accepts_difficulty_parameter(client):
    response = client.get("/new?difficulty=hard")

    assert response.status_code == 200
    payload = response.get_json()
    clues = sum(cell != sudoku_logic.EMPTY for row in payload["puzzle"] for cell in row)
    assert 25 <= clues <= 30


def test_hint_endpoint_returns_a_single_correct_value_for_an_empty_cell(client):
    solution = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
    ]
    app_module.CURRENT["solution"] = solution

    board = [[0] * sudoku_logic.SIZE for _ in range(sudoku_logic.SIZE)]
    board[0][0] = 9

    response = client.post("/hint", json={"board": board})

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["row"] != 0 or payload["col"] != 0
    assert payload["value"] == solution[payload["row"]][payload["col"]]
