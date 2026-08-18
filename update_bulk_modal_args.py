import os

with open('src/components/BulkAiCallModal.tsx', 'r') as f:
    content = f.read()

old_body = """            body: JSON.stringify({
              consumerPhone: consumer.phone,
              consumerName: consumer.name,
              scriptText: scriptText,
              twilioSid: settings.twilioSid || '',
              twilioAuth: settings.twilioAuthToken || '',
              twilioFrom: settings.twilioPhoneNumber || ''
            })"""

new_body = """            body: JSON.stringify({
              consumer: consumer,
              appBaseUrl: window.location.origin,
              scriptText: scriptText,
              twilioSid: settings.twilioSid || '',
              twilioAuth: settings.twilioAuthToken || '',
              twilioFrom: settings.twilioPhoneNumber || '',
              utilityName: settings.utilityName || 'Electricity Board',
              language: 'Telugu'
            })"""
            
if old_body in content:
    content = content.replace(old_body, new_body)
    with open('src/components/BulkAiCallModal.tsx', 'w') as f:
        f.write(content)
