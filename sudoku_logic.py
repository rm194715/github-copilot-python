import copy
import random

SIZE = 9
EMPTY = 0


def deep_copy(board):
    return copy.deepcopy(board)


def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def is_safe(board, row, col, num):
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False

    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True


def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True


def find_empty(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None


def count_solutions(board, limit=2):
    empty_position = find_empty(board)
    if empty_position is None:
        return 1

    row, col = empty_position
    possible_values = list(range(1, SIZE + 1))
    random.shuffle(possible_values)

    solutions = 0
    for candidate in possible_values:
        if not is_safe(board, row, col, candidate):
            continue
        board[row][col] = candidate
        solutions += count_solutions(board, limit)
        board[row][col] = EMPTY
        if solutions >= limit:
            return limit
    return solutions


def get_clue_count_for_difficulty(difficulty, clues=None):
    if clues is not None:
        return int(clues)

    difficulty_map = {
        "easy": (45, 50),
        "medium": (35, 40),
        "hard": (25, 30),
    }
    if difficulty is None:
        return 35

    normalized = str(difficulty).strip().lower()
    if normalized in difficulty_map:
        lower, upper = difficulty_map[normalized]
        return random.randint(lower, upper)
    return int(difficulty)


def remove_cells(board, clues):
    target_clues = clues
    cells = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(cells)

    for row, col in cells:
        if sum(cell != EMPTY for inner_row in board for cell in inner_row) <= target_clues:
            break
        if board[row][col] == EMPTY:
            continue

        original_value = board[row][col]
        board[row][col] = EMPTY
        if count_solutions(deep_copy(board), 2) != 1:
            board[row][col] = original_value


def generate_puzzle(clues=35):
    target_clues = get_clue_count_for_difficulty(clues)
    if target_clues is None:
        target_clues = 35

    while True:
        board = create_empty_board()
        fill_board(board)
        solution = deep_copy(board)

        remove_cells(board, target_clues)
        puzzle = deep_copy(board)

        if count_solutions(deep_copy(puzzle), 2) == 1:
            return puzzle, solution
