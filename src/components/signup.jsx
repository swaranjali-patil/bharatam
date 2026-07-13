import { useState } from "react";
import {
  ArrowLeft,
  User,
} from "lucide-react";

import { db, auth } from "../firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function CreateAccount({ onSwitch }) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const role = "trainer";

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 1. Create User in Firebase Authentication
      const dummyEmail = `${phoneNumber}@bharatam.com`;
      const dummyPassword = "defaultPassword123";
      
      const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, dummyPassword);
      const userId = userCredential.user.uid;

      // 2. Save details to Firestore (Using the rules you shared)
      await setDoc(doc(db, "bharatam_users", userId), {
        uid: userId,
        fullName,
        name: fullName,
        phoneNumber,
        role,
        isBlocked: false,
        preferredLanguage: "en",
        profileImageUrl: "",
        createdAt: new Date()
      });

      console.log("Registration successful in Auth and Firestore");
      setIsLoading(false);
      onSwitch && onSwitch('signin');
    } catch (error) {
      console.error("Signup Error:", error);
      setIsLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        try {
          const q = query(collection(db, "bharatam_users"), where("phoneNumber", "==", phoneNumber));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) {
            // Sync mismatch recovery
            const recoveredId = `recovered-${phoneNumber}`;
            await setDoc(doc(db, "bharatam_users", recoveredId), {
              uid: recoveredId,
              fullName,
              name: fullName,
              phoneNumber,
              role,
              isBlocked: false,
              preferredLanguage: "en",
              profileImageUrl: "",
              createdAt: new Date()
            });
            alert("Registration completed successfully! You can now sign in.");
            onSwitch && onSwitch('signin');
            return;
          }
        } catch (dbErr) {
          console.error("Failed to sync database record:", dbErr);
        }
        alert("This phone number is already registered. Please Sign In.");
        onSwitch && onSwitch('signin');
      } else {
        alert("Registration failed: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-4">
      
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button 
          onClick={() => onSwitch && onSwitch('signin')}
          className="mb-4 p-2 hover:bg-gray-200 rounded-full transition-colors inline-block"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>

        {/* Top Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-lg mb-3">
            <span className="text-2xl">📝</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Join Bharatam LMS today</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSignup} className="bg-white w-full rounded-[2rem] shadow-xl p-6 border border-gray-100">
          {/* Full Name */}
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">Full Name</label>
            <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-50 transition-all">
              <User className="text-gray-400 w-5 h-5" />
              <div className="w-[1px] h-5 bg-gray-300 mx-3"></div>
              <input
                type="text"
                required
                placeholder="Enter your name"
                className="bg-transparent outline-none w-full text-gray-700 text-sm font-medium placeholder:text-gray-400"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">Phone Number</label>
            <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-50 transition-all">
              <img src="https://flagcdn.com/w20/in.png" alt="IN" className="w-4 h-2.5 shadow-xs" />
              <span className="ml-2.5 font-bold text-gray-700 text-sm">+91</span>
              <div className="w-[1px] h-5 bg-gray-300 mx-3"></div>
              <input
                type="tel"
                pattern="[0-9]{10}"
                required
                placeholder="10-digit number"
                className="bg-transparent outline-none w-full text-gray-700 text-sm font-medium placeholder:text-gray-400"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <input type="hidden" value="trainer" />

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white text-lg font-bold py-3.5 rounded-xl shadow-lg shadow-orange-100 flex items-center justify-center transition-all hover:translate-y-[-1px] active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : "Sign Up"}
          </button>
        </form>

        {/* Bottom Link */}
        <div className="mt-6 text-center">
          <span className="text-sm text-gray-500 font-medium">Already have an account?</span>
          <button 
            onClick={() => onSwitch && onSwitch('signin')}
            className="ml-1.5 text-sm text-orange-500 font-bold hover:text-orange-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}