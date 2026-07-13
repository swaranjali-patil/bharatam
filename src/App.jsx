import { useState, useEffect } from 'react';
import SignIn from './components/signIn.jsx';
import SignUp from './components/signup.jsx';
import StaffPortal from './components/StaffPortal.jsx';
import SuperAdminDashboard from './components/SuperAdminDashboard.jsx';
import StudentChatbot from './components/StudentChatbot.jsx';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
    const [page, setPage] = useState('signin');
  const [user, setUser] = useState(null);

  // Load persisted user on initial mount for current session
  useEffect(() => {
    const storedUser = sessionStorage.getItem('eLearningUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Determine page based on role
      const role = (parsedUser?.role || '').toString().toLowerCase();
      if (role === 'trainer') {
        setPage('staff_portal');
      } else if (role === 'admin' || role === 'superadmin') {
        setPage('admin_dashboard');
      } else {
        setPage('staff_portal');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Persist user data for session continuity only in the current tab
    sessionStorage.setItem('eLearningUser', JSON.stringify(userData));
    const normalizedRole = (userData?.role || '').toString().toLowerCase().trim();

    if (normalizedRole === 'trainer') {
      setPage('staff_portal');
    } else if (normalizedRole === 'admin' || normalizedRole === 'superadmin') {
      setPage('admin_dashboard');
    } else {
      // Default to trainer dashboard when student role is removed
      setPage('staff_portal');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPage('signin');
    // Clear session user
    sessionStorage.removeItem('eLearningUser');
    localStorage.removeItem('eLearningUser'); // Ensure it's cleared from localStorage too just in case
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-orange-100 selection:text-orange-600">
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {page === 'signin' ? (
            <SignIn onSwitch={setPage} onLoginSuccess={handleLoginSuccess} />
          ) : page === 'signup' ? (
            <SignUp onSwitch={setPage} />
          ) : page === 'staff_portal' ? (
            <StaffPortal user={user} onLogout={handleLogout} />
          ) : page === 'admin_dashboard' ? (
            <SuperAdminDashboard user={user} onLogout={handleLogout} />
          ) : null}
        </motion.div>
      </AnimatePresence>
      {user && (['trainer', 'admin', 'superadmin'].includes((user.role || '').toString().toLowerCase())) &&
        (page === 'staff_portal' || page === 'admin_dashboard') && (
        <StudentChatbot user={user} />
      )}
    </div>
  );
}

export default App;
