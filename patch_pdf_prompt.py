import os

with open('server.ts', 'r') as f:
    content = f.read()

old_prompt = """
        const prompt = `You are an ultra-high-accuracy data extraction engine. You are extracting electricity department consumer reports.
CRITICAL RULE: NEVER GUESS. NEVER SILENTLY CORRECT. NEVER SHIFT COLUMNS.
If the mobile number is missing (e.g. CHIRIPILLI//1/01/1.26), extract mobile as empty string. Do not shift the category or status into the mobile field.
If a value is negative (e.g. -196), YOU MUST INCLUDE THE MINUS SIGN.
Extract all consumer records on this page into a JSON array. 
For each record, provide:
- uscno: string (the Uscno identifier, preserve leading zeros)
- dcDate: string (DC-Dt)
- name: string
- mobile: string (if missing, return empty string)
- category: string (Cat)
- status: string (Sta)
- load: string (Load)
- poleRaw: string (The exact original string for Poleno(Unts))
- poleNumber: string (The extracted pole part, if unclear return empty string)
- units: string (The extracted units part inside parentheses, if unclear return empty string)
- lpdt: string
- arr: number (Arrears, preserving negatives)
- cmd: number (Current Month Demand)
- totalAmount: number (TotAmt)
- acd: number
- rawRow: string (The raw text of the entire row for auditing)`;
"""

new_prompt = """
        const prompt = `You are an ultra-high-accuracy data extraction engine processing electricity department consumer reports.
CRITICAL RULES:
1. YOU MUST EXTRACT EVERY SINGLE ROW on this page. Do not miss any consumers! A typical page has dozens of rows.
2. NEVER GUESS or SILENTLY CORRECT.
3. HANDLING MISSING MOBILE NUMBERS: Many consumers do NOT have a mobile number listed. (e.g., "SANGAM MAS//1/01/.26"). When the mobile number is missing or is just a series of slashes, you MUST extract the mobile field as "No contact number" (or an empty string). Do NOT shift the Category or Status into the mobile field.
4. If a value is negative (e.g. -196), YOU MUST INCLUDE THE MINUS SIGN.

Extract all consumer records on this page into a JSON array. 
For each record, provide:
- uscno: string (the Uscno identifier, preserve leading zeros)
- dcDate: string (DC-Dt)
- name: string
- mobile: string (if missing, return "No contact number")
- category: string (Cat)
- status: string (Sta)
- load: string (Load)
- poleRaw: string (The exact original string for Poleno(Unts))
- poleNumber: string (The extracted pole part, if unclear return empty string)
- units: string (The extracted units part inside parentheses, if unclear return empty string)
- lpdt: string
- arr: number (Arrears, preserving negatives)
- cmd: number (Current Month Demand)
- totalAmount: number (TotAmt)
- acd: number
- rawRow: string (The raw text of the entire row for auditing)`;
"""

content = content.replace(old_prompt.strip(), new_prompt.strip())

with open('server.ts', 'w') as f:
    f.write(content)
