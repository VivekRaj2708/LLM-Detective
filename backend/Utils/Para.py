import re

def split_paragraph(paragraph: str, max_words: int = 50):
    # Split paragraph into tokens (words and separators)
    tokens = re.split(r'(\s+|[.;\n])', paragraph)
    chunks = []
    current_chunk = []
    word_count = 0

    for token in tokens:
        # Count words only (ignore whitespace and punctuation)
        if re.match(r'\w+', token):
            word_count += 1

        current_chunk.append(token)

        # If chunk exceeds limit and we hit a stop token, split
        if word_count >= max_words and token in ['.', ';', '\n']:
            chunks.append(''.join(current_chunk).strip())
            current_chunk = []
            word_count = 0

    # Add remaining words if any
    if current_chunk:
        chunks.append(''.join(current_chunk).strip())

    return chunks
