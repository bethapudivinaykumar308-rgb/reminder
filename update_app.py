import os
import re

file_path = 'src/App.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Update activeTab type
content = content.replace("activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'analytics' | 'templates'>('dashboard')", "activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'analytics' | 'templates' | 'no_whatsapp'>('dashboard')")

# 2. Add onTestAiCall handler
test_ai_call_handler = """
  const handleTestAiCall = (phone: string) => {
    const dummyConsumer = {
      id: 'test-ai-call-1',
      consumerId: 'TEST-001',
      name: 'System Admin',
      phone: phone,
      amount: 150,
      dueDate: new Date().toISOString().split('T')[0],
      overdueDays: 5,
      tariffType: 'Domestic' as const,
      address: 'Test Address',
      status: 'unpaid' as const,
      notes: 'Launcher Mobile Test Verification Call',
      createdAt: new Date().toISOString()
    };
    setActiveLiveConsumer(dummyConsumer);
    setIsLiveCallOpen(true);
  };
"""
if 'handleTestAiCall' not in content:
    content = content.replace('  const handleLogin = async () => {', test_ai_call_handler + '\n  const handleLogin = async () => {')

# 3. Add No WhatsApp Tab view
no_wa_view = """
        {/* No WhatsApp Queue Tab */}
        {activeTab === 'no_whatsapp' && (
          <div className="animate-in fade-in duration-300 space-y-5">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">No WhatsApp Queue</h2>
                  <p className="text-xs text-slate-500">Consumers explicitly marked as not having WhatsApp. Use SMS or AI Voice calls to reach them.</p>
                </div>
              </div>
              <ConsumerTable
                consumers={consumers.filter(c => c.hasNoWhatsApp)}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onSendSingleSms={handleSendSingleSms}
                onTriggerSingleAiCall={handleTriggerSingleAiCall}
                onSendSingleWa={handleSendSingleWa}
                onTogglePaid={handleTogglePaid}
                onToggleNoWhatsApp={handleToggleNoWhatsApp}
                onDeleteConsumer={handleDeleteConsumer}
                onEditConsumer={(consumer) => {
                  setConsumerToEdit(consumer);
                  setIsEditConsumerOpen(true);
                }}
                settings={settings}
              />
            </div>
          </div>
        )}
"""
if 'activeTab === \'no_whatsapp\'' not in content:
    content = content.replace('{/* Templates Tab (Voice Studio) */}', no_wa_view + '\n        {/* Templates Tab (Voice Studio) */}')

# 4. Update LauncherPhoneModal props
content = content.replace('<LauncherPhoneModal', '<LauncherPhoneModal\n        onTestAiCall={handleTestAiCall}')

with open(file_path, 'w') as f:
    f.write(content)
