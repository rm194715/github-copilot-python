from flask import Flask

from game_state import CURRENT
from routes import sudoku_bp


def create_app():
    app = Flask(__name__)
    app.register_blueprint(sudoku_bp)
    return app


app = create_app()


if __name__ == '__main__':
    # app.run(debug=True)
    app.run(debug=True, port=5001)