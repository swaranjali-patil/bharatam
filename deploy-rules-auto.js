// This script helps you deploy Firestore rules
// Since Firebase CLI requires interactive login, this shows you what to do

console.log("=" .repeat(60));
console.log("  FIRESTORE RULES DEPLOYMENT HELPER");
console.log("=".repeat(60));
console.log("");

console.log("🚨 YOU ARE GETTING THIS ERROR:");
console.log("   'Failed to create course: Missing or insufficient permissions'");
console.log("");

console.log("📋 THIS HAPPENS BECAUSE:");
console.log("   Your Firestore security rules have NOT been deployed yet.");
console.log("   Firebase blocks ALL writes by default until you set rules.");
console.log("");

console.log("✅ HERE'S HOW TO FIX IT (Choose ONE method):");
console.log("");

console.log("─".repeat(60));
console.log("METHOD 1: Firebase Console (EASIEST - NO CLI NEEDED)");
console.log("─".repeat(60));
console.log("");
console.log("STEP 1: Open this URL in your browser:");
console.log("👉 https://console.firebase.google.com/project/bharatam-f3cd7/firestore/rules");
console.log("");
console.log("STEP 2: Delete ALL text in the rules editor");
console.log("");
console.log("STEP 3: Open this file: firestore.rules");
console.log("   Location: C:\\Users\\Administrator\\Desktop\\E-learning\\elearning-app\\Bhartam\\firestore.rules");
console.log("");
console.log("STEP 4: Copy ALL text from firestore.rules");
console.log("   (Open in Notepad, press Ctrl+A, then Ctrl+C)");
console.log("");
console.log("STEP 5: Paste into Firebase Console rules editor");
console.log("   (Click in editor, press Ctrl+V)");
console.log("");
console.log("STEP 6: Click the blue 'Publish' button");
console.log("");
console.log("✅ DONE! Rules are now active!");
console.log("");

console.log("─".repeat(60));
console.log("METHOD 2: Firebase CLI (If you prefer command line)");
console.log("─".repeat(60));
console.log("");
console.log("Run these commands:");
console.log("");
console.log("  firebase login");
console.log("  firebase deploy --only firestore:rules");
console.log("");

console.log("─".repeat(60));
console.log("AFTER DEPLOYING RULES:");
console.log("─".repeat(60));
console.log("");
console.log("1. Make sure your user has the 'role' field:");
console.log("   Go to: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data/~2Fbharatam_users");
console.log("   Find your user");
console.log("   Add field: role = 'trainer'");
console.log("");
console.log("2. Logout and login again in your app");
console.log("");
console.log("3. Try creating a course again");
console.log("");
console.log("✅ It will work!");
console.log("");

console.log("=".repeat(60));
console.log("  Need help? Read DEPLOY_NOW.md or VISUAL_GUIDE.md");
console.log("=".repeat(60));
console.log("");

console.log("⏱️  ESTIMATED TIME: 2-3 minutes");
console.log("🎯 DIFFICULTY: Easy (just copy/paste)");
console.log("");
