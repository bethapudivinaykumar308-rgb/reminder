import os

file_path = 'src/components/Navbar.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add No WhatsApp tab button
no_wa_tab = """
          <button
            onClick={() => onTabChange('no_whatsapp')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'no_whatsapp'
                ? 'bg-rose-100 text-rose-800 border border-rose-200 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span className="hidden sm:inline">No WA Queue</span>
          </button>
"""
if 'onTabChange(\'no_whatsapp\')' not in content:
    content = content.replace("onClick={() => onTabChange('templates')}", no_wa_tab + "\n          <button\n            onClick={() => onTabChange('templates')}")

# Make sure PhoneCall is imported if not already
if 'PhoneCall' not in content:
    content = content.replace("import { Zap", "import { Zap, PhoneCall")

with open(file_path, 'w') as f:
    f.write(content)
