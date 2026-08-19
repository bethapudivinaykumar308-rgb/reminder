import os

with open('src/App.tsx', 'r') as f:
    content = f.read()

login_ui_original = """          <p className="text-slate-400 text-sm mb-8">
            Access to the Electricity Bill Recovery Engine is strictly restricted to authorized staff. Please log in to view consumer details.
          </p>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >"""

login_ui_new = """          <p className="text-slate-400 text-sm mb-8">
            Access to the Electricity Bill Recovery Engine is strictly restricted to authorized staff. Please log in to view consumer details.
          </p>
          
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs p-3 rounded-xl mb-6 text-left">
            <span className="font-bold block mb-1">If login fails or page doesn't redirect:</span>
            1. You MUST open this app in a <b>New Tab</b> (use the Open in New Tab button in the top right of the Preview). <br/>
            2. Make sure you authorized the domain in Firebase Authentication settings.
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >"""

content = content.replace(login_ui_original, login_ui_new)

with open('src/App.tsx', 'w') as f:
    f.write(content)
