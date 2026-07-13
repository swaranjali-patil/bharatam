# 💰 Revenue & Payout Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     E-LEARNING PLATFORM                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   STUDENT   │         │   TRAINER   │         │ SUPER ADMIN │
│             │         │             │         │             │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. Buys Course        │                       │
       │    (₹1499)            │                       │
       │                       │                       │
       ▼                       │                       │
┌─────────────────┐            │                       │
│   FIRESTORE:    │            │                       │
│   purchases     │            │                       │
│ ┌─────────────┐ │            │                       │
│ │  amount:    │ │            │                       │
│ │  1499       │ │◄───────────┼───────────────────────┤
│ │  status:    │ │            │                       │
│ │  completed  │ │            │    3. Reads for      │
│ └─────────────┘ │            │    Total Revenue     │
└─────────────────┘            │                       │
       │                       │                       │
       │ 2. Platform Calculates│                       │
       │    Revenue Split:     │                       │
       │    75% → Trainer      │                       │
       │    25% → Platform     │                       │
       │                       │                       │
       └───────────────────────►                       │
                               │                       │
                        ┌─────────────────┐            │
                        │   FIRESTORE:    │            │
                        │   payouts       │            │
                        │ ┌─────────────┐ │            │
                        │ │  trainerId  │ │            │
                        │ │  amount:    │ │◄───────────┤
                        │ │  1124       │ │            │
                        │ │  status:    │ │    4. Reads for
                        │ │  completed  │ │    Total Payouts
                        │ └─────────────┘ │            │
                        └─────────────────┘            │
                               │                       │
                               │ 5. Trainer receives   │
                               │    payout (₹1124)     │
                               ▼                       │
                        ┌──────────────┐               │
                        │  TRAINER     │               │
                        │  BANK        │               │
                        │  ACCOUNT     │               │
                        └──────────────┘               │
                                                       │
                                                       ▼
                                            ┌──────────────────┐
                                            │  DASHBOARD       │
                                            │  Shows:          │
                                            │  • Total Revenue │
                                            │    ₹1,499       │
                                            │  • Total Payouts│
                                            │    ₹1,124       │
                                            │  • Platform Fee │
                                            │    ₹375 (25%)   │
                                            └──────────────────┘
```

---

## Data Flow Breakdown

### **Step 1: Student Purchase**
```javascript
// When student buys a course
{
  collection: "purchases",
  data: {
    userId: "student_abc",
    courseId: "course_xyz",
    trainerId: "trainer_123",
    amount: 1499,           // ← REVENUE
    status: "completed",
    createdAt: new Date()
  }
}
```

### **Step 2: Revenue Split Calculation**
```javascript
const TOTAL_AMOUNT = 1499;
const TRAINER_SHARE = 0.75;  // 75%
const PLATFORM_SHARE = 0.25; // 25%

const trainerAmount = TOTAL_AMOUNT * TRAINER_SHARE; // ₹1124
const platformAmount = TOTAL_AMOUNT * PLATFORM_SHARE; // ₹375
```

### **Step 3: Payout Created**
```javascript
// When trainer payout is processed
{
  collection: "payouts",
  data: {
    trainerId: "trainer_123",
    amount: 1124,           // ← PAYOUT (75% of ₹1499)
    status: "completed",
    transactionId: "txn_001",
    createdAt: new Date()
  }
}
```

### **Step 4: Dashboard Calculation**
```javascript
// Total Revenue (all purchases)
const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);
// Result: ₹1,499 (or sum of all purchases)

// Total Payouts (completed payouts only)
const totalPayouts = payouts
  .filter(p => p.status === 'completed')
  .reduce((sum, p) => sum + p.amount, 0);
// Result: ₹1,124 (or sum of all completed payouts)

