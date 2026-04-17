import os
from flask import Flask, send_from_directory
from .config import Config
from .extensions import db, jwt, cors, bcrypt

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

def create_app():
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints
    from .routes.auth_routes import auth_bp
    from .routes.chatbot_routes import chat_bp
    from .routes.flashcard_routes import flashcard_bp
    from .routes.notes_routes import notes_bp
    from .routes.quiz_routes import quiz_bp
    from .routes.streak_routes import streak_bp
    from .routes.learner_profiling_routes import learner_profiling_bp
    from .routes.teacher_routes import teacher_bp
    from .routes.feedback_routes import feedback_bp
    from .routes.user_routes import user_bp

    app.register_blueprint(auth_bp,              url_prefix="/api/auth")
    app.register_blueprint(chat_bp,              url_prefix="/api")
    app.register_blueprint(flashcard_bp,         url_prefix="/api")
    app.register_blueprint(notes_bp,             url_prefix="/api")
    app.register_blueprint(quiz_bp,              url_prefix="/api")
    app.register_blueprint(streak_bp,            url_prefix="/api")
    app.register_blueprint(learner_profiling_bp, url_prefix="/api/learner-profiling")
    app.register_blueprint(teacher_bp,           url_prefix="/api")
    app.register_blueprint(feedback_bp,          url_prefix="/api")
    app.register_blueprint(user_bp,              url_prefix="/api")

    # Serve frontend pages
    @app.route("/")
    @app.route("/<path:filename>")
    def serve_frontend(filename="index.html"):
        if os.path.exists(os.path.join(FRONTEND_DIR, filename)):
            return send_from_directory(FRONTEND_DIR, filename)
        return send_from_directory(FRONTEND_DIR, "index.html")

    # Create tables
    with app.app_context():
        db.create_all()

    return app
