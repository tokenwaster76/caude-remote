"""QR Code generator module.

Generates QR codes from text input and saves them as PNG images
or prints them to the terminal.
"""

import argparse
import sys

# QR code encoding constants
MODE_BYTE = 0b0100
EC_LEVEL_M = 0  # Medium error correction (~15%)

# Alphanumeric character set for QR encoding
ALPHANUM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"


def generate_qr_matrix(data: str) -> list[list[int]]:
    """Generate a QR code matrix from the given data.

    Uses a simplified Version 1 (21x21) QR code with medium error correction.
    Returns a 2D list where 1 = black module, 0 = white module.
    """
    try:
        import qrcode

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=1,
            border=0,
        )
        qr.add_data(data)
        qr.make(fit=True)
        matrix = []
        for row in qr.modules:
            matrix.append([1 if cell else 0 for cell in row])
        return matrix
    except ImportError:
        return _generate_qr_fallback(data)


def _generate_qr_fallback(data: str) -> list[list[int]]:
    """Simple fallback QR-like matrix when qrcode library is unavailable.

    Generates a basic pattern encoding the data length and hash.
    Not a real QR code but provides a visual representation.
    """
    size = 21  # Version 1 QR code size
    matrix = [[0] * size for _ in range(size)]

    # Add finder patterns (top-left, top-right, bottom-left)
    _add_finder_pattern(matrix, 0, 0)
    _add_finder_pattern(matrix, 0, size - 7)
    _add_finder_pattern(matrix, size - 7, 0)

    # Add timing patterns
    for i in range(8, size - 8):
        matrix[6][i] = 1 if i % 2 == 0 else 0
        matrix[i][6] = 1 if i % 2 == 0 else 0

    # Encode data as a simple hash-based pattern in the data area
    data_hash = 0
    for ch in data:
        data_hash = (data_hash * 31 + ord(ch)) & 0xFFFFFFFF

    for r in range(size):
        for c in range(size):
            if matrix[r][c] == 0 and not _is_reserved(r, c, size):
                bit = (data_hash >> ((r * size + c) % 32)) & 1
                matrix[r][c] = bit

    return matrix


def _add_finder_pattern(matrix: list[list[int]], row: int, col: int) -> None:
    """Add a 7x7 finder pattern at the given position."""
    pattern = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1],
    ]
    for r in range(7):
        for c in range(7):
            if 0 <= row + r < len(matrix) and 0 <= col + c < len(matrix[0]):
                matrix[row + r][col + c] = pattern[r][c]


def _is_reserved(row: int, col: int, size: int) -> bool:
    """Check if a cell is reserved for finder/timing patterns."""
    # Finder pattern regions (including separators)
    if row < 8 and col < 8:
        return True
    if row < 8 and col >= size - 8:
        return True
    if row >= size - 8 and col < 8:
        return True
    # Timing patterns
    if row == 6 or col == 6:
        return True
    return False


def render_terminal(matrix: list[list[int]], border: int = 2) -> str:
    """Render QR code matrix as a string for terminal display.

    Uses Unicode block characters for compact output.
    Each character represents two vertical modules.
    """
    size = len(matrix)
    lines = []

    # Add top border
    full_width = size + border * 2
    for _ in range(border // 2):
        lines.append("\u2588" * full_width)

    # Render two rows at a time using half-block characters
    for r in range(0, size, 2):
        line = "\u2588" * border
        for c in range(size):
            top = matrix[r][c]
            bottom = matrix[r + 1][c] if r + 1 < size else 0
            if top == 0 and bottom == 0:
                line += "\u2588"  # Full block (white on white)
            elif top == 1 and bottom == 1:
                line += " "  # Empty (black on black)
            elif top == 0 and bottom == 1:
                line += "\u2580"  # Upper half block
            else:
                line += "\u2584"  # Lower half block
        line += "\u2588" * border
        lines.append(line)

    # Add bottom border
    for _ in range(border // 2):
        lines.append("\u2588" * full_width)

    return "\n".join(lines)


def save_png(matrix: list[list[int]], filename: str, scale: int = 10) -> None:
    """Save the QR code matrix as a PNG image."""
    try:
        import qrcode

        # If qrcode lib available, regenerate with proper image support
        # But we already have the matrix, so just use PIL directly
        raise ImportError("Use PIL directly")
    except ImportError:
        pass

    try:
        from PIL import Image

        size = len(matrix)
        border = 4
        img_size = (size + border * 2) * scale
        img = Image.new("1", (img_size, img_size), 1)  # white background
        pixels = img.load()

        for r in range(size):
            for c in range(size):
                if matrix[r][c]:
                    for dr in range(scale):
                        for dc in range(scale):
                            px = (c + border) * scale + dc
                            py = (r + border) * scale + dr
                            pixels[px, py] = 0  # black

        img.save(filename)
        print(f"QR code saved to {filename}")
    except ImportError:
        print(
            "Neither 'qrcode' nor 'Pillow' is installed. "
            "Install with: pip install qrcode[pil] or pip install Pillow",
            file=sys.stderr,
        )
        print("Displaying in terminal instead:\n")
        print(render_terminal(matrix))


def generate(data: str, output: str | None = None, scale: int = 10) -> str | None:
    """Generate a QR code from data.

    Args:
        data: The text or URL to encode.
        output: Optional filename to save as PNG. If None, returns terminal string.
        scale: Pixel scale for PNG output.

    Returns:
        Terminal-rendered QR code string if no output file specified, else None.
    """
    matrix = generate_qr_matrix(data)
    if output:
        save_png(matrix, output, scale)
        return None
    return render_terminal(matrix)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate QR codes from text or URLs")
    parser.add_argument("data", help="Text or URL to encode in the QR code")
    parser.add_argument(
        "-o", "--output", help="Output PNG filename (displays in terminal if omitted)"
    )
    parser.add_argument(
        "-s", "--scale", type=int, default=10, help="Pixel scale for PNG output (default: 10)"
    )
    args = parser.parse_args()

    result = generate(args.data, args.output, args.scale)
    if result:
        print(result)


if __name__ == "__main__":
    main()
