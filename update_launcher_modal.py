import os
import re

file_path = 'src/components/LauncherPhoneModal.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Update props interface
if 'onTestAiCall: (phone: string) => void;' not in content:
    content = content.replace("showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;\n}", "showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;\n  onTestAiCall: (phone: string) => void;\n}")

# 2. Add prop to component destructuring
content = content.replace("showToast,\n}) => {", "showToast,\n  onTestAiCall,\n}) => {")

# 3. Add handleTestAiCallLaunch function
test_ai_call_func = """
  const handleTestAiCallLaunch = () => {
    setTestResult(`✓ AI Test Call initiated for ${phoneNumber}`);
    onTestAiCall(phoneNumber);
  };
"""
if 'handleTestAiCallLaunch' not in content:
    content = content.replace("  const handleTestCallLaunch = () => {", test_ai_call_func + "\n  const handleTestCallLaunch = () => {")

# 4. Add the AI Voice Call test button
ai_call_btn = """
                  <button
                    onClick={handleTestAiCallLaunch}
                    className="col-span-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>టెస్ట్ AI వాయిస్ కాల్ (Test AI Call)</span>
                  </button>
"""
if 'Test AI Call' not in content:
    content = content.replace("</div>\n                {testResult && (", "</div>\n                <div className=\"mt-2\">\n" + ai_call_btn + "\n                </div>\n                {testResult && (")

with open(file_path, 'w') as f:
    f.write(content)
