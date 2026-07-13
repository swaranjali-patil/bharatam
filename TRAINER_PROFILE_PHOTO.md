# Trainer Profile Photo Feature

## ✅ Feature Added

**Profile Photo Upload in Trainer Portal** - Trainers can now upload and display their profile photo in the Profile & Payouts section.

---

## 🎨 What Was Added

### Visual Elements

1. **Profile Photo Display** ✅
   - Large circular profile photo (128x128px)
   - Gradient background when no photo uploaded
   - Default trainer emoji (👨‍🏫) as placeholder
   - Smooth rounded corners with shadow

2. **Upload Button** ✅
   - Orange circular button with upload icon
   - Positioned at bottom-right of photo
   - Hover and click animations
   - Opens file picker when clicked

3. **Trainer Information** ✅
   - Trainer name displayed below photo
   - "Certified Trainer" badge with checkmark icon
   - Clean, centered layout

4. **Upload Status Indicators** ✅
   - Loading spinner during upload
   - Success message when photo selected
   - Error handling with user-friendly messages

---

## 🔧 Technical Implementation

### File Modified
**`src/components/StaffPortal.jsx`**

### New State Variables

```javascript
const [profilePhotoFile, setProfilePhotoFile] = useState(null);
const [profilePhotoPreview, setProfilePhotoPreview] = useState(user?.photoUrl || "");
const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
```

### Extended profileData State

```javascript
const [profileData, setProfileData] = useState({
  fullName: user?.fullName || "",
  phone: user?.phoneNumber || "",
  bankAccount: "",
  ifscCode: "",
  photoUrl: user?.photoUrl || user?.photoURL || ""  // ⭐ NEW
});
```

### New Functions

#### 1. `handleProfilePhotoChange()`
```javascript
const handleProfilePhotoChange = (e) => {
  const file = e.target.files?.[0];
  
  // Validation
  - File type: must be image/*
  - File size: max 5MB
  
  // Creates preview using FileReader
  // Updates state with file and preview
};
```

#### 2. Enhanced `handleSave()`
```javascript
const handleSave = async (e) => {
  // If photo selected:
  1. Upload to Bunny.net
  2. Get CDN URL
  3. Update photoUrl in profileData
  
  // Save to Firebase:
  - fullName
  - phoneNumber
  - bankAccount
  - ifscCode
  - photoUrl ⭐ NEW
  - updatedAt
};
```

---

## 🎯 User Flow

### 1. Upload Profile Photo

```
Trainer clicks on Profile & Payouts tab
  ↓
Sees profile photo section at top
  ↓
Clicks orange upload button (bottom-right of photo circle)
  ↓
Selects image from gallery
  ↓
Preview shows immediately
  ↓
"New photo selected" message appears
  ↓
Clicks "Save Changes" button
  ↓
Photo uploads to Bunny.net CDN
  ↓
URL saved to Firebase user document
  ↓
"Profile updated successfully!" message
```

### 2. View Profile Photo

```
When trainer logs in:
  ↓
Photo loads from Firebase user.photoUrl
  ↓
Displays in circular frame
  ↓
Falls back to emoji if no photo
```

---

## 📋 UI Layout

### Profile Section Structure

```
┌─────────────────────────────────────┐
│     [Profile Photo - Circular]      │
│     [Upload Button - Bottom Right]  │
│                                      │
│        Trainer Full Name             │
│     ✓ Certified Trainer              │
│                                      │
│  [Upload Status Messages]            │
├─────────────────────────────────────┤
│  Full Name         Phone Number     │
│  [Input Field]     [Input Field]    │
│                                      │
│  Bank Account      IFSC Code         │
│  [Input Field]     [Input Field]    │
│                                      │
│              [Save Changes Button]   │
└─────────────────────────────────────┘
```

---

## 🎨 Styling Details

### Profile Photo Container
```css
- Size: 128x128px (w-32 h-32)
- Shape: Rounded full (rounded-full)
- Border: 4px white (border-4 border-white)
- Background: Orange gradient (from-orange-100 to-orange-200)
- Shadow: Large shadow (shadow-lg)
```

