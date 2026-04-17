from flask import Flask
from .config import Config
from .extensions import db, jwt, cors, bcrypt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}},
                  supports_credentials=True)

    from .routes.auth_routes import auth_bp
    from .routes.learner_profiling_routes import learner_profiling_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(learner_profiling_bp, url_prefix="/api/learner-profiling")

    with app.app_context():
        from .models.learner_profile_model import LearnerProfile  # noqa: F401
        db.create_all()

    return app
