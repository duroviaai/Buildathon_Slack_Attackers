import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.notes_model import Note

notes_bp = Blueprint("notes", __name__)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "notes")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"}

def _allowed(filename):
    return os.path.splitext(filename.lower())[1] in ALLOWED_EXTENSIONS


@notes_bp.get("/notes")
@jwt_required()
def list_notes():
    user_id = get_jwt_identity()
    notes = Note.query.filter_by(user_id=user_id).order_by(Note.updated_at.desc()).all()
    return jsonify([n.to_dict() for n in notes])


@notes_bp.post("/notes")
@jwt_required()
def create_note():
    user_id = get_jwt_identity()
    title   = (request.form.get("title") or "").strip()
    content = (request.form.get("content") or "").strip()

    if not title:
        return jsonify({"error": "Title is required"}), 400

    note = Note(user_id=user_id, title=title, content=content)

    f = request.files.get("file")
    if f and f.filename and _allowed(f.filename):
        safe_name = f"{user_id}_{int(__import__('time').time())}_{f.filename}"
        path = os.path.join(UPLOAD_DIR, safe_name)
        f.save(path)
        note.file_name = f.filename
        note.file_path = path

    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_dict()), 201


@notes_bp.put("/notes/<int:note_id>")
@jwt_required()
def update_note(note_id):
    user_id = get_jwt_identity()
    note = Note.query.filter_by(id=note_id, user_id=user_id).first_or_404()

    title   = (request.form.get("title") or "").strip()
    content = (request.form.get("content") or "").strip()

    if title:
        note.title = title
    note.content = content

    f = request.files.get("file")
    if f and f.filename and _allowed(f.filename):
        if note.file_path and os.path.exists(note.file_path):
            os.remove(note.file_path)
        safe_name = f"{user_id}_{int(__import__('time').time())}_{f.filename}"
        path = os.path.join(UPLOAD_DIR, safe_name)
        f.save(path)
        note.file_name = f.filename
        note.file_path = path

    from datetime import datetime, timezone
    note.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(note.to_dict())


@notes_bp.delete("/notes/<int:note_id>")
@jwt_required()
def delete_note(note_id):
    user_id = get_jwt_identity()
    note = Note.query.filter_by(id=note_id, user_id=user_id).first_or_404()
    if note.file_path and os.path.exists(note.file_path):
        os.remove(note.file_path)
    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Deleted"})


@notes_bp.get("/notes/<int:note_id>/file")
@jwt_required()
def download_file(note_id):
    user_id = get_jwt_identity()
    note = Note.query.filter_by(id=note_id, user_id=user_id).first_or_404()
    if not note.file_path or not os.path.exists(note.file_path):
        return jsonify({"error": "No file"}), 404
    return send_file(note.file_path, download_name=note.file_name, as_attachment=True)