### Upload Button
```css
- Size: 40x40px (w-10 h-10)
- Background: Orange (bg-orange-500)
- Hover: Darker orange (hover:bg-orange-600)
- Position: Absolute bottom-right
- Icon: Upload icon (white)
- Animation: Scale on hover and click
```

### Trainer Name
```css
- Size: xl (text-xl)
- Weight: Bold (font-bold)
- Color: Dark gray (text-gray-900)
```

### Certified Badge
```css
- Size: Small (text-sm)
- Color: Orange (text-orange-600)
- Icon: CheckCircle (16x16px)
- Weight: Semi-bold (font-semibold)
```

---

## 📊 Data Flow

### Upload Process

```javascript
1. User selects image
   ↓
2. Client-side validation
   - Check file type (image/*)
   - Check file size (< 5MB)
   ↓
3. Create preview (FileReader)
   - Convert to base64 data URL
   - Display immediately
   ↓
4. On Save button click:
   ↓
5. Upload to Bunny.net
   POST /upload
   File: image file
   Folder: bharatm_library/profile_photos
   ↓
6. Receive CDN URL
   https://cdn.bunny.net/.../photo.jpg
   ↓
7. Save to Firebase
   bharatam_users/{userId}
   {
     photoUrl: "https://cdn.bunny.net/..."
     updatedAt: Timestamp
   }
   ↓
8. Update local state
   setProfilePhotoPreview(cdnUrl)
```

---

## 🛡️ Validation & Error Handling

### File Type Validation
```javascript
if (!file.type.startsWith('image/')) {
  alert('Please select an image file');
  return;
}
```

**Accepted formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- SVG (.svg)

### File Size Validation
```javascript
if (file.size > 5 * 1024 * 1024) {
  alert('Image size should be less than 5MB');
  return;
}
```

**Maximum size:** 5MB (5,242,880 bytes)

### Upload Error Handling
```javascript
try {
  const { cdnUrl } = await uploadToBunny(file, 'bharatm_library/profile_photos');
  if (!cdnUrl) throw new Error('CDN URL not returned');
} catch (uploadErr) {
  alert('Upload failed. Make sure backend server is running on port 4000.');
  return; // Stop save process
}
```

---

## 💾 Firebase Storage Structure

### User Document Schema
```javascript
bharatam_users/{userId}
{
  fullName: string,
  phoneNumber: string,
  email: string,
  role: "trainer",
  
  // Profile photo
  photoUrl: string,        // CDN URL
  photoURL: string,        // Alternate field (backwards compatibility)
  
  // Payout info
  bankAccount: string,
  ifscCode: string,
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### CDN Storage Path
```
https://cdn.bunny.net/bharatm_library/profile_photos/{filename}
```

---

## 🧪 Testing

### Test 1: Upload New Photo
**Steps:**
1. Navigate to Profile & Payouts tab
2. Click orange upload button
3. Select image < 5MB
4. Verify preview appears
5. Click "Save Changes"
6. Wait for upload completion
7. Verify success message

**Expected:**
- Photo displays immediately after selection
- "New photo selected" message appears
- Upload completes successfully
- Photo persists after page reload

### Test 2: Invalid File Type
**Steps:**
1. Click upload button
2. Select PDF or other non-image file

**Expected:**
- Alert: "Please select an image file"
- No preview shown
- File not uploaded

### Test 3: Large File
**Steps:**
1. Click upload button
2. Select image > 5MB

**Expected:**
- Alert: "Image size should be less than 5MB"
- No preview shown
- File not uploaded

### Test 4: No Backend Server
**Steps:**
1. Stop backend server (port 4000)
2. Upload image
3. Click "Save Changes"

**Expected:**
- Upload fails with clear error
- Message: "Make sure backend server is running"
- Profile not corrupted

### Test 5: Replace Existing Photo
**Steps:**
1. Upload photo A
2. Save
3. Upload photo B
4. Save

**Expected:**
- Photo B replaces photo A
- Old photo removed from CDN (if cleanup implemented)
- New URL saved to Firebase

---

## 🔄 Backwards Compatibility

### Photo URL Fields
The code checks multiple fields for backwards compatibility:

```javascript
// Initialize from either field
photoUrl: user?.photoUrl || user?.photoURL || ""

