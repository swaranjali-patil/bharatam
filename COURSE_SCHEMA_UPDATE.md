# 📋 Course Schema Update - bharatam_courses Collection

## Overview
The `bharatam_courses` collection has been updated to use a **standardized, clean schema** with only the necessary fields.

---

## ✅ New Schema (Final)

### **Required Fields:**

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `courseName` | string | Course title/name | "Vedic Math Basics" |
| `category` | string | Course category | "Vedic Math" |
| `description` | string | Course description | "Learn ancient math techniques" |
| `trainerId` | string | Trainer's UID | "trainer_uid_123" |
| `trainerName` | string | Trainer's full name | "John Doe" |
| `thumbnailUrl` | string | Course thumbnail CDN URL | "https://cdn.url/image.jpg" |
| `oneTimePrice` | number | Regular one-time price | 1499 |
| `lifetimePrice` | number | Lifetime access price | 2999 |
| `limitedTimePrice` | number | Limited time offer price | 999 |
| `limitedTimeDays` | number | Days for limited offer | 30 |
| `approvalStatus` | string | Approval status | "approved", "pending", "draft" |
| `isApproved` | boolean | Quick approval check | true/false |
| `approvedAt` | timestamp/null | When approved | Firestore timestamp or null |
| `contentApprovalStatus` | string | Content approval status | "pending", "approved" |
| `hasPendingContent` | boolean | Has unapproved content | true/false |
| `createdAt` | timestamp | Creation timestamp | Firestore timestamp |
| `updatedAt` | timestamp | Last update timestamp | Firestore timestamp |

---

## ❌ Removed Fields (Old Schema)

These fields are **NO LONGER** saved to Firestore:

- ❌ `title` (replaced by `courseName`)
- ❌ `thumbnail` (replaced by `thumbnailUrl`)
- ❌ `price` (replaced by `oneTimePrice`)
- ❌ `subject` (replaced by `category`)
- ❌ `status` (replaced by `approvalStatus`)
- ❌ `emoji` (not needed)
- ❌ `type` (not needed)
- ❌ `color` (not needed)
- ❌ `videos` (stored in subcollection)
- ❌ `pdfs` (stored in subcollection)
- ❌ `images` (stored in subcollection)

---

## 🔄 Backward Compatibility

To ensure existing code doesn't break, the app **automatically maps** new field names to old ones when reading from Firestore:

### **Field Mapping:**

```javascript
// When reading from Firestore:
{
  courseName: "Vedic Math" → mapped to → title: "Vedic Math"
  thumbnailUrl: "cdn.url" → mapped to → thumbnail: "cdn.url"
  oneTimePrice: 1499 → mapped to → price: 1499
  category: "Math" → mapped to → subject: "Math"
}
```

This means:
- ✅ New courses save with new field names
- ✅ Old code can still use `course.title`, `course.thumbnail`, etc.
- ✅ No breaking changes to UI components

---

## 📊 Complete Document Example

### **New Course Document in Firestore:**

```json
{
  "courseName": "Vedic Math Basics",
  "category": "Vedic Math",
  "description": "Learn ancient Indian mathematics techniques for faster calculations",
  
  "oneTimePrice": 1499,
  "lifetimePrice": 2999,
  "limitedTimePrice": 999,
  "limitedTimeDays": 30,
  
  "thumbnailUrl": "https://cdn.bunny.net/course_thumbnail.jpg",
  
  "trainerId": "trainer_abc123",
  "trainerName": "Rajesh Kumar",
  
  "approvalStatus": "pending",
  "isApproved": false,
  "approvedAt": null,
  
  "contentApprovalStatus": "pending",
  "hasPendingContent": true,
  
  "createdAt": "2026-06-05T10:30:00Z",
  "updatedAt": "2026-06-05T10:30:00Z"
}
```

---

## 💰 Pricing Fields Explained

### **oneTimePrice**
- **What**: Regular one-time purchase price
- **When Used**: Default pricing option
- **Example**: ₹1,499

### **lifetimePrice**
- **What**: Lifetime access price (pay once, access forever)
- **When Used**: Premium pricing tier
- **Example**: ₹2,999
- **Benefit**: Higher upfront cost but lifetime access

### **limitedTimePrice**
- **What**: Discounted price for limited-time offers
- **When Used**: Sales, promotions, early bird pricing
- **Example**: ₹999
- **Duration**: Set by `limitedTimeDays` field

### **limitedTimeDays**
- **What**: Number of days the limited-time offer is valid
- **Default**: 30 days
- **Example**: If set to 7, offer expires in 1 week

### **Pricing Display Logic:**

```javascript
// Students see:
if (currentDate < course.createdAt + limitedTimeDays) {
  // Show limited time price
  price = course.limitedTimePrice;
  showBadge = "Limited Time Offer!";
} else {
  // Show regular price
  price = course.oneTimePrice;
}

// Lifetime access option always shown separately
lifetimeOption = course.lifetimePrice;
```

---

## 📝 Approval Fields Explained

### **approvalStatus**
- **Values**: `"draft"`, `"pending"`, `"approved"`, `"rejected"`
- **Purpose**: Overall course approval status
- **Set By**: Super Admin

### **isApproved**
- **Values**: `true` or `false`
- **Purpose**: Quick boolean check for approval
- **Auto-calculated**: `isApproved = (approvalStatus === "approved")`

