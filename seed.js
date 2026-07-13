import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnmVfWqHet_eM5QZvxE4JupJ1vj_-4Hcc",
  authDomain: "bharatam-f3cd7.firebaseapp.com",
  projectId: "bharatam-f3cd7",
  storageBucket: "bharatam-f3cd7.firebasestorage.app",
  messagingSenderId: "194928349759",
  appId: "1:194928349759:web:58f5e3fb4a9e89e153de8a",
  measurementId: "G-ZL4VESHP1Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  console.log("Starting to seed database...");

  try {
    // 1. Seed Users
    const users = [
      { id: "trainer1", role: "trainer", fullName: "John Doe (Trainer)", email: "trainer@test.com", phoneNumber: "1234567890", createdAt: new Date() },
      { id: "trainer2", role: "trainer", fullName: "Jane Smith (Trainer)", email: "trainer2@test.com", phoneNumber: "0987654321", createdAt: new Date() },
      { id: "student1", role: "student", fullName: "Alice Student", email: "student@test.com", phoneNumber: "1111111111", createdAt: new Date() },
      { id: "student2", role: "student", fullName: "Bob Student", email: "student2@test.com", phoneNumber: "2222222222", createdAt: new Date() },
      { id: "admin1", role: "superadmin", fullName: "Super Admin", email: "admin@test.com", phoneNumber: "3333333333", createdAt: new Date() }
    ];

    for (let u of users) {
      await setDoc(doc(db, "bharatam_users", u.id), u);
      console.log(`Added user: ${u.fullName}`);
    }

    // 2. Seed Courses
    const courses = [
      { 
        id: "course1", title: "SBI PO Quantitative Aptitude Masterclass", subject: "Quantitative Aptitude", category: "Quantitative Aptitude", 
        description: "Master shortcuts, percentages, and data interpretation for SBI PO exams.", price: "499", 
        status: "Approved", approvalStatus: "approved", 
        trainerId: "trainer1", trainerName: "John Doe (Trainer)", createdAt: new Date(),
        thumbnail: "https://via.placeholder.com/150"
      },
      { 
        id: "course2", title: "IBPS Clerk Reasoning Ability Special", subject: "Reasoning Ability", category: "Reasoning Ability", 
        description: "Covers puzzle tricks, syllogisms, and coding-decoding structures.", price: "999", 
        status: "Pending Review", approvalStatus: "pending", 
        trainerId: "trainer1", trainerName: "John Doe (Trainer)", createdAt: new Date(),
        thumbnail: "https://via.placeholder.com/150"
      },
      { 
        id: "course3", title: "RBI Grade B Financial Awareness", subject: "Banking Awareness", category: "Banking Awareness", 
        description: "Complete study path for banking and general financial awareness topics.", price: "Free", 
        status: "Approved", approvalStatus: "approved", 
        trainerId: "trainer2", trainerName: "Jane Smith (Trainer)", createdAt: new Date(),
        thumbnail: "https://via.placeholder.com/150"
      }
    ];

    for (let c of courses) {
      await setDoc(doc(db, "bharatam_courses", c.id), c);
      console.log(`Added course: ${c.title}`);

      // Add a dummy video to the subcollection for this course
      const videoRef = doc(collection(db, "bharatam_courses", c.id, "videos"));
      await setDoc(videoRef, {
        approvalStatus: c.status === "Approved" ? "approved" : "pending",
        approvedAt: c.status === "Approved" ? new Date() : null,
        bunnyVideoId: "https://www.w3schools.com/html/mov_bbb.mp4",
        storageUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        contentType: "video",
        createdAt: new Date(),
        updatedAt: new Date(),
        durationMinutes: 0,
        fileName: "Introduction Video",
        title: "Introduction Video",
        thumbnailUrl: "",
        views: 0,
        isFree: false,
        order: 1,
        status: c.status === "Approved" ? "active" : "pending"
      });
      console.log(`Added video for course: ${c.title}`);
    }

    // 3. Seed Categories
    const categories = [
      { name: "Quantitative Aptitude", isActive: true, createdAt: new Date() },
      { name: "Reasoning Ability", isActive: true, createdAt: new Date() },
      { name: "Banking Awareness", isActive: true, createdAt: new Date() },
      { name: "English Language", isActive: true, createdAt: new Date() }
    ];

    for (let cat of categories) {
      await addDoc(collection(db, "bharatam_categories"), cat);
      console.log(`Added category: ${cat.name}`);
    }

    // 4. Seed Advertisements
    const ads = [
      { title: "SBI PO Mock Series 50% Off", imageUrl: "https://via.placeholder.com/400x150", linkUrl: "", status: "active", createdAt: new Date() }
    ];

    for (let ad of ads) {
      await addDoc(collection(db, "advertisements"), ad);
      console.log(`Added ad: ${ad.title}`);
    }

    // 5. Seed FAQs for Student Chatbot
    const faqs = [
      {
        question: "What courses are available?",
        answer: "We offer premium courses for bank exams, including Quantitative Aptitude, Reasoning Ability, English Language, and Banking/Financial Awareness.",
        category: "courses"
      },
      {
        question: "What are the course prices?",
        answer: "Our courses are highly affordable. We support standard single-course payments, banking bundle plans, and free foundation batches. Prices are listed directly in the course catalog.",
        category: "prices"
      },
      {
        question: "Is there a refund policy?",
        answer: "Yes! We offer a 7-day money-back guarantee. If you are not satisfied with the bank preparation materials, you can query support for a full refund.",
        category: "refunds"
      },
      {
        question: "How can I access my courses?",
        answer: "Verify your identity with your registered 10-digit mobile number, input the OTP, and immediately start studying mock tests and video courses from your student dashboard.",
        category: "access"
      }
    ];

    for (let faq of faqs) {
      await addDoc(collection(db, "bharatam_faqs"), faq);
      console.log(`Added FAQ: ${faq.question}`);
    }

    console.log("Database seeded successfully!");
    process.exit(0);

  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
