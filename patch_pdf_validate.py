import os

with open('server.ts', 'r') as f:
    content = f.read()

old_validate = """
  // 4. Mobile number check
  if (!record.mobile || String(record.mobile).trim() === '' || String(record.mobile).trim().toLowerCase() === 'null') {
    record.mobile = null;
    errors.push("MOBILE_MISSING");
  } else if (String(record.mobile).length < 10) {
    errors.push("MOBILE_SUSPICIOUS");
    conf -= 10;
  }
"""

new_validate = """
  // 4. Mobile number check
  const mobStr = String(record.mobile || '').trim().toLowerCase();
  if (!record.mobile || mobStr === '' || mobStr === 'null' || mobStr === 'no contact number') {
    record.mobile = "No contact number";
    // Do not subtract confidence just because the report lacks a mobile number. This is normal.
  } else if (String(record.mobile).length < 10) {
    errors.push("MOBILE_SUSPICIOUS");
    conf -= 10;
  }
"""

content = content.replace(old_validate.strip(), new_validate.strip())

with open('server.ts', 'w') as f:
    f.write(content)
