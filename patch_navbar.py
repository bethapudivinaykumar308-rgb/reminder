import os

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Add activeTab type
content = content.replace("activeTab: 'dashboard' | 'history' | 'analytics' | 'templates' | 'no_whatsapp';", "activeTab: 'dashboard' | 'history' | 'analytics' | 'templates' | 'verification' | 'no_whatsapp';")
content = content.replace("setActiveTab: (tab: 'dashboard' | 'history' | 'analytics' | 'templates' | 'no_whatsapp') => void;", "setActiveTab: (tab: 'dashboard' | 'history' | 'analytics' | 'templates' | 'verification' | 'no_whatsapp') => void;")

# Add FileText to lucide-react imports if not there
if 'FileText' not in content:
    content = content.replace("import { ", "import { FileText, ")

# Add verification tab in desktop
desktop_tab = """
            <button
              id="tab-verification"
              onClick={() => setActiveTab('verification')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'verification'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Verification Center
            </button>
"""
if "tab-verification" not in content:
    content = content.replace("AI Script Studio\n            </button>", "AI Script Studio\n            </button>" + desktop_tab)


# Add verification tab in mobile
mobile_tab = """
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'verification' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
            }`}
          >
            📑 Verification
          </button>
"""
if "📑 Verification" not in content:
    content = content.replace("🎙️ Voice Studio\n          </button>", "🎙️ Voice Studio\n          </button>" + mobile_tab)

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