### **approvedAt**
- **Values**: Firestore timestamp or `null`
- **Purpose**: Track when course was approved
- **Usage**: Display "Approved on June 5, 2026"

### **contentApprovalStatus**
- **Values**: `"pending"`, `"approved"`
- **Purpose**: Tracks if all course content (videos, PDFs) is approved
- **Auto-updated**: Changes to "approved" when all content is approved

### **hasPendingContent**
- **Values**: `true` or `false`
- **Purpose**: Quick check if course has unapproved videos/PDFs
- **Auto-updated**: `true` if any video/PDF is pending approval

---

## 🔧 Code Changes

### **1. Creating a Course (StaffPortal.jsx)**

**Before:**
```javascript
const newCourseData = {
  title: "Course Title",
  thumbnail: "url",
  price: 1499,
  subject: "Math",
  status: "Pending",
  emoji: "🔢",
  videos: [],
  pdfs: []
};
```

**After:**
```javascript
const newCourseData = {
  courseName: "Course Title",
  thumbnailUrl: "url",
  oneTimePrice: 1499,
  lifetimePrice: 2999,
  limitedTimePrice: 999,
  limitedTimeDays: 30,
  category: "Math",
  approvalStatus: "pending",
  isApproved: false,
  approvedAt: null,
  contentApprovalStatus: "pending",
  hasPendingContent: true,
  trainerId: "uid",
  trainerName: "Name",
  description: "",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
```

### **2. Reading Courses with Mapping**

```javascript
// Fetch from Firestore
const courseData = doc.data();

// Map to legacy field names for backward compatibility
const mappedCourse = {
  ...courseData,
  title: courseData.courseName || courseData.title || '',
  thumbnail: courseData.thumbnailUrl || courseData.thumbnail || '',
  price: courseData.oneTimePrice || courseData.price || 0,
  subject: courseData.category || courseData.subject || '',
  // Keep both old and new fields
  courseName: courseData.courseName || courseData.title || '',
  thumbnailUrl: courseData.thumbnailUrl || courseData.thumbnail || ''
};
```

---

## 🧪 Testing

### **Test 1: Create New Course**

1. Open Trainer Portal
2. Click "Create Course"
3. Fill in:
   - Title: "Test Course"
   - Category: "Science"
   - Price: 1499
4. Click "Submit for Review"
5. Check Firebase Console → `bharatam_courses`
6. Verify document has **only** the new fields listed above

### **Test 2: Verify Backward Compatibility**

1. Create a course using new schema
2. Navigate to "My Courses" tab
3. Verify course displays correctly (title, thumbnail, price shown)
4. Open course details
5. Verify all data displays properly

### **Test 3: Check Field Mapping**

```javascript
// In browser console
console.log(course);

// Should see BOTH:
// courseName: "Test Course"
// title: "Test Course"  ← Mapped automatically
```

---

## 🔄 Migration (Optional)

If you have **existing courses** with old field names, you can migrate them:

### **Migration Script:**

```javascript
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

const migrateCourses = async () => {
  const snapshot = await getDocs(collection(db, 'bharatam_courses'));
  
  for (const courseDoc of snapshot.docs) {
    const data = courseDoc.data();
    
    // Only migrate if using old schema
    if (data.title && !data.courseName) {
      await updateDoc(doc(db, 'bharatam_courses', courseDoc.id), {
        courseName: data.title || '',
        thumbnailUrl: data.thumbnail || '',
        oneTimePrice: Number(data.price || 0),
        lifetimePrice: Number(data.lifetimePrice || data.price || 0),
        limitedTimePrice: Number(data.limitedTimePrice || data.price || 0),
        limitedTimeDays: 30,
        category: data.category || data.subject || '',
        approvalStatus: data.approvalStatus || data.status || 'draft',
        isApproved: data.isApproved || false,
        approvedAt: data.approvedAt || null,
        contentApprovalStatus: 'pending',
        hasPendingContent: true,
        updatedAt: new Date()
      });
      
      console.log(`Migrated course: ${courseDoc.id}`);
    }
  }
  
  console.log('Migration complete!');
};

// Run once
migrateCourses();
```

---

## 📋 Field Validation

### **Required Validation:**

```javascript
// When creating a course
if (!courseName || !category || !trainerId) {
  throw new Error('Missing required fields');
}

if (oneTimePrice < 0 || lifetimePrice < 0 || limitedTimePrice < 0) {
  throw new Error('Prices cannot be negative');
}

if (limitedTimeDays < 1) {
  throw new Error('Limited time days must be at least 1');
}
```

---

## ✅ Files Modified

1. **StaffPortal.jsx**
   - Updated `handleCreateCourse()` to save with new schema
   - Added field mapping when fetching courses
   - Added backward compatibility layer

---

## 🎉 Benefits

✅ **Clean Schema** - Only necessary fields stored
✅ **Consistent Naming** - Clear, descriptive field names
✅ **Better Pricing** - Three pricing tiers (one-time, lifetime, limited)
✅ **Approval Tracking** - Detailed approval status fields
✅ **Backward Compatible** - Old code still works
✅ **No Breaking Changes** - Automatic field mapping

**The bharatam_courses collection now uses a standardized, production-ready schema!** 🚀
