# Earnings & Students Calculations - Complete Guide

## 📊 Overview

This document explains how earnings and student counts are calculated in both the **Trainer Portal** and **SuperAdmin Portal**, ensuring accuracy and consistency.

---

## 🎯 Key Differences Between Portals

### Trainer Portal (StaffPortal.jsx)
**Shows:**
- ✅ Trainer's earnings (75% share of course sales)
- ✅ Students who purchased THIS trainer's courses only

### SuperAdmin Portal (SuperAdminDashboard.jsx)
**Shows:**
- ✅ Total platform revenue (100% of all course sales)
- ✅ All students in the entire system
- ✅ Total payouts to all trainers (75% of total revenue)

---

## 💰 Earnings Calculation

### Trainer Portal - Trainer's Share

**Formula:**
```javascript
Trainer Earnings = (Sum of all purchases for trainer's courses) × 0.75
```

**Revenue Split:**
- **Trainer:** 75% of course price
- **Platform:** 25% of course price

**Example:**
```
Student buys Trainer A's course for ₹1,000

Trainer Portal Shows:
- Earnings: ₹750 (75% of ₹1,000)

SuperAdmin Portal Shows:
- Total Revenue: ₹1,000 (full purchase amount)
- Total Payouts: ₹750 (amount owed to trainers)
```

### Data Sources (Priority Order)

#### 1. **Purchases Collection** (Primary Source)
```javascript
collection(db, 'purchases')
  .where('trainerId', '==', user.uid)
```

**Fields used:**
- `amount` or `price` or `totalAmount` - Purchase amount
- `userId` - Student who made the purchase
- `trainerId` - Trainer who owns the course

**Calculation:**
```javascript
purchases.forEach(purchase => {
  const amount = Number(purchase.amount || purchase.price || purchase.totalAmount || 0);
  const trainerShare = amount * 0.75;
  totalEarnings += trainerShare;
  uniqueStudents.add(purchase.userId);
});
```

#### 2. **Enrollments Collection** (Fallback)
```javascript
// Get trainer's courses
collection(db, 'bharatam_courses')
  .where('trainerId', '==', user.uid)

// Get enrollments for those courses
collection(db, 'enrollments')
  .where('courseId', 'in', trainerCourseIds)
```

**Used when:**
- Purchases collection is empty or not available
- To get student count if purchases don't have userId

#### 3. **Payments/Orders Collections** (Additional Fallback)
```javascript
collection(db, 'payments' | 'orders')
  .where('trainerId', '==', user.uid)
  .where('type', '!=', 'payout')
```

**Filters:**
- Only counts credits (revenue)
- Excludes debits and payouts
- Applies 75% trainer share

#### 4. **Transactions Array** (Last Resort)
```javascript
const credits = transactions.filter(t => t.type === 'credit');
const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
const trainerEarnings = totalCredits * 0.75;
```

**Used when:**
- No Firebase collections available
- Working with in-memory transaction data

---

## 👥 Students Calculation

### Trainer Portal - Unique Students

**What it counts:**
- Students who **purchased** or **enrolled** in this trainer's courses
- **Unique count** (same student buying 2 courses = 1 student)

**Data Sources:**

#### 1. **From Purchases** (Primary)
```javascript
const uniqueStudents = new Set();
purchases.forEach(purchase => {
  if (purchase.userId) {
    uniqueStudents.add(purchase.userId);
  }
});
const studentCount = uniqueStudents.size;
```

#### 2. **From Enrollments** (Fallback)
```javascript
// Get trainer's courses
const trainerCourses = await getDocs(
  query(collection(db, 'bharatam_courses'), 
  where('trainerId', '==', user.uid))
);

// Get enrollments for those courses
enrollments.forEach(enrollment => {
  if (trainerCourseIds.includes(enrollment.courseId)) {
    uniqueStudents.add(enrollment.userId);
  }
});
```

### SuperAdmin Portal - All Students

**What it counts:**
- All users with role: `'student'`, `'user'`, or empty role
- Total count across entire platform

**Calculation:**
```javascript
const totalStudents = usersList.filter(u => {
  const role = (u.role || '').toLowerCase();
  return role === 'student' || role === 'user' || role === '';
}).length;
```

---

## 📈 Example Scenarios

### Scenario 1: New Trainer with No Sales

**Trainer Portal:**
```
Earnings: ₹0
Students: 0
```

**SuperAdmin Portal:**
```
Total Revenue: ₹X,XXX (from all trainers)
Total Students: XXX (all students in system)
Total Payouts: ₹X,XXX (to all trainers)
```

### Scenario 2: Trainer with 3 Sales

**Sales:**
1. Student A buys Course 1 for ₹1,000
2. Student B buys Course 1 for ₹1,000
3. Student A buys Course 2 for ₹2,000

**Trainer Portal Shows:**
```
Earnings: ₹3,000
Calculation: (1,000 + 1,000 + 2,000) × 0.75 = ₹3,000

Students: 2
Calculation: Unique students (A, B) = 2
Note: Student A bought 2 courses but counted once
```

**SuperAdmin Portal Shows:**
```
Total Revenue: ₹4,000 (if no other sales)
Calculation: Full purchase amounts from all trainers

Total Students: X
Calculation: All students in entire system
```

### Scenario 3: Multiple Trainers

**Platform has:**
- Trainer A: 2 sales (₹2,000 total)
- Trainer B: 3 sales (₹3,000 total)

**Trainer A Portal:**
```
Earnings: ₹1,500 (₹2,000 × 0.75)
Students: X (only A's students)
```

**Trainer B Portal:**
```
Earnings: ₹2,250 (₹3,000 × 0.75)
Students: Y (only B's students)
```