// Display from either field
profilePhotoPreview: user?.photoUrl || user?.photoURL || ""
```

**Why two fields?**
- `photoUrl` - New standard field
- `photoURL` - Firebase Auth default field
- Supports both for maximum compatibility

---

## 📱 Responsive Design

### Desktop (md and up)
```
- Profile photo: 128x128px
- Upload button: 40x40px
- Two-column layout for form fields
- Centered profile section
```

### Mobile (below md)
```
- Same photo size (looks good on mobile)
- Single-column layout for form fields
- Centered profile section
- Touch-friendly upload button
```

---

## ✨ Visual Features

### Animations
1. **Upload Button**
   - Hover: Scale to 110%
   - Click: Scale to 95%
   - Smooth transition (0.2s)

2. **Upload Status**
   - Spinner animation during upload
   - Fade-in for success message

3. **Form Entry**
   - Opacity: 0 → 1
   - Y position: 10px → 0
   - Duration: 0.3s

### Icons Used
- 👨‍🏫 - Default placeholder emoji
- Upload - Upload button icon
- CheckCircle - Certified badge icon
- User - Full name field icon
- Phone - Phone number field icon
- Building - Bank account field icon
- CreditCard - IFSC code field icon
- Save - Save button icon

---

## 🎯 Key Features

1. **Instant Preview** ✅
   - Photo displays immediately after selection
   - No need to wait for upload

2. **Visual Feedback** ✅
   - Upload progress indicator
   - Success confirmation
   - Error messages

3. **Certified Badge** ✅
   - Shows "Certified Trainer" with checkmark
   - Professional appearance
   - Builds trust

4. **Clean UI** ✅
   - Centered layout
   - Consistent spacing
   - Modern design

5. **Error Recovery** ✅
   - Validates before upload
   - Clear error messages
   - Doesn't break on failure

---

## 🚀 Future Enhancements

### Potential Improvements
1. **Image Cropping**
   - Add crop tool before upload
   - Ensure circular framing

2. **Compression**
   - Auto-compress large images
   - Optimize file size

3. **Multiple Sizes**
   - Generate thumbnails
   - Optimize for different views

4. **Drag & Drop**
   - Drag image onto photo circle
   - Alternative to file picker

5. **Remove Photo**
   - Button to remove current photo
   - Revert to default emoji

---

## 📝 Code Snippets

### Full Profile Photo Section JSX
```jsx
<div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-100">
  <div className="relative">
    {/* Photo Display */}
    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 border-4 border-white shadow-lg">
      {profilePhotoPreview ? (
        <img src={profilePhotoPreview} alt="Trainer" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-5xl text-orange-500">
          👨‍🏫
        </div>
      )}
    </div>
    
    {/* Upload Button */}
    <label 
      htmlFor="profilePhotoInput"
      className="absolute bottom-0 right-0 w-10 h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110 active:scale-95"
    >
      <Upload className="w-5 h-5 text-white" />
      <input
        id="profilePhotoInput"
        type="file"
        accept="image/*"
        onChange={handleProfilePhotoChange}
        className="hidden"
      />
    </label>
  </div>

  {/* Trainer Info */}
  <div className="text-center">
    <h3 className="text-xl font-bold text-gray-900">
      {profileData.fullName}
    </h3>
    <p className="text-sm text-orange-600 font-semibold mt-1 flex items-center justify-center gap-1">
      <CheckCircle className="w-4 h-4" />
      Certified Trainer
    </p>
  </div>
</div>
```

---

## ✅ Summary

**Feature:** Profile Photo Upload for Trainers

**Location:** Profile & Payouts tab in Trainer Portal

**What's New:**
- ✅ Large circular profile photo display
- ✅ Upload button with icon
- ✅ Instant preview before saving
- ✅ Upload to Bunny.net CDN
- ✅ Save to Firebase user document
- ✅ "Certified Trainer" badge below name
- ✅ File validation (type & size)
- ✅ Error handling and user feedback
- ✅ Mobile responsive design

**Status:** ✅ Complete and ready to use!

---

**Last Updated:** June 5, 2026  
**File Modified:** `src/components/StaffPortal.jsx`  
**Lines Added:** ~150 lines  
**Status:** Production Ready
