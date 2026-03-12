# CLAUDE.md

## Project Overview

A Python QR code generator that encodes text/URLs into QR codes, with terminal display and PNG export support. Single-module project (`qr_code.py`) with no build system or framework.

## Repository Structure

```
qr_code.py   # All source code — QR generation, terminal rendering, PNG export, CLI
README.md     # Usage documentation
```

## Key Architecture

- **`generate_qr_matrix(data)`** — Primary QR encoder. Uses `qrcode` library if available, otherwise falls back to `_generate_qr_fallback()` (hash-based approximation, not standards-compliant).
- **`render_terminal(matrix)`** — Renders matrix to string using Unicode half-block characters.
- **`save_png(matrix, filename, scale)`** — Saves matrix as PNG using Pillow. Falls back to terminal display if Pillow unavailable.
- **`generate(data, output, scale)`** — Public API entry point. Returns terminal string or saves PNG.
- **`main()`** — CLI entry point via `argparse`.

## Development Commands

```bash
# Run directly (terminal output)
python qr_code.py "https://example.com"

# Save as PNG
python qr_code.py "text" -o output.png --scale 20

# Use as library
python -c "from qr_code import generate; print(generate('hello'))"
```

## Dependencies

- **No required dependencies** — works standalone with built-in fallback encoder
- **Optional:** `qrcode[pil]` for standards-compliant QR codes; `Pillow` for PNG export

## Conventions

- Python 3.10+ (uses `str | None` union syntax)
- Type hints on all public functions
- Docstrings on all public functions
- Single-file module — keep everything in `qr_code.py` unless complexity warrants splitting
- No tests currently exist in the repo
