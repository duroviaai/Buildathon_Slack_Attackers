from flask import Flask
from .config import Config
from .extensions import db, jwt, cors, bcrypt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}},
                  supports_credentials=True)

    # Register blueprints
    from .routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # Create tables
    with app.app_context():
        db.create_all()

    return app
