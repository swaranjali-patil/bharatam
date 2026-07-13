# Revenue and Payout Logic - Super Admin Dashboard

## Overview
The Super Admin Dashboard now displays **dynamic, real-time** revenue and payout data fetched from Firestore collections. This document explains the calculation logic and data sources.

---

## 📊 Total Revenue Calculation

### **What is Total Revenue?**
Total Revenue represents the **total amount paid by students** for course enrollments across the platform.

### **Data Source:**
The system fetches data from the following Firestore collections (in order of priority):
1. **`purchases`** (primary)
2. **`payments`** (fallback)
3. **`orders`** (fallback)
4. **`enrollments`** (fallback)

### **Calculation Logic:**
```javascript
const totalRevenue = purchasesList.reduce((sum, purchase) => {
  // Extract amount from purchase document
  const amount = Number(
    purchase.amount ||        // First priority
    purchase.price ||         // Second priority
    purchase.totalAmount ||   // Third priority
    0                         // Default to 0 if no value
  );
  return sum + amount;
}, 0);
```

### **Fields Used:**
Each purchase document should contain:
- `amount` or `price` or `totalAmount`: The purchase price
- `userId`: Student who made the purchase
- `courseId`: Course that was purchased
- `trainerId`: Trainer who created the course
- `createdAt`: Purchase timestamp
- `status`: Payment status (completed, pending, failed)

### **Example Purchase Document:**
```json
{
  "id": "purchase123",
  "userId": "student_uid_abc",
  "courseId": "course_xyz",
  "trainerId": "trainer_uid_123",
  "amount": 1499,
  "status": "completed",
  "createdAt": "2026-06-05T10:30:00Z"
}
```

---

## 💸 Total Payouts Calculation

### **What is Total Payouts?**
Total Payouts represents the **total amount paid (or to be paid) to trainers** for their course sales. This is typically 70-80% of the total revenue, with the remaining 20-30% being the platform fee.

### **Two Methods:**

#### **Method 1: Actual Payouts (Preferred)**
If you have a `payouts` collection tracking actual trainer payouts:

```javascript
const actualPayouts = payoutsList.reduce((sum, payout) => {
  const amount = Number(payout.amount || 0);
  // Only count completed payouts
  if (payout.status === 'completed' || 
      payout.status === 'approved' || 
      payout.status === 'paid') {
    return sum + amount;
  }
  return sum;
}, 0);
```

**Payout Document Structure:**
```json
{
  "id": "payout456",
  "trainerId": "trainer_uid_123",
  "amount": 1124,
  "status": "completed",
  "createdAt": "2026-06-05T12:00:00Z",
  "transactionId": "txn_789"
}
```

#### **Method 2: Estimated Payouts (Fallback)**
If no actual payout records exist, the system calculates estimated payouts based on revenue share:

```javascript
const TRAINER_REVENUE_SHARE = 0.75; // 75% to trainers, 25% platform fee
const estimatedPayouts = Math.round(totalRevenue * TRAINER_REVENUE_SHARE);
```

### **Final Decision:**
```javascript
const totalPayouts = actualPayouts > 0 ? actualPayouts : estimatedPayouts;
```

---

## 🔄 Revenue Share Breakdown

### **Default Split:**
- **Trainers:** 75% of revenue
- **Platform:** 25% of revenue (covers hosting, infrastructure, support)

### **Example:**
If Total Revenue = ₹10,000:
- **Total Payouts (to trainers)** = ₹7,500
- **Platform Fee** = ₹2,500

You can adjust the `TRAINER_REVENUE_SHARE` constant in the code to change this split:
- 0.70 = 70% to trainers, 30% platform fee
- 0.75 = 75% to trainers, 25% platform fee (current)
- 0.80 = 80% to trainers, 20% platform fee

---

## 📈 Real-Time Updates

The dashboard uses Firestore's `onSnapshot` to listen for real-time updates:

```javascript
// Listen to purchases collection
const unsubscribePurchases = onSnapshot(
  collection(db, "purchases"), 
  (snapshot) => {
    const purchases = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPurchasesList(purchases);
  }
);

// Listen to payouts collection
const unsubscribePayouts = onSnapshot(
  collection(db, "payouts"), 
  (snapshot) => {
    const payouts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPayoutsList(payouts);
  }
);
```

Whenever a new purchase is made or a payout is completed, the dashboard **automatically updates** without needing to refresh the page.

---

## 🎯 Where It's Displayed

The revenue and payout figures appear in **three locations** in the Overview tab:

### 1. **Top Stats Cards** (with sparklines)
- Shows trending data over the last 5 weeks

### 2. **Revenue Breakdown Section** (middle)
- Shows detailed breakdown by category

### 3. **Bottom Summary Stats**
- Quick summary with all key metrics

All three sections now fetch data from the same source, ensuring consistency.

---

## 🛠️ Firestore Security Rules

Make sure your Firestore rules allow Super Admin to read purchases and payouts:

```javascript
match /purchases/{purchaseId} {
  allow read: if isSignedIn() && 
                 (resource.data.userId == request.auth.uid ||
                  resource.data.trainerId == request.auth.uid ||
                  isAdmin());
  allow create: if isSignedIn() && 
                   request.resource.data.userId == request.auth.uid;
}

match /payouts/{payoutId} {
  allow read: if isSignedIn() && 
                 (resource.data.trainerId == request.auth.uid ||
                  isAdmin());
  allow create, update: if isAdmin();
}
```

---

## 📊 Testing with Sample Data

If you don't have real purchase data yet, you can create test documents:

### **Create Test Purchase:**
```javascript
// In Firebase Console or via code
await addDoc(collection(db, "purchases"), {
  userId: "student_test_123",
  courseId: "course_abc",
  trainerId: "trainer_xyz",
  amount: 1499,
  status: "completed",
  createdAt: new Date()
});
```

### **Create Test Payout:**
```javascript
await addDoc(collection(db, "payouts"), {
  trainerId: "trainer_xyz",
  amount: 1124, // 75% of 1499
  status: "completed",
  createdAt: new Date(),
  transactionId: "txn_test_001"
});
```

---

## 🔍 Debugging

To verify data is being fetched correctly, check the browser console:

```javascript
console.log("Purchases:", purchasesList);
console.log("Payouts:", payoutsList);
console.log("Total Revenue:", totalRevenue);
console.log("Total Payouts:", totalPayouts);
```

---

## ✅ Summary

| Metric | Calculation | Data Source |
|--------|-------------|-------------|
| **Total Revenue** | Sum of all `purchase.amount` | `purchases` collection |
| **Total Payouts** | Sum of completed `payout.amount` OR 75% of revenue | `payouts` collection (or estimated) |
| **Platform Fee** | Total Revenue - Total Payouts | Calculated (25% of revenue) |

**The dashboard is now fully dynamic and will update in real-time as students make purchases and trainers receive payouts!** 🚀
