import os

with open('server.ts', 'r') as f:
    content = f.read()

old_chunk = """
    // If rawText is provided, chunk it to avoid output token limits (8192 tokens max)
    const text = rawText || "";
    const lines = text.split(/\\r?\\n/).filter((l: string) => l.trim().length > 0);
    const CHUNK_SIZE = 40; // ~40 lines per chunk
    let allRecords: any[] = [];
"""

new_chunk = """
    // If rawText is provided, chunk it to avoid output token limits (8192 tokens max)
    const text = rawText || "";
    // Filter out very short lines (headers, page numbers) to pack more real records into each chunk
    const lines = text.split(/\\r?\\n/).filter((l: string) => l.trim().length > 15 && /\d/.test(l));
    const CHUNK_SIZE = 100; // 100 lines per chunk safely generates ~25,000 chars of JSON (well within 8192 token limit)
    let allRecords: any[] = [];
"""

content = content.replace(old_chunk.strip(), new_chunk.strip())

with open('server.ts', 'w') as f:
    f.write(content)
