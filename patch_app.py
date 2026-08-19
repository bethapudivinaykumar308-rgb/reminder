import os

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add VerificationCenter import
if "VerificationCenter" not in content:
    content = content.replace("import { SettingsModal } from './components/SettingsModal';", "import { SettingsModal } from './components/SettingsModal';\nimport { VerificationCenter } from './components/VerificationCenter';")

# Fix activeTab type
content = content.replace("useState<'dashboard' | 'history' | 'analytics' | 'templates' | 'no_whatsapp'>('dashboard');", "useState<'dashboard' | 'history' | 'analytics' | 'templates' | 'verification' | 'no_whatsapp'>('dashboard');")

# Render VerificationCenter
verification_render = """
        {/* Verification Center Tab */}
        {activeTab === 'verification' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs h-[calc(100vh-140px)]">
            <VerificationCenter />
          </div>
        )}
"""
if "activeTab === 'verification'" not in content:
    content = content.replace("{/* Templates Tab (Voice Studio) */}", verification_render + "\n        {/* Templates Tab (Voice Studio) */}")

with open('src/App.tsx', 'w') as f:
    f.write(content)
