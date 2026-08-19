import os

with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

# Make sure we import initializeFirestore
if "initializeFirestore" not in content:
    content = content.replace("getFirestore,", "getFirestore, initializeFirestore,")

# Replace firestoreDb initialization
old_init = """let firestoreDb: Firestore;
try {
  firestoreDb = getFirestore(app, 'ai-studio-electricitybills-5e160414-7db0-4994-bad7-47dc4a6b3e30');
} catch (e) {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;"""

new_init = """let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, { experimentalForceLongPolling: true }, 'ai-studio-electricitybills-5e160414-7db0-4994-bad7-47dc4a6b3e30');
} catch (e) {
  try {
    firestoreDb = getFirestore(app, 'ai-studio-electricitybills-5e160414-7db0-4994-bad7-47dc4a6b3e30');
  } catch (e2) {
    firestoreDb = getFirestore(app);
  }
}
export const db = firestoreDb;"""

content = content.replace(old_init, new_init)

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
