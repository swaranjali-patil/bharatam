# 🎯 FOUND THE PROBLEM! UID Mismatch

## 🔴 The Issue

Your app is using a DIFFERENT user than the one with `role: "trainer"` in Firebase!

### In Your App:
```
uid: "recovered-8766020070"
```

### In Firebase Console (User with role):
```
uid: "T0HEjn5EBThikW3MkOG8"
role: "trainer" ✅
```

**These don't match!** That's why you get permission denied.

---

## ✅ SOLUTION (Choose One)

### OPTION 1: Add Role to "recovered-8766020070" User (EASIEST)

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data/~2Fbharatam_users

2. **Look for a user with ID:** `recovered-8766020070`

3. **If you find it:**
   - Click on that user document
   - Add or edit the `role` field
   - Set value to: `trainer`
   - Save

4. **If you DON'T find it:**
   - The document will be created when you try to create a course
   - But we need to add the role manually first
   - See "Create Missing User Document" section below

---

### OPTION 2: Login with the Correct Account

The user `T0HEjn5EBThikW3MkOG8` already has `role: "trainer"`.

**Details from Firebase:**
```
uid: T0HEjn5EBThikW3MkOG8
name: "shahid trainer"
phoneNumber: "8208850222"
role: "trainer" ✅
```

**To use this account:**
1. Logout from your app
2. Login using phone number: **8208850222**
3. Try creating a course
4. It should work!

---

## 🔍 How to Check Which User You're Logged In As

Open browser console (F12) and run:

```javascript
const user = firebase.auth().currentUser;
console.log('Current UID:', user.uid);
console.log('Phone:', user.phoneNumber);
console.log('Email:', user.email);
console.log('Display Name:', user.displayName);
```

**You should see:**
```
Current UID: "recovered-8766020070"  ← This is the problem!
```

**It SHOULD be:**
```
Current UID: "T0HEjn5EBThikW3MkOG8"  ← The one with role in Firebase
```

---

## 🔧 FIX: Create/Update the Missing User Document

If the user `recovered-8766020070` doesn't exist in Firestore, you need to create it.

### Step 1: Check if it Exists

1. Go to: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data/~2Fbharatam_users

2. Look through the list of users

3. **Find the document ID:** `recovered-8766020070`

---

### Step 2A: If Document EXISTS

1. Click on the document
2. Check if it has a `role` field
3. If NO role field:
   - Click "+ Add field"
   - Field: `role`
   - Type: `string`
   - Value: `trainer`
   - Click "Add"
4. If role field exists but wrong value:
   - Click on the value
   - Change to: `trainer`
   - Click "Update"

---

### Step 2B: If Document DOES NOT EXIST

You need to create it manually:

1. Click "+ Add document" button

2. Document ID: `recovered-8766020070`

3. Add these fields:
   ```
   Field: name
   Type: string
   Value: your name (e.g., "Shahid Trainer")

   Field: phoneNumber
   Type: string
   Value: your phone number

   Field: role
   Type: string
   Value: trainer

   Field: createdAt
   Type: timestamp
   Value: [current date/time]

   Field: uid
   Type: string
   Value: recovered-8766020070
   ```

4. Click "Save"

---

### Step 3: Verify

After adding the role:

1. Logout from your app
2. Login again
3. Try creating a course
4. ✅ Should work!

---

## 📊 Understanding the Problem

### How Firebase Security Rules Work:

When you try to create a course, the rule checks:

```javascript
function isTrainer() {
  return isSignedIn() &&
    get(/databases/$(database)/documents/bharatam_users/$(request.auth.uid)).data.role in 
    ['trainer', 'Instructor'];
}
```

This translates to:

```
1. Check if user is logged in ✅
2. Get document: bharatam_users/recovered-8766020070
3. Read field: .data.role
4. Check if role is "trainer" or "Instructor"
```

**Currently:**
- Document `bharatam_users/recovered-8766020070` either:
  - Doesn't exist ❌
  - OR exists but doesn't have `role: "trainer"` ❌

**After fix:**
- Document `bharatam_users/recovered-8766020070` will exist ✅
- Will have `role: "trainer"` ✅
- Course creation will work! ✅

---

## 🎯 WHY You Have Multiple UIDs

This usually happens when:

1. **Phone authentication without email**
   - UID might be generated from phone number
   - Format: `recovered-{phoneNumber}`

2. **Multiple authentication methods**
   - Email/password creates one UID
   - Phone creates another UID
   - Google creates another UID

3. **Account recovery or migration**
   - "recovered-" prefix suggests account recovery flow

---

## ✅ RECOMMENDED FIX (Step-by-Step)

### STEP 1: Find the "recovered-8766020070" User

Go to: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data/~2Fbharatam_users

**Search for:** `recovered-8766020070`

---

### STEP 2: Add Role to That User

**If found:**
- Click on document
- Add/edit field: `role` = `trainer`
- Save

**If NOT found:**
- Click "+ Add document"
- Document ID: `recovered-8766020070`
- Add fields:
  ```
  role: "trainer"
  name: "Your Name"
  phoneNumber: "your phone"
  uid: "recovered-8766020070"
  createdAt: [timestamp]
  ```
- Save

---

### STEP 3: Test

1. **Refresh your app** (F5)
2. **Logout and login** again
3. **Try creating a course**
4. ✅ **SUCCESS!**

---

## 🔍 DEBUG: How to Find All Your Users

In browser console (F12):

```javascript
// Get all users from Firestore
firebase.firestore().collection('bharatam_users').get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      console.log('User ID:', doc.id);
      console.log('Data:', doc.data());
      console.log('---');
    });
  });
```

This will show ALL users in `bharatam_users` collection.

**Look for:**
- User with ID: `recovered-8766020070`
- Check if it has `role: "trainer"`

---

## 📸 What to Look For in Firebase Console

You should see TWO users:

### User 1 (Already exists - HAS role):
```
Document ID: T0HEjn5EBThikW3MkOG8
Fields:
  - name: "shahid trainer"
  - phoneNumber: "8208850222"
  - role: "trainer" ✅
```

### User 2 (Currently logged in - NEEDS role):
```
Document ID: recovered-8766020070
Fields:
  - name: [your name]
  - phoneNumber: [your phone]
  - role: ???  ← ADD THIS!
```

---

## ✅ FINAL CHECKLIST

- [ ] Find user with ID: `recovered-8766020070` in Firebase
- [ ] Add or verify `role: "trainer"` field
- [ ] Logout from app
- [ ] Login again
- [ ] Try creating course
- [ ] See success message
- [ ] Course appears in `bharatam_courses` collection with `trainerId: "recovered-8766020070"`

---

## 💡 After This is Fixed

Your new courses will be created with:

```javascript
{
  title: "Your Course Title",
  trainerId: "recovered-8766020070",  ← Your actual UID
  trainerName: "Your Name",
  category: "Category",
  status: "Draft",
  createdAt: [timestamp],
  // ... same structure as other courses
}
```

---

**The fix is simple: Add `role: "trainer"` to the user document with ID `recovered-8766020070`!** 🚀

**Then logout, login, and try creating a course. It will work!** ✅
