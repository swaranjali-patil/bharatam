import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDnmVfWqHet_eM5QZvxE4JupJ1vj_-4Hcc",
  authDomain: "bharatam-f3cd7.firebaseapp.com",
  projectId: "bharatam-f3cd7",
  storageBucket: "bharatam-f3cd7.firebasestorage.app",
  messagingSenderId: "194928349759",
  appId: "1:194928349759:web:58f5e3fb4a9e89e153de8a",
  measurementId: "G-ZL4VESHP1Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testCreateCourse() {
  console.log("Testing course creation...");
  
  try {
    // Try to create a test course WITHOUT authentication first
    console.log("\n1. Testing WITHOUT authentication (should fail)...");
    try {
      const testCourse = {
        title: "Test Course - No Auth",
        subject: "Test",
        category: "Test",
        description: "Testing course creation without auth",
        price: "0",
        status: "Draft",
        approvalStatus: "draft",
        trainerId: "test123",
        trainerName: "Test User",
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "bharatam_courses"), testCourse);
      console.log("❌ UNEXPECTED: Course created without auth! (Rules may be too permissive)");
    } catch (err) {
      console.log("✅ EXPECTED: Failed without auth:", err.code);
      console.log("   Message:", err.message);
    }

    // Now try with authentication (if you have a test user)
    console.log("\n2. If you have test credentials, we can test WITH authentication");
    console.log("   For now, checking what the error is...");
    
    console.log("\n📊 CURRENT STATE:");
    console.log("   - Firestore database: bharatam-f3cd7");
    console.log("   - Collection: bharatam_courses");
    console.log("   - Error: Missing or insufficient permissions");
    console.log("\n🔧 THIS MEANS:");
    console.log("   ❌ Firestore security rules are blocking the write");
    console.log("   ❌ Rules have NOT been deployed yet");
    console.log("\n✅ SOLUTION:");
    console.log("   1. Go to: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/rules");
    console.log("   2. Copy rules from firestore.rules file");
    console.log("   3. Paste and click 'Publish'");
    
  } catch (error) {
    console.error("Error:", error);
  }
  
  process.exit(0);
}

testCreateCourse();
