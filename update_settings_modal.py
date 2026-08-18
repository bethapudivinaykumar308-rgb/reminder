import os

file_path = 'src/components/SettingsModal.tsx'
with open(file_path, 'r') as f:
    content = f.read()

twilio_inputs = """
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Phone className="w-4 h-4 text-purple-500" />
              Live AI PSTN Calling Integration (Twilio)
            </h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Twilio Account SID</label>
                <input
                  type="text"
                  value={localSettings.twilioSid || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, twilioSid: e.target.value })}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Twilio Auth Token</label>
                <input
                  type="password"
                  value={localSettings.twilioAuthToken || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, twilioAuthToken: e.target.value })}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Twilio Phone Number (From)</label>
                <input
                  type="text"
                  value={localSettings.twilioPhoneNumber || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, twilioPhoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
"""

if 'twilioSid' not in content:
    content = content.replace("          {/* System Notifications */}", twilio_inputs + "\n          {/* System Notifications */}")

with open(file_path, 'w') as f:
    f.write(content)