**SuperAdmin Portal:**
```
Total Revenue: ₹5,000 (₹2,000 + ₹3,000)
Total Students: Z (all students in system)
Total Payouts: ₹3,750 (₹1,500 + ₹2,250)
```

---

## 🔄 Data Flow

### When a Student Purchases a Course

1. **Purchase document created:**
```javascript
{
  userId: "student123",
  trainerId: "trainer456",
  courseId: "course789",
  amount: 1000,
  createdAt: new Date()
}
```

2. **Trainer Portal updates:**
- Fetches purchases where `trainerId == trainer456`
- Calculates: `1000 × 0.75 = ₹750`
- Adds `student123` to unique students set
- Updates dashboard: Earnings +₹750, Students +1 (if new)

3. **SuperAdmin Portal updates:**
- Fetches ALL purchases
- Calculates: Total revenue +₹1,000
- Total payouts: +₹750
- Checks if `student123` is a new student

---

## ✅ Validation Checklist

### For Trainer Portal
- [ ] Earnings shows 75% of course sales
- [ ] Students count is unique purchasers/enrollees
- [ ] Earnings never negative (minimum ₹0)
- [ ] Students count matches actual purchasers
- [ ] Data fetched from Firebase (not hardcoded)

### For SuperAdmin Portal
- [ ] Total Revenue shows 100% of all sales
- [ ] Total Students counts all users in system
- [ ] Total Payouts shows 75% of total revenue
- [ ] All metrics update dynamically

---

## 🧪 Testing

### Test 1: Create a Purchase
```javascript
// Add to Firestore: bharatam_courses/purchases
{
  userId: "test_student_001",
  trainerId: "test_trainer_001",
  courseId: "test_course_001",
  amount: 1000,
  createdAt: new Date()
}
```

**Expected Results:**
- Trainer Portal: Earnings = ₹750, Students = 1
- SuperAdmin Portal: Revenue +₹1,000

### Test 2: Same Student, Different Course
```javascript
{
  userId: "test_student_001",  // Same student
  trainerId: "test_trainer_001",
  courseId: "test_course_002",  // Different course
  amount: 2000,
  createdAt: new Date()
}
```

**Expected Results:**
- Trainer Portal: Earnings = ₹2,250 (₹750 + ₹1,500), Students = 1 (same student)

### Test 3: Different Student
```javascript
{
  userId: "test_student_002",  // New student
  trainerId: "test_trainer_001",
  courseId: "test_course_001",
  amount: 1000,
  createdAt: new Date()
}
```

**Expected Results:**
- Trainer Portal: Earnings = ₹3,000 (₹2,250 + ₹750), Students = 2

---

## 🔧 Code Locations

### Trainer Portal (StaffPortal.jsx)
**Lines:** ~342-460

**Key Functions:**
- `computeStats()` - Calculates earnings and students
- `useEffect()` - Runs when transactions, user, or courses change

**State:**
```javascript
const [dashboardStats, setDashboardStats] = useState({
  earnings: 0,
  students: 0
});
```

### SuperAdmin Portal (SuperAdminDashboard.jsx)
**Lines:** ~2003-2036

**Calculations:**
```javascript
const totalRevenue = purchasesList.reduce((sum, purchase) => {
  return sum + Number(purchase.amount || 0);
}, 0);

const totalStudents = usersList.filter(u => {
  const role = (u.role || '').toLowerCase();
  return role === 'student' || role === 'user' || role === '';
}).length;
```

---

## 📋 Firestore Collections Structure

### purchases
```javascript
{
  id: "purchase_123",
  userId: "student_abc",           // Who bought
  trainerId: "trainer_xyz",        // Whose course
  courseId: "course_456",          // Which course
  amount: 1000,                    // Full purchase amount
  price: 1000,                     // Alternate field
  totalAmount: 1000,               // Alternate field
  createdAt: Timestamp,
  type: "purchase"                 // Not "debit" or "payout"
}
```

### enrollments
```javascript
{
  id: "enrollment_123",
  userId: "student_abc",
  courseId: "course_456",
  amount: 1000,                    // Optional
  enrolledAt: Timestamp,
  status: "active"
}
```

### bharatam_users
```javascript
{
  id: "student_abc",
  fullName: "John Doe",
  role: "student",                 // or "user" or ""
  createdAt: Timestamp
}
```

---

## 🎯 Summary

### Trainer Portal
- **Purpose:** Show individual trainer's performance
- **Earnings:** 75% of their course sales
- **Students:** Unique purchasers/enrollees of their courses
- **Data:** Filtered by `trainerId`

### SuperAdmin Portal
- **Purpose:** Show overall platform metrics
- **Revenue:** 100% of all course sales
- **Students:** All students in the system
- **Payouts:** 75% of total revenue (owed to trainers)

### Consistency
Both portals fetch data from **the same Firebase collections**, ensuring:
- ✅ Same data source
- ✅ Same timestamp
- ✅ Consistent calculations
- ✅ Real-time updates

---

## 🚀 Improvements Made

1. **Removed Hardcoded Values** ✅
   - No more static earnings or student counts
   - All data fetched from Firebase

2. **Multiple Fallbacks** ✅
   - Purchases → Enrollments → Payments → Transactions
   - Ensures data always displays

3. **Accurate Student Count** ✅
   - Uses unique purchasers (Set data structure)
   - Counts students who actually bought courses
   - Falls back to enrollments if needed

4. **Consistent Calculations** ✅
   - Same 75% trainer share across all sources
   - Same filtering logic (exclude payouts)
   - Same validation (never negative)

5. **Better Error Handling** ✅
   - Try-catch for each data source
   - Console warnings for debugging
   - Graceful fallbacks

---

**Last Updated:** June 5, 2026  
**Status:** ✅ Complete - Both portals now fetch accurate data from Firebase
