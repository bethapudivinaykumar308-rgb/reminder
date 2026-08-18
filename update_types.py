import os

file_path = 'src/types.ts'
with open(file_path, 'r') as f:
    content = f.read()

twilio_types = """
  // PSTN Calling Integration (Twilio)
  twilioSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
"""

if 'twilioSid?: string;' not in content:
    content = content.replace("  // SMS Gateway", twilio_types + "\n  // SMS Gateway")

with open(file_path, 'w') as f:
    f.write(content)
