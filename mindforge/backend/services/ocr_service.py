import io

def extract_text_from_file(file_storage) -> str:
    filename = file_storage.filename.lower()

    if filename.endswith(".pdf"):
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(file_storage.read())) as pdf:
                return "\n".join(p.extract_text() or "" for p in pdf.pages).strip()
        except Exception as e:
            return f"[PDF read error: {e}]"

    if filename.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif")):
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(io.BytesIO(file_storage.read()))
            return pytesseract.image_to_string(img).strip()
        except Exception as e:
            return f"[Image OCR error: {e}]"

    # Plain text / code files
    try:
        return file_storage.read().decode("utf-8", errors="ignore").strip()
    except Exception as e:
        return f"[File read error: {e}]"
