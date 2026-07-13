export const mockCourses = [
  { 
    id: "course1", title: "Vedic Math Basics", subject: "Maths", category: "Maths", 
    description: "Learn the basics of Vedic Math.", price: "499", 
    status: "Approved", approvalStatus: "approved", 
    trainerId: "trainer1", trainerName: "John Doe", createdAt: new Date().toISOString(),
    thumbnail: "https://via.placeholder.com/150",
    videos: [
      { id: "v1", title: "Intro Video", url: "https://iframe.mediadelivery.net/play/1234/5678", contentType: "video", accessType: "paid", status: "Approved", approvalStatus: "approved", order: 1 }
    ],
    pdfs: []
  },
  { 
    id: "course2", title: "Advanced Science", subject: "Science", category: "Science", 
    description: "Advanced concepts in science.", price: "999", 
    status: "Pending Review", approvalStatus: "pending", 
    trainerId: "trainer1", trainerName: "John Doe", createdAt: new Date().toISOString(),
    thumbnail: "https://via.placeholder.com/150",
    videos: [
      { id: "v2", title: "Science Chapter 1", url: "https://iframe.mediadelivery.net/play/1234/9012", contentType: "video", accessType: "free", status: "Pending", approvalStatus: "pending", order: 1 }
    ],
    pdfs: []
  },
  { 
    id: "course3", title: "History of India", subject: "History", category: "History", 
    description: "Comprehensive history of India.", price: "Free", 
    status: "Approved", approvalStatus: "approved", 
    trainerId: "trainer2", trainerName: "Jane Smith", createdAt: new Date().toISOString(),
    thumbnail: "https://via.placeholder.com/150",
    videos: [],
    pdfs: [
      { id: "p1", title: "History Notes PDF", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", contentType: "pdf", accessType: "paid", status: "Approved", approvalStatus: "approved", order: 1 }
    ]
  }
];

export const mockUsers = [
  { id: "trainer1", role: "trainer", fullName: "John Doe", email: "trainer@test.com", phoneNumber: "1234567890", createdAt: new Date().toISOString(), isBlocked: false },
  { id: "trainer2", role: "trainer", fullName: "Jane Smith", email: "trainer2@test.com", phoneNumber: "0987654321", createdAt: new Date().toISOString(), isBlocked: false },
  { id: "student1", role: "student", fullName: "Alice Student", email: "student@test.com", phoneNumber: "1111111111", createdAt: new Date().toISOString(), isBlocked: false },
  { id: "student2", role: "student", fullName: "Bob Student", email: "student2@test.com", phoneNumber: "2222222222", createdAt: new Date().toISOString(), isBlocked: false }
];

export const mockAds = [
  { id: "ad1", title: "Summer Sale 50% Off", imageUrl: "https://via.placeholder.com/400x150", linkUrl: "", status: "active", createdAt: new Date().toISOString() }
];

export const mockCategories = [
  { id: "cat1", name: "Maths", isActive: true, createdAt: new Date().toISOString() },
  { id: "cat2", name: "Science", isActive: true, createdAt: new Date().toISOString() },
  { id: "cat3", name: "History", isActive: true, createdAt: new Date().toISOString() },
  { id: "cat4", name: "English", isActive: true, createdAt: new Date().toISOString() }
];
