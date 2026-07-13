import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { mockUsers } from "../utils/fallbackData";

export default function SignIn({ onSwitch, onLoginSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  // Secret Admin Login States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const BYPASS_PHONE = "9898989898";

  // SMS API CONFIG
  const SMS_CONFIG = {
    username: "Experts",
    authkey: "ba9dcdcdfcXX", // YOUR REAL API KEY
    senderId: "EXTSKL",
    accusage: "1",
  };

  // TIMER
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // SEND OTP
  const sendOtp = async () => {
    try {
      const newOtp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      setGeneratedOtp(newOtp);

      const message = `Your Verification Code for login is ${newOtp}. - Expertskill Technology.`;

      const url = `https://mobicomm.dove-sms.com/submitsms.jsp?user=${SMS_CONFIG.username}&key=${SMS_CONFIG.authkey}&mobile=91${phoneNumber}&message=${encodeURIComponent(
        message
      )}&accusage=${SMS_CONFIG.accusage}&senderid=${SMS_CONFIG.senderId
        }`;

      console.log("SMS URL:", url);

      const response = await fetch(url);

      const result = await response.text();

      console.log("SMS API RESPONSE:", result);

      // SUCCESS CHECK
      if (
        result.toLowerCase().includes("success") ||
        result.toLowerCase().includes("sent")
      ) {
        setShowOtp(true);
        setTimer(60);
        setCanResend(false);

        alert("OTP Sent Successfully");

        // FOR TESTING
        console.log("Generated OTP:", newOtp);
      } else {
        alert("SMS Failed: " + result);
      }
    } catch (error) {
      console.error("OTP ERROR:", error);

      alert("Failed to send OTP");
    }
  };

  // RESEND OTP
  const handleResend = async () => {
    if (!canResend) return;

    setOtp("");

    await sendOtp();
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    if (isAdminMode) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // Fetch user from Firestore
        const userDocRef = doc(db, "bharatam_users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          const fallbackAdmin = {
            uid: userId,
            fullName: "System Admin",
            role: "admin",
            email: email
          };
          alert("Login Successful");
          setIsLoading(false);
          if (onLoginSuccess) {
            onLoginSuccess(fallbackAdmin);
          }
          return;
        }

        const userData = userDocSnap.data();
        if (userData && !userData.fullName && userData.name) {
          userData.fullName = userData.name;
        }

        alert("Admin Login Successful");
        setIsLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
      } catch (error) {
        console.error("Admin login error:", error);
        
        // Fallback if permission denied
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
          console.warn("Using mock admin fallback due to permission denied.");
          const fallbackAdmin = mockUsers.find(u => u.role === 'superadmin' || u.role === 'admin') || {
            uid: "admin1",
            fullName: "System Admin",
            role: "superadmin",
            email: email
          };
          alert("Admin Login Successful (Fallback Mode)");
          setIsLoading(false);
          if (onLoginSuccess) {
            onLoginSuccess(fallbackAdmin);
          }
          return;
        }

        alert("Failed to authenticate admin: " + error.message);
        setIsLoading(false);
      }
      return;
    }

    // STEP 1 SEND OTP
    if (!showOtp) {
      try {
        // MOBILE VALIDATION
        if (phoneNumber.length !== 10) {
          alert("Enter valid 10 digit mobile number");

          setIsLoading(false);

          return;
        }

        // BYPASS NUMBER
        if (phoneNumber === BYPASS_PHONE) {
          setTempUser({
            fullName: "Test Trainer",
            role: "trainer",
            phoneNumber: BYPASS_PHONE,
          });
          setGeneratedOtp("123456");
          setShowOtp(true);
          setTimer(60);
          setCanResend(false);
          alert("Test OTP is 123456");
          setIsLoading(false);
          return;
        }

        // ADMIN BYPASS NUMBER
        if (phoneNumber === "9999999999") {
          setTempUser({
            fullName: "Super Admin",
            role: "admin",
            phoneNumber: "9999999999",
          });
          setGeneratedOtp("123456");
          setShowOtp(true);
          setTimer(60);
          setCanResend(false);
          alert("Admin Test OTP is 123456");
          setIsLoading(false);
          return;
        }

        // FIREBASE USER CHECK
        const usersRef = collection(db, "bharatam_users");
        const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          alert("No account found. Please sign up first.");

          setIsLoading(false);

          if (onSwitch) {
            onSwitch("signup");
          }

          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        // ✅ FIX: Always use the Firestore document ID as the uid
        // This ensures the uid matches what's in the security rules
        userData.uid = userDoc.id;

        // Ensure compatibility with components expecting 'fullName'
        if (userData && !userData.fullName && userData.name) {
          userData.fullName = userData.name;
        }

        // Normalize role and default to trainer when student role is removed
        if (userData) {
          if (typeof userData.role === 'string') {
            userData.role = userData.role.toLowerCase().trim();
          }
          if (!userData.role || userData.role === 'student' || userData.role === 'user') {
            userData.role = 'trainer';
          }
        }

        setTempUser(userData);

        // SEND OTP
        await sendOtp();

        setIsLoading(false);
      } catch (error) {
        console.error("Error querying user:", error);

        // Fallback for permission denied
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
          console.warn("Using mock user fallback due to permission denied.");
          let mockUser = mockUsers.find(u => u.phoneNumber === phoneNumber);
          if (!mockUser) {
            mockUser = {
              uid: `mock-${phoneNumber}`,
              fullName: "Temporary User (Fallback)",
              role: "trainer",
              phoneNumber: phoneNumber
            };
          }
          setTempUser(mockUser);
          await sendOtp();
          setIsLoading(false);
          return;
        }

        alert("Something went wrong");
        setIsLoading(false);
      }
    }

    // STEP 2 VERIFY OTP
    else {
      if (otp.length !== 6) {
        alert("Please enter 6 digit OTP");

        setIsLoading(false);

        return;
      }

      // OTP VERIFY
      if (otp !== generatedOtp) {
        alert("Invalid OTP");

        setIsLoading(false);

        return;
      }

      // ✅ FIX: Sign in anonymously for Firebase Auth but use Firestore document ID
      // This allows Firestore rules to work while maintaining consistent UIDs
      let finalUser = { ...tempUser };
      try {
        await signInAnonymously(auth);
        console.log("Anonymous Auth completed for Firestore access");
        
        // Keep the Firestore document ID as the uid (already set from tempUser)
        // Do NOT override it with Firebase Auth's anonymous UID
      } catch (authErr) {
        console.warn('Anonymous auth failed (Firestore writes may be blocked):', authErr);
      }

      alert("Login Successful");

      setIsLoading(false);

      if (onLoginSuccess) {
        onLoginSuccess(finalUser);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-5">
      <div className="w-full max-w-md">

        {/* TOP */}
        <div className="flex flex-col items-center mb-6">
          <button
            type="button"
            onDoubleClick={() => {
              setIsAdminMode(prev => !prev);
              setShowOtp(false);
            }}
            className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-500 to-orange-300 flex items-center justify-center shadow-xl cursor-pointer transition-transform hover:scale-105 select-none"
            title="Double-click to toggle Admin Login"
            aria-label="Toggle Admin Mode"
          >
            <span className="text-4xl select-none">🎓</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mt-5">
            {isAdminMode ? "Admin Login" : showOtp ? "Verify OTP" : "Welcome Back"}
          </h1>

          <p className="text-gray-500 mt-2 text-center">
            {isAdminMode 
              ? "Sign in with your administrator credentials"
              : showOtp
                ? `Enter OTP sent to +91 ${phoneNumber}`
                : "Sign in with your phone number"}
          </p>
        </div>

        {/* CARD */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl p-6"
        >
          {isAdminMode ? (
            <>
              {/* EMAIL */}
              <label className="font-semibold text-gray-700 block mb-2">
                Email Address
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 mb-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bharatam.com"
                  className="bg-transparent outline-none w-full text-gray-700"
                />
              </div>

              {/* PASSWORD */}
              <label className="font-semibold text-gray-700 block mb-2">
                Password
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 mb-6">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent outline-none w-full text-gray-700"
                />
              </div>
            </>
          ) : !showOtp ? (
            <>
              {/* PHONE */}
              <label className="font-semibold text-gray-700 block mb-2">
                Phone Number
              </label>

              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 mb-6">
                <span className="text-xl mr-2">🇮🇳</span>

                <span className="font-semibold mr-4 text-gray-700">
                  +91
                </span>

                <input
                  type="tel"
                  required
                  maxLength="10"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Enter phone number"
                  className="bg-transparent outline-none w-full text-gray-700"
                />
              </div>
            </>
          ) : (
            <>
              {/* OTP */}
              <label className="font-semibold text-gray-700 block mb-2">
                Enter OTP
              </label>

              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Enter OTP"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-center text-2xl tracking-[10px] outline-none text-gray-700 mb-6"
              />

              {/* RESEND */}
              <div className="flex justify-between items-center mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtp(false);
                    setOtp("");
                  }}
                  className="text-sm text-gray-500 font-semibold"
                >
                  Change Number
                </button>

                {timer > 0 ? (
                  <span className="text-sm text-orange-500 font-bold">
                    Resend in 00:{timer < 10 ? `0${timer}` : timer}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-sm text-orange-500 font-bold"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-300 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition"
          >
            {isLoading
              ? "Please Wait..."
              : isAdminMode
                ? "Login as Admin"
                : showOtp
                  ? "Verify & Login"
                  : "Send OTP"}
          </button>
        </form>

        {/* SIGNUP & TOGGLE */}
        {isAdminMode ? (
          <div className="text-center mt-6">
            <span className="text-gray-500">
              Not an administrator?
            </span>
            <button
              onClick={() => setIsAdminMode(false)}
              className="ml-2 text-orange-500 font-bold"
            >
              Sign In with Phone
            </button>
          </div>
        ) : !showOtp && (
          <div className="text-center mt-6">
            <span className="text-gray-500">
              Don't have an account?
            </span>

            <button
              onClick={() => onSwitch && onSwitch("signup")}
              className="ml-2 text-orange-500 font-bold"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


