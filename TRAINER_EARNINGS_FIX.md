# Trainer Dashboard Earnings Fix

## 🐛 Issue
The trainer dashboard was showing negative earnings (₹-7,203) instead of showing the actual earnings from course sales.

## ✅ Solution Applied

### What Was Changed
**File:** `src/components/StaffPortal.jsx`

### Changes Made:

#### 1. **Fixed Earnings Calculation Logic** ✅
- **Before:** Earnings subtracted payouts, causing negative values
- **After:** Earnings shows only total revenue earned (credits only)

**Why:** The "Total Earnings" should show cumulative revenue from course sales, NOT net balance after payouts. Payouts are tracked separately in the wallet section.

#### 2. **Added Negative Value Protection** ✅
```javascript
// Ensure earnings is never negative (show 0 instead)
const finalEarnings = Math.max(0, Math.round(totalEarnings));
```

**Why:** Even if there's no data, earnings should display ₹0, not negative values.

#### 3. **Improved Fallback Calculation** ✅
```javascript
// Only count credits (earned revenue), not debits (payouts)
if (!hasPurchaseData && transactions.length > 0) {
  const credits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0);
  const TRAINER_SHARE = 0.75;
  totalEarnings = credits * TRAINER_SHARE;
}
```

**Why:** Separates "total earnings" from "available balance". Total earnings = all revenue. Available balance = revenue - payouts.

---

## 📊 Understanding the Difference

### Total Earnings (Dashboard Card)
- **What it shows:** Total revenue earned from all course sales
- **Calculation:** Sum of all purchases × 75% (trainer's share)
- **Never decreases:** Only increases when courses are sold
- **Purpose:** Shows overall performance/success

### Available Balance (Wallet Section)
- **What it shows:** Current balance available for payout
- **Calculation:** Total earnings - payouts already withdrawn
- **Can decrease:** Goes down when payouts are made
- **Purpose:** Shows money available to withdraw now

---

## 🎯 How It Works Now

### Scenario 1: No Sales Yet
```
Total Earnings: ₹0          ✅ (Shows 0, not negative)
Available Balance: ₹0
```

### Scenario 2: First Sale
```
Student buys course for ₹1,000
Trainer's 75% share = ₹750

Total Earnings: ₹750        ✅ (Increases)
Available Balance: ₹750      (Can request payout)
```

### Scenario 3: After Payout
```
Trainer requests payout of ₹500

Total Earnings: ₹750        ✅ (Stays the same - lifetime earnings)
Available Balance: ₹250      (Decreased by payout)
```

### Scenario 4: Multiple Sales
```
More students buy courses
Total new revenue = ₹2,000
Trainer's share = ₹1,500

Total Earnings: ₹2,250      ✅ (750 + 1,500)
Available Balance: ₹1,750    (250 + 1,500)
```

---

## 🔍 Data Sources (Priority Order)

The system tries to calculate earnings from these sources:

### 1. **Purchases Collection** (Primary)
```javascript
collection(db, 'purchases')
where('trainerId', '==', user.uid)
```
- Most accurate source
- Contains all course purchases
- Automatically calculates 75% trainer share

### 2. **Payments/Orders/Enrollments** (Fallback)
```javascript
['payments', 'orders', 'enrollments']
where('trainerId', '==', user.uid)
```
- Alternative collections
- Filters out payouts (type: 'debit' or 'payout')
- Counts only revenue (credits)

### 3. **Transactions Array** (Last Resort)
```javascript
transactions.filter(t => t.type === 'credit')
```
- Uses in-memory transaction data
- Sums up all credits
- Applies 75% trainer share

---

## 💰 Trainer Revenue Share

**Platform Split:**
- **Trainer:** 75% of course price
- **Platform:** 25% of course price

**Example:**
```
Course Price: ₹1,000
Trainer Gets: ₹750
Platform Gets: ₹250
```

---

## 🧪 Testing

### Test Case 1: New Trainer (No Data)
**Expected:**
- Total Earnings: ₹0
- Students: 0
- No negative values

### Test Case 2: One Purchase
**Setup:**
- Create a purchase document with amount: 1000, trainerId: [trainer_uid]

**Expected:**
- Total Earnings: ₹750 (75% of 1000)
- Students: 1 (unique buyer)

### Test Case 3: After Payout
**Setup:**
- Create payout document with amount: 500, type: 'debit'

**Expected:**
- Total Earnings: ₹750 (unchanged - lifetime earnings)
- Available Balance: ₹250 (in wallet section)

### Test Case 4: Multiple Purchases
**Setup:**
- Multiple purchase documents with different amounts

**Expected:**
- Total Earnings: Sum of (all purchases × 0.75)
- Students: Count of unique userIds
- All values positive

---

## 📝 Code Comments Added

The updated code includes clear comments:

```javascript
// Only count credits (revenue) for total earnings display
// Payouts are tracked separately in the wallet/transactions section

// Ensure earnings is never negative (show 0 instead)
const finalEarnings = Math.max(0, Math.round(totalEarnings));
```

---

## ✅ What's Fixed

- ✅ **Negative earnings removed** - Now shows ₹0 minimum
- ✅ **Dynamic calculation** - Based on actual purchase data
- ✅ **Correct logic** - Total earnings = revenue only, not net balance
- ✅ **Multiple data sources** - Falls back if primary source unavailable
- ✅ **Trainer share applied** - Automatic 75% calculation
- ✅ **Protected against errors** - Safe defaults if data missing

---

## 🎉 Result

The trainer dashboard now shows:
- ✅ **Accurate lifetime earnings** from course sales
- ✅ **Never negative** - minimum ₹0
- ✅ **Dynamically calculated** from Firestore data
- ✅ **Properly formatted** with locale-specific number formatting

---

## 🔧 Where to Find It

**Component:** `src/components/StaffPortal.jsx`

**Location in UI:**
- Trainer Dashboard
- Top left card labeled "Earnings"
- Shows: ₹{amount} (e.g., ₹45,750)

**Related Sections:**
- Wallet section (Available Balance)
- Revenue chart (Monthly breakdown)
- Transactions list (Credit/debit history)

---

## 📚 Related Documentation

- See `StaffPortal.jsx` lines ~330-455 for full earnings calculation
- Transactions section for payout tracking
- Dashboard stats section for display logic

---

**Date Fixed:** June 5, 2026  
**Status:** ✅ Complete  
**Impact:** Positive earnings display for all trainers