// Platform Earnings
const platformEarnings = totalRevenue - totalPayouts;
// Result: ₹375 (25% fee)
```

---

## Multiple Purchase Example

### **Scenario: 3 Course Purchases**

```
PURCHASES COLLECTION:
┌──────────────────────────────────────┐
│ Purchase 1: ₹1,499 (Course A)        │
│ Purchase 2: ₹2,999 (Course B)        │
│ Purchase 3: ₹499   (Course C)        │
└──────────────────────────────────────┘
           │
           ▼
    Total Revenue = ₹4,997
           │
           ├─── 75% to Trainers (₹3,748)
           │
           └─── 25% to Platform (₹1,249)

PAYOUTS COLLECTION:
┌──────────────────────────────────────┐
│ Payout 1: ₹1,124 (Trainer for A)    │
│ Payout 2: ₹2,249 (Trainer for B)    │
│ Payout 3: ₹374   (Trainer for C)    │
└──────────────────────────────────────┘
           │
           ▼
    Total Payouts = ₹3,747
```

### **Dashboard Shows:**
```
┌─────────────────────────────┐
│  💰 Total Revenue           │
│     ₹4,997                  │
├─────────────────────────────┤
│  💸 Total Payouts           │
│     ₹3,747                  │
├─────────────────────────────┤
│  🏢 Platform Earnings       │
│     ₹1,250                  │
└─────────────────────────────┘
```

---

## Revenue Status Flow

```
PURCHASE LIFECYCLE:
┌─────────┐    ┌─────────┐    ┌───────────┐
│ Pending │ -> │ Success │ -> │ Completed │
└─────────┘    └─────────┘    └───────────┘
                                     │
                                     ▼
                          COUNTED IN REVENUE

PAYOUT LIFECYCLE:
┌─────────┐    ┌──────────┐    ┌───────────┐
│ Pending │ -> │ Approved │ -> │ Completed │
└─────────┘    └──────────┘    └───────────┘
                                     │
                                     ▼
                          COUNTED IN PAYOUTS
```

Only **completed** purchases count toward revenue.
Only **completed/approved/paid** payouts count toward total payouts.

---

## Real-Time Update Flow

```
┌─────────────────────────────────────────────────────┐
│                  FIRESTORE DATABASE                 │
│                                                     │
│  ┌─────────────┐         ┌─────────────┐          │
│  │  purchases  │         │   payouts   │          │
│  └──────┬──────┘         └──────┬──────┘          │
│         │                       │                  │
└─────────┼───────────────────────┼──────────────────┘
          │                       │
          │ onSnapshot()          │ onSnapshot()
          │ (Real-time)           │ (Real-time)
          │                       │
          ▼                       ▼
┌────────────────────────────────────────────────┐
│         SUPER ADMIN DASHBOARD                  │
│                                                │
│  const unsubscribePurchases = onSnapshot(     │
│    collection(db, "purchases"),               │
│    (snapshot) => {                            │
│      // Auto-updates totalRevenue             │
│      setPurchasesList(snapshot.docs);         │
│    }                                          │
│  );                                           │
│                                                │
│  const unsubscribePayouts = onSnapshot(       │
│    collection(db, "payouts"),                 │
│    (snapshot) => {                            │
│      // Auto-updates totalPayouts             │
│      setPayoutsList(snapshot.docs);           │
│    }                                          │
│  );                                           │
└────────────────────────────────────────────────┘
          │                       │
          │                       │
          ▼                       ▼
    ┌─────────────────────────────────┐
    │   DASHBOARD AUTOMATICALLY       │
    │   UPDATES WITHOUT REFRESH       │
    └─────────────────────────────────┘
```

---

## Summary

| Metric | Source | Formula | Example |
|--------|--------|---------|---------|
| **Total Revenue** | `purchases` collection | Sum of all `purchase.amount` | ₹4,997 |
| **Total Payouts** | `payouts` collection | Sum of completed `payout.amount` | ₹3,747 |
| **Platform Fee** | Calculated | Revenue - Payouts | ₹1,250 (25%) |
| **Trainer Share** | Configurable | 75% of revenue | ₹3,748 |

**All values update in real-time as transactions occur!** ⚡
