# QR Code Generator

A Python QR code generator that can output to the terminal or save as PNG.

## Usage

```bash
# Display QR code in terminal
python qr_code.py "https://example.com"

# Save as PNG image
python qr_code.py "Hello World" -o qr.png

# Customize PNG scale
python qr_code.py "data" -o qr.png --scale 20
```

## As a library

```python
from qr_code import generate

# Get terminal-printable QR code
print(generate("https://example.com"))

# Save to file
generate("https://example.com", output="qr.png")
```

## Optional dependencies

- `qrcode[pil]` — for standards-compliant QR codes and PNG export
- `Pillow` — for PNG export with the built-in fallback encoder

Without these, the tool uses a built-in encoder and displays in the terminal.
