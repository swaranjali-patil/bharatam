# 🚨 DEPLOY FIRESTORE RULES NOW - EXACT STEPS

## ⚡ You're getting this error because Firestore rules are NOT deployed yet!

```
Failed to create course: Missing or insufficient permissions
```

---

## 📋 FOLLOW THESE EXACT STEPS (5 minutes):

### STEP 1: Open Firebase Console

Click this link:
👉 **https://console.firebase.google.com/project/bharatam-f3cd7/firestore/rules**

(Or manually: Firebase Console → Firestore Database → Rules tab)

---

### STEP 2: Replace ALL Rules

**DELETE everything** in the rules editor and **PASTE THIS:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is super admin
    function isSuperAdmin() {
      return isAuthenticated() && 
             (get(/databases/$(database)/documents/bharatam_users/$(request.auth.uid)).data.role == 'superadmin' ||
              get(/databases/$(database)/documents/bharatam_users/$(request.auth.uid)).data.role == 'super_admin' ||
              get(/databases/$(database)/documents/bharatam_users/$(request.auth.uid)).data.isSuperAdmin == true);
    }
    
    // Helper function to check if user is trainer/staff
    function isTrainer() {
      return isAuthenticated() && 
             (get(/databases/$(database)/documents/bharatam_users/$(request.auth.uid)).data.role == 'trainer' ||
              get(/databases/$(database)/documents/bharatam_users/$(request.auth.uid)).data.role == 'staff');
    }
    
    // Users collection
    match /bharatam_users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isSuperAdmin());
      allow create, update: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isSuperAdmin();
    }
    
    // Courses collection - THIS IS THE KEY RULE!
    match /bharatam_courses/{courseId} {
      // Allow anyone to read approved courses
      allow read: if resource.data.status == 'Approved' || resource.data.approvalStatus == 'approved';
      // Allow trainers to read their own courses (any status)
      allow read: if isAuthenticated() && resource.data.trainerId == request.auth.uid;
      // Allow super admin to read all courses
      allow read: if isSuperAdmin();
      
      // ⭐ THIS ALLOWS TRAINERS TO CREATE COURSES
      allow create: if isAuthenticated() && 
                       (isTrainer() || isSuperAdmin()) &&
                       request.resource.data.trainerId == request.auth.uid;
      
      // Allow trainers to update their own courses
      allow update: if isAuthenticated() && 
                       resource.data.trainerId == request.auth.uid;
      
      // Allow super admin to update any course
      allow update: if isSuperAdmin();
      
      // Allow trainers to delete their own courses
      allow delete: if isAuthenticated() && resource.data.trainerId == request.auth.uid;
      allow delete: if isSuperAdmin();
      
      // Videos subcollection
      match /videos/{videoId} {
        allow read: if true;
        allow write: if isAuthenticated() && 
                        (get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid ||
                         isSuperAdmin());
      }
      
      // PDFs subcollection
      match /pdfs/{pdfId} {
        allow read: if true;
        allow write: if isAuthenticated() && 
                        (get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid ||
                         isSuperAdmin());
      }
      
      // PDF subcollection (alternate)
      match /pdf/{pdfId} {
        allow read: if true;
        allow write: if isAuthenticated() && 
                        (get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid ||
                         isSuperAdmin());
      }
      
      // Images subcollection
      match /images/{imageId} {
        allow read: if true;
        allow write: if isAuthenticated() && 
                        (get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid ||
                         isSuperAdmin());
      }
    }
    
    // Categories collection
    match /bharatam_categories/{categoryId} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }
    
    // Advertisements collection
    match /advertisements/{adId} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }
    
    // Orders/Payments/Enrollments
    match /orders/{orderId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.trainerId == request.auth.uid ||
                      isSuperAdmin());
      allow create: if isAuthenticated();
      allow update: if isSuperAdmin();
    }
    
    match /payments/{paymentId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.trainerId == request.auth.uid ||
                      isSuperAdmin());
      allow create: if isAuthenticated();
      allow update: if isSuperAdmin();
    }
    
    match /enrollments/{enrollmentId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.trainerId == request.auth.uid ||
                      isSuperAdmin());
      allow create: if isAuthenticated();
      allow update: if isSuperAdmin();
    }
    
    match /payouts/{payoutId} {
      allow read: if isAuthenticated() && 
                     (resource.data.trainerId == request.auth.uid || isSuperAdmin());
      allow create: if isAuthenticated() && isTrainer();
      allow update: if isSuperAdmin();
    }
    
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### STEP 3: Click "Publish" Button

Look for the **blue "Publish" button** at the top right of the rules editor.

⚠️ **IMPORTANT:** Click "Publish" to save the rules!

---

### STEP 4: Add Role to Your User

1. Click this link:
   👉 **https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data/~2Fbharatam_users**

2. Find YOUR user document (search by your phone number)

3. Click on your user document to open it

4. Look for a field called `role`

5. **If the field EXISTS:**
   - Make sure the value is `"trainer"` or `"superadmin"`

6. **If the field DOES NOT EXIST:**
   - Click "Add field" button
   - Field name: `role`
   - Type: string
   - Value: `trainer`
   - Click "Add"

Your user document should look like this:
```javascript
{
  fullName: "Your Name",
  phoneNumber: "+1234567890",
  role: "trainer",  // ← MUST HAVE THIS!
  uid: "abc123..."
}
```

---

### STEP 5: Refresh and Try Again

1. **In your app (localhost:5174):**
   - Logout
   - Login again
   - Try creating a course again

2. **If still getting error:**
   - Clear browser cache (Ctrl + Shift + Delete)
   - Close and reopen browser
   - Try again

---

## ✅ VERIFICATION

After completing these steps, you should be able to:

- ✅ Create courses without permission error
- ✅ See "Course created successfully!" message
- ✅ Course appears in your dashboard

---

## 🔧 If Still Not Working

### Check 1: Rules are Published
- Go to: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/rules
- Should see "Published" with a timestamp
- Should see the rules you pasted

### Check 2: User Has Role
- Go to: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data/~2Fbharatam_users
- Find your user
- Must have: `role: "trainer"` field

### Check 3: You're Logged In
- Check browser console (F12)
- Look for `request.auth.uid` - should have a value
- If null, you're not logged in properly

### Check 4: Wait 30 Seconds
- Firestore rules take time to propagate
- Wait 30 seconds after publishing
- Then try creating a course

---

## 🎯 Quick Checklist

- [ ] Opened Firebase Console Rules page
- [ ] Pasted the new rules (replaced everything)
- [ ] Clicked "Publish" button
- [ ] Saw "Published" confirmation
- [ ] Found my user in bharatam_users collection
- [ ] Added/verified `role: "trainer"` field
- [ ] Logged out and logged in again
- [ ] Tried creating course again

---

## 📞 Still Getting Error?

**Take a screenshot of:**

1. Firebase Console → Firestore → Rules (showing your published rules)
2. Firebase Console → Firestore → Data → bharatam_users → YOUR user document
3. Browser console (F12) showing the error

This will help debug the issue!

---

## 💡 What These Rules Do

```javascript
// This line allows authenticated users with trainer role to create courses
allow create: if isAuthenticated() && 
                 (isTrainer() || isSuperAdmin()) &&
                 request.resource.data.trainerId == request.auth.uid;
```

**Breaking it down:**
- `isAuthenticated()` - User must be logged in
- `isTrainer()` - User must have `role: "trainer"` in Firestore
- `trainerId == request.auth.uid` - Course trainerId must match logged-in user

**If ANY of these fail, you get "Missing or insufficient permissions"**

---

**Follow these exact steps and the error will be fixed! 🚀**
