import os

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'const MODELS_TO_TRY = ["gemini-3.1-pro-preview", "gemini-2.5-flash", "gemini-2.5-pro"];',
    'const MODELS_TO_TRY = ["gemini-3.1-pro-preview", "gemini-3.6-flash", "gemini-3.1-flash-lite"];'
)

with open('server.ts', 'w') as f:
    f.write(content)
