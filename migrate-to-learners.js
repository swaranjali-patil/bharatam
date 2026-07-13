/**
 * MIGRATION SCRIPT: Copy Students from bharatam_users to learners Collection
 * 
 * This script migrates all students from bharatam_users collection
 * to the new dedicated learners collection.
 * 
 * Usage:
 * 1. Open Firebase Console or your app
 * 2. Copy this script to browser console
 * 3. Run: migrateStudentsToLearners()
 */

const migrateStudentsToLearners = async () => {
  console.log('🔄 Starting migration from bharatam_users to learners...\n');
  
  try {
    // Check if Firebase is available
    if (typeof db === 'undefined') {
      console.error('❌ Firebase (db) not found. Make sure Firebase is initialized.');
      return;
    }
    
    const { collection, getDocs, doc, setDoc, serverTimestamp } = window.firebase.firestore || {};
    
    if (!collection || !getDocs) {
      console.error('❌ Firestore functions not available.');
      return;
    }
    
    // Fetch all users from bharatam_users
    console.log('📊 Fetching users from bharatam_users...');
    const usersRef = collection(db, "bharatam_users");
    const usersSnap = await getDocs(usersRef);
    
    console.log(`Found ${usersSnap.docs.length} total users\n`);
    
    // Filter students only
    const students = [];
    usersSnap.docs.forEach(userDoc => {
      const data = userDoc.data();
      const role = (data.role || '').toLowerCase();
      
      // Identify students
      if (role === 'student' || role === 'user' || role === '') {
        students.push({
          id: userDoc.id,
          ...data
        });
      }
    });
    
    console.log(`📋 Found ${students.length} students to migrate\n`);
    
    if (students.length === 0) {
      console.log('⚠️ No students found to migrate.');
      return;
    }
    
    // Confirm migration
    const confirm = window.confirm(
      `Found ${students.length} students to migrate to learners collection.\n\n` +
      `This will:\n` +
      `✓ Create documents in 'learners' collection\n` +
      `✓ Keep original documents in 'bharatam_users'\n` +
      `✓ Not modify or delete any existing data\n\n` +
      `Continue with migration?`
    );
    
    if (!confirm) {
      console.log('❌ Migration cancelled by user');
      return;
    }
    
    // Migrate students one by one
    console.log('🚀 Starting migration...\n');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      try {
        const learnerRef = doc(db, "learners", student.id);
        
        await setDoc(learnerRef, {
          // Basic Info
          name: student.fullName || student.name || 'Unknown',
          fullName: student.fullName || student.name || '',
          email: student.email || '',
          phoneNumber: student.phoneNumber || '',
          
          // Profile
          photoUrl: student.photoUrl || student.photoURL || '',
          
          // Learning Data
          enrolledCourses: student.enrolledCourses || [],
          completedCourses: student.completedCourses || [],
          purchaseHistory: student.purchaseHistory || [],
          
          // Metadata
          createdAt: student.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActive: student.lastActive || serverTimestamp(),
          
          // Status
          isActive: true,
          isBlocked: student.isBlocked || false,
          
          // Original data (for reference)
          migratedFrom: 'bharatam_users',
          migratedAt: serverTimestamp()
        });
        
        successCount++;
        console.log(`✅ [${i + 1}/${students.length}] Migrated: ${student.fullName || student.name || student.id}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ [${i + 1}/${students.length}] Failed to migrate ${student.id}:`, error.message);
      }
    }
    
    // Summary
    console.log('\n═══════════════════════════════════════');
    console.log('📊 MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total students: ${students.length}`);
    console.log('═══════════════════════════════════════\n');
    
    if (successCount > 0) {
      console.log('✅ Students have been copied to learners collection!');
      console.log('✅ Original data in bharatam_users remains unchanged.');
      console.log('\nNext steps:');
      console.log('1. Refresh SuperAdmin Dashboard');
      console.log('2. Check Total Students count');
      console.log('3. Verify it matches the migrated count\n');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you are logged in as SuperAdmin');
    console.log('2. Check Firestore permissions');
    console.log('3. Verify internet connection');
    console.log('4. Check browser console for detailed errors');
  }
};

// Function to verify migration
const verifyMigration = async () => {
  console.log('🔍 Verifying migration...\n');
  
  try {
    if (typeof db === 'undefined') {
      console.error('❌ Firebase (db) not found.');
      return;
    }
    
    const { collection, getDocs } = window.firebase.firestore || {};
    
    // Count students in bharatam_users
    const usersSnap = await getDocs(collection(db, "bharatam_users"));
    const studentsInUsers = usersSnap.docs.filter(doc => {
      const role = (doc.data().role || '').toLowerCase();
      return role === 'student' || role === 'user' || role === '';
    }).length;
    
    // Count learners
    const learnersSnap = await getDocs(collection(db, "learners"));
    const learnersCount = learnersSnap.docs.length;
    
    console.log('═══════════════════════════════════════');
    console.log('📊 MIGRATION VERIFICATION');
    console.log('═══════════════════════════════════════');
    console.log(`Students in bharatam_users: ${studentsInUsers}`);
    console.log(`Learners in learners: ${learnersCount}`);
    console.log('═══════════════════════════════════════\n');
    
    if (learnersCount === studentsInUsers) {
      console.log('✅ Migration successful! All students copied.');
    } else if (learnersCount > 0 && learnersCount < studentsInUsers) {
      console.log('⚠️ Partial migration. Some students missing.');
      console.log(`Missing: ${studentsInUsers - learnersCount} students`);
    } else if (learnersCount > studentsInUsers) {
      console.log('✅ Learners collection has more entries (might include manually added learners).');
    } else {
      console.log('❌ No learners found. Migration may have failed.');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
};

// Function to create a test learner
const createTestLearner = async () => {
  console.log('➕ Creating test learner...\n');
  
  try {
    if (typeof db === 'undefined') {
      console.error('❌ Firebase (db) not found.');
      return;
    }
    
    const { collection, addDoc, serverTimestamp } = window.firebase.firestore || {};
    
    const testLearner = {
      name: 'Test Student ' + Date.now(),
      fullName: 'Test Student ' + Date.now(),
      email: `teststudent${Date.now()}@example.com`,
      phoneNumber: '+91-' + Math.floor(Math.random() * 9000000000 + 1000000000),
      photoUrl: '',
      enrolledCourses: [],
      completedCourses: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      isActive: true,
      isBlocked: false
    };
    
    const docRef = await addDoc(collection(db, "learners"), testLearner);
    
    console.log('✅ Test learner created successfully!');
    console.log('Learner ID:', docRef.id);
    console.log('Name:', testLearner.name);
    console.log('Email:', testLearner.email);
    console.log('\nRefresh SuperAdmin Dashboard to see updated count.\n');
    
  } catch (error) {
    console.error('❌ Failed to create test learner:', error);
  }
};

// Instructions
console.log('\n📚 MIGRATION TO LEARNERS COLLECTION\n');
console.log('Available functions:');
console.log('1. migrateStudentsToLearners() - Migrate all students to learners');
console.log('2. verifyMigration()           - Verify migration was successful');
console.log('3. createTestLearner()         - Create a test learner');
console.log('\nRecommended workflow:');
console.log('  1. Run verifyMigration() to see current state');
console.log('  2. Run migrateStudentsToLearners() to migrate');
console.log('  3. Run verifyMigration() again to confirm\n');
console.log('To start, run:');
console.log('  > migrateStudentsToLearners()\n');
