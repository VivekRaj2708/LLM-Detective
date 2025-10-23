import io
import random
import fitz  # PyMuPDF

def highlight_sentences(pdf_input, pdf_output, highlights):
    """
    Highlights sentences in a PDF with different colors.

    Args:
        pdf_input (str): Path to the input PDF.
        pdf_output (str): Path to save the highlighted PDF.
        highlights (list of tuples): Each tuple is (sentence, color), 
                                     color as (R,G,B), values 0-1
                                     Example: ("Python", (1,0,0)) -> red
    """
    doc = fitz.open(pdf_input)

    for page in doc:
        text_instances = page.search_for("")  # initialize

        for sentence, color in highlights:
            matches = page.search_for(sentence)
            for inst in matches:
                # highlight rectangle with the given color
                highlight = page.add_highlight_annot(inst)
                highlight.set_colors(stroke=color)
                highlight.update()

    doc.save(pdf_output)
    print(f"✅ Saved highlighted PDF to {pdf_output}")

def highlight_paragraphs(pdf_bytes: bytes) -> bytes:
    # Load PDF from bytes
    doc = fitz.open("pdf", pdf_bytes)
    colors = [
        (1, 1, 0),   # yellow
        (0, 1, 1),   # cyan
        (1, 0.6, 0), # orange
        (0.7, 0.9, 0.2)  # lime
    ]

    for page in doc:
        blocks = page.get_text("blocks")
        chosen = [b for b in blocks if b[4].strip()]

        if not chosen:
            continue


        for i, para in enumerate(chosen):
            x0, y0, x1, y1, *_ = para
            highlight = page.add_highlight_annot(fitz.Rect(x0, y0, x1, y1))
            highlight.set_colors(stroke=colors[i % len(colors)])
            highlight.update()

    output_stream = io.BytesIO()
    doc.save(output_stream)
    doc.close()

    return output_stream.getvalue()

if __name__ == "__main__":
    # --- Example Usage ---
    highlights = [
        ("Pablo  Neruda", (1, 0, 0)),          # red
        ("Now we will count to twelve", (0, 1, 0)),       # green
        ("What I want should not be", (0, 0, 1)),             # blue
    ]

    highlight_sentences("./Test/Data/XMLtest.pdf", "./Test/Data/XMLtesthighlighted.pdf", highlights)