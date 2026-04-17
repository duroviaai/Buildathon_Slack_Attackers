import os
from flask import Flask, send_from_directory
from backend.config import Config
from backend.extensions import db, cors, bcrypt

def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend")),
        static_url_path=""
    )
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    from backend.routes.auth_routes import auth_bp
    from backend.routes.chatbot_routes import chat_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(chat_bp, url_prefix="/api")

    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, "dashboard.html")

    @app.route("/dashboard")
    def dashboard():
        return send_from_directory(app.static_folder, "dashboard.html")

    @app.route("/<path:path>")
    def static_files(path):
        return send_from_directory(app.static_folder, path)

    with app.app_context():
        db.create_all()

    return app