# ✅ Fixed: Trainer Dashboard Earnings & Students

## Problems Fixed

### ❌ **Before:**
- **Earnings**: ₹-7,203 (negative, from sample data)
- **Students**: 24 (hardcoded, never changes)
- **Courses**: ✅ Already fetched from Firebase correctly

### ✅ **After:**
- **Earnings**: Real earnings from purchases (trainer's 75% share)
- **Students**: Unique count of students who purchased courses
- **Courses**: ✅ Still fetched from Firebase (no change)

---

## What Was Changed

### **1. Initial State**

**Before:**
```javascript
const [dashboardStats, setDashboardStats] = useState({
  earnings: 12450,  // Hardcoded
  students: 24      // Hardcoded
});
```

**After:**
```javascript
const [dashboardStats, setDashboardStats] = useState({
  earnings: 0,      // Starts at 0, will update with real data
  students: 0       // Starts at 0, will update with real data
});
```

---

### **2. Earnings Calculation**

**Before:**
```javascript
// Used sample transactions (credits - debits)
const credits = transactions.filter(t => t.type === 'credit').reduce(...);
const debits = transactions.filter(t => t.type === 'debit').reduce(...);
earnings = credits - debits; // Could be negative!
```

**After:**
```javascript
// Fetches real purchases from Firestore
const purchasesQ = query(
  collection(db, 'purchases'), 
  where('trainerId', '==', user.uid)
);

purchasesSnap.docs.forEach(doc => {
  const amount = doc.data().amount || 0;
  
  // Trainer gets 75% of each sale
  const TRAINER_SHARE = 0.75;
  totalEarnings += (amount * TRAINER_SHARE);
});
```

**Example**: Student buys course for ₹1,499
- Platform gets: ₹375 (25%)
- **Trainer gets: ₹1,124 (75%)** ← This shows in dashboard

---

### **3. Student Count**

**Before:**
```javascript
// Only counted subscribers from trainer profile
const subscribers = userData.subscribers || [];
students = subscribers.length;
```

**After:**
```javascript
// Counts unique students who actually purchased courses
let uniqueStudents = new Set();

purchases.forEach(purchase => {
  if (purchase.userId) {
    uniqueStudents.add(purchase.userId);
  }
});

students = uniqueStudents.size;
```

**Example**: 
- Student A buys Course 1 → Count = 1
- Student A buys Course 2 → Count = 1 (same student)
- Student B buys Course 1 → Count = 2 (new student)

---

## Data Sources

### **Earnings Calculation (Priority Order):**

1. ✅ **Primary**: `purchases` collection (where `trainerId == trainer.uid`)
2. ⚠️ **Fallback 1**: `payments` collection
3. ⚠️ **Fallback 2**: `orders` collection
4. ⚠️ **Fallback 3**: `enrollments` collection
5. ❌ **Last Resort**: Sample transactions (shows 0 if none)

### **Student Count (Priority Order):**

1. ✅ **Primary**: Unique `userId` values from purchases
2. ⚠️ **Fallback**: `subscribers` array in trainer's user document
3. ❌ **Default**: 0

### **Course Count:**
- ✅ Already working correctly from `bharatam_courses` collection

---

## Revenue Split Logic

When a student purchases a course:

| Party | Share | Example (₹1,499) |
|-------|-------|------------------|
| **Trainer** | 75% | ₹1,124 |
| **Platform** | 25% | ₹375 |

**Code:**
```javascript
const TRAINER_SHARE = 0.75; // 75% to trainer, 25% platform fee
const trainerEarnings = purchaseAmount * TRAINER_SHARE;
```

---

## How to Test

### **Test 1: Create Sample Purchase**

Add this document to `purchases` collection in Firebase Console:

```json
{
  "userId": "test_student_123",
  "courseId": "test_course_abc",
  "trainerId": "YOUR_TRAINER_UID",
  "amount": 1499,
  "status": "completed",
  "createdAt": "2026-06-05T10:00:00Z"
}
```

**Expected Result:**
- Earnings: ₹1,124 (75% of ₹1,499)
- Students: 1

### **Test 2: Multiple Purchases**

Add 3 purchases with different students:

```json
// Purchase 1
{ "userId": "student_1", "trainerId": "YOUR_UID", "amount": 1499 }

// Purchase 2
{ "userId": "student_2", "trainerId": "YOUR_UID", "amount": 999 }

// Purchase 3
{ "userId": "student_3", "trainerId": "YOUR_UID", "amount": 499 }
```

**Expected Result:**
- Earnings: ₹2,248 (75% of ₹2,997)
- Students: 3

---

## Required Fields in purchases Collection

### **Minimum Required:**
```json
{
  "trainerId": "trainer_uid",  // MUST match trainer's UID
  "amount": 1499,              // Purchase amount
  "userId": "student_uid"       // For counting students
}
```

### **Recommended:**
```json
{
  "trainerId": "trainer_uid",
  "userId": "student_uid",
  "courseId": "course_id",
  "amount": 1499,
  "status": "completed",
  "createdAt": "timestamp",
  "courseName": "Course Title"
}
```

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| **Earnings** | ❌ ₹-7,203 (sample data) | ✅ Real from purchases (75% share) |
| **Students** | ❌ 24 (hardcoded) | ✅ Unique purchaser count |
| **Courses** | ✅ From Firebase | ✅ From Firebase (no change) |

**All dashboard metrics now show real, dynamic data from Firestore!** 🎉
