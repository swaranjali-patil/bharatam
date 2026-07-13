/**
 * VERIFICATION SCRIPT: Total Students Count in SuperAdmin Dashboard
 * 
 * This script verifies that students are being counted correctly
 * Run this in your browser console while on the SuperAdmin Dashboard
 */

// Function to check student count
function verifyStudentsCount() {
  console.log('🔍 VERIFICATION: Total Students Count\n');
  console.log('═══════════════════════════════════════\n');
  
  // Check if Firebase is available
  if (typeof db === 'undefined') {
    console.error('❌ Firebase (db) not found. Make sure you are on the SuperAdmin Dashboard page.');
    return;
  }
  
  // Import Firebase functions
  const { collection, getDocs } = window.firebase.firestore;
  
  // Fetch users from Firebase
  getDocs(collection(db, "bharatam_users"))
    .then(snapshot => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📊 RESULTS:\n');
      console.log(`Total Users in Firebase: ${users.length}`);
      
      // Count students
      const students = users.filter(u => {
        const role = (u.role || '').toLowerCase();
        return role === 'student' || role === 'user' || role === '';
      });
      
      console.log(`Total Students: ${students.length}`);
      
      // Count trainers
      const trainers = users.filter(u => 
        (u.role || '').toLowerCase() === 'trainer'
      );
      
      console.log(`Total Trainers: ${trainers.length}`);
      
      // Count admins
      const admins = users.filter(u => {
        const role = (u.role || '').toLowerCase();
        return role === 'superadmin' || role === 'admin';
      });
      
      console.log(`Total Admins: ${admins.length}\n`);
      
      // Show role breakdown
      console.log('📋 ROLE BREAKDOWN:\n');
      
      const roleCounts = {};
      users.forEach(u => {
        const role = u.role || '(empty)';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
      
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`  ${role}: ${count}`);
      });
      
      console.log('\n');
      
      // Sample students
      if (students.length > 0) {
        console.log('👥 SAMPLE STUDENTS (first 5):\n');
        students.slice(0, 5).forEach((s, i) => {
          console.log(`${i + 1}. ${s.fullName || s.name || 'Unnamed'}`);
          console.log(`   Email: ${s.email || 'N/A'}`);
          console.log(`   Phone: ${s.phoneNumber || 'N/A'}`);
          console.log(`   Role: "${s.role || '(empty)'}"`);
          console.log('');
        });
      } else {
        console.log('⚠️ NO STUDENTS FOUND\n');
        console.log('Possible reasons:');
        console.log('1. No users registered yet');
        console.log('2. All users have role "trainer" or "admin"');
        console.log('3. Need to add test students to Firebase\n');
      }
      
      // Verify against UI
      console.log('🎯 UI VERIFICATION:\n');
      console.log('Check the SuperAdmin Dashboard:');
      console.log('1. Navigate to Overview tab');
      console.log('2. Look at the second stat card (👥 Total Students)');
      console.log(`3. The number should show: ${students.length}\n`);
      
      // Success message
      if (students.length > 0) {
        console.log('✅ Students are being fetched from Firebase correctly!');
      } else {
        console.log('⚠️ No students found. Add test students to verify.');
      }
      
      console.log('\n═══════════════════════════════════════\n');
    })
    .catch(error => {
      console.error('❌ Error fetching users:', error);
      console.log('\nTroubleshooting:');
      console.log('1. Check Firebase configuration');
      console.log('2. Verify bharatam_users collection exists');
      console.log('3. Check network connection');
      console.log('4. Verify Firestore permissions');
    });
}

// Function to create a test student
function createTestStudent() {
  console.log('➕ Creating test student...\n');
  
  if (typeof db === 'undefined') {
    console.error('❌ Firebase (db) not found.');
    return;
  }
  
  const { collection, addDoc, serverTimestamp } = window.firebase.firestore;
  
  const testStudent = {
    fullName: 'Test Student ' + Date.now(),
    email: `teststudent${Date.now()}@example.com`,
    phoneNumber: '+91-' + Math.floor(Math.random() * 9000000000 + 1000000000),
    role: 'student',
    isBlocked: false,
    createdAt: serverTimestamp()
  };
  
  addDoc(collection(db, "bharatam_users"), testStudent)
    .then(docRef => {
      console.log('✅ Test student created successfully!');
      console.log('Student ID:', docRef.id);
      console.log('Name:', testStudent.fullName);
      console.log('Email:', testStudent.email);
      console.log('\nRun verifyStudentsCount() again to see the updated count.\n');
    })
    .catch(error => {
      console.error('❌ Error creating test student:', error);
    });
}

// Instructions
console.log('\n🎓 TOTAL STUDENTS COUNT VERIFICATION SCRIPT\n');
console.log('Available functions:');
console.log('1. verifyStudentsCount()  - Check current student count');
console.log('2. createTestStudent()    - Create a test student in Firebase');
console.log('\nUsage:');
console.log('  > verifyStudentsCount()');
console.log('  > createTestStudent()\n');

// Auto-run verification
verifyStudentsCount();
