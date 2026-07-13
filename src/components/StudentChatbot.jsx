import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Phone, CheckCircle, HelpCircle, ArrowRight, CornerDownRight, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, getDocs, doc, query, where, limit, updateDoc } from 'firebase/firestore';

const DEFAULT_FAQS = [
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

const QUIZ_QUESTIONS = [
  {
    question: "Q1: Which bank is known as the Banker's Bank in India?",
    options: ["SBI", "RBI", "HDFC", "ICICI"],
    answer: "RBI",
    explanation: "The Reserve Bank of India (RBI) is the central bank of India and regulates all commercial banking operations."
  },
  {
    question: "Q2: In a Compound Interest formula A = P(1 + r/n)^(nt), what does the variable 'P' denote?",
    options: ["Profit", "Percentage", "Principal", "Payment"],
    answer: "Principal",
    explanation: "P stands for Principal, representing the initial sum of money deposited or borrowed before interest."
  },
  {
    question: "Q3: What is the main objective of using Vedic Maths tricks in Quantitative Aptitude?",
    options: ["Increase speed & accuracy", "Write long theoretical essays", "Memorize exam dates", "Study banking laws"],
    answer: "Increase speed & accuracy",
    explanation: "Vedic Math shortcuts help candidates solve complex banking arithmetic operations in seconds, boosting speed and accuracy."
  }
];

export default function StudentChatbot({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [courses, setCourses] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Account Hub Firebase States
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [ads, setAds] = useState([]);

  // Support Tickets Solver States
  const [isTrackingQuery, setIsTrackingQuery] = useState(false);
  const [pendingResolutions, setPendingResolutions] = useState([]);

  // Interactive Quiz States
  const [quizState, setQuizState] = useState({ active: false, currentIdx: 0, score: 0 });

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I am your Bhartam Virtual Assistant. How can I help you today?",
      options: ["📝 1-Minute Challenge", "🔍 Course Recommender", "👤 My Account Hub", "🎫 Track My Queries", "What courses are available?", "What are the course prices?", "Is there a refund policy?", "Talk to a Human"]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [supportForm, setSupportForm] = useState({ name: '', contact: '', question: '' });
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myQueries, setMyQueries] = useState([]);
  
  const chatEndRef = useRef(null);

  // Subscribe to real FAQs from Firestore with real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "bharatam_faqs"), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setFaqs(list);
      } else {
        setFaqs(DEFAULT_FAQS);
      }
    }, (err) => {
      console.warn("Failed to subscribe to FAQs, using defaults:", err);
    });

    return () => unsubscribe();
  }, []);

  // Fetch courses from Firestore for recommender engine
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bharatam_courses"));
        if (!querySnapshot.empty) {
          const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setCourses(list);
        }
      } catch (err) {
        console.warn("Failed to fetch courses for recommender:", err);
      }
    };
    fetchCourses();
  }, []);

  // Fetch general advertisements & trainers from Firestore
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "advertisements"));
        if (!querySnapshot.empty) {
          setAds(querySnapshot.docs.map(d => d.data()));
        }
      } catch (err) {
        console.warn("Failed to fetch ads for chatbot:", err);
      }
    };

    const fetchTrainers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bharatam_users"));
        if (!querySnapshot.empty) {
          const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTrainers(list.filter(u => u.role === 'trainer' || u.role === 'staff'));
        }
      } catch (err) {
        console.warn("Failed to fetch trainers for chatbot:", err);
      }
    };

    fetchAds();
    fetchTrainers();
  }, []);

  // Fetch user personalized orders & enrollments when signed-in user changes
  useEffect(() => {
    if (!user || !user.uid) {
      setUserEnrollments([]);
      setUserOrders([]);
      return;
    }

    const fetchUserEnrollments = async () => {
      try {
        const q = query(collection(db, "enrollments"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setUserEnrollments(querySnapshot.docs.map(d => d.data()));
        } else {
          // Rich mock fallback for testing local simulator
          setUserEnrollments([{ courseTitle: "Vedic Math Basics", enrolledAt: new Date().toISOString() }]);
        }
      } catch (err) {
        console.warn("Failed to fetch user enrollments:", err);
        setUserEnrollments([{ courseTitle: "Vedic Math Basics", enrolledAt: new Date().toISOString() }]);
      }
    };

    const fetchUserOrders = async () => {
      try {
        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setUserOrders(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          // Rich mock fallback for testing local simulator
          setUserOrders([{ orderId: "ORD-99812", courseTitle: "Vedic Math Basics", status: "completed", amount: "499", createdAt: new Date().toISOString() }]);
        }
      } catch (err) {
        console.warn("Failed to fetch user orders:", err);
        setUserOrders([{ orderId: "ORD-99812", courseTitle: "Vedic Math Basics", status: "completed", amount: "499", createdAt: new Date().toISOString() }]);
      }
    };

    fetchUserEnrollments();
    fetchUserOrders();
  }, [user]);

  // Update initial message options when faqs load reactively from Firebase
  useEffect(() => {
    if (faqs.length > 0) {
      setMessages(prev => {
        return prev.map(m => {
          if (m.id === 1) {
            return {
              ...m,
              options: Array.from(new Set([
                "📝 1-Minute Challenge",
                "🔍 Course Recommender",
                "👤 My Account Hub",
                "🎫 Track My Queries",
                ...faqs.map(f => f.question),
                "Talk to a Human"
              ]))
            };
          }
          return m;
        });
      });
    }
  }, [faqs]);

  // Listen to support queries submitted by this user in this session
  useEffect(() => {
    if (myQueries.length === 0) return;
    
    // Listen to updates on submitted queries to alert student on answer
    const unsubscribers = myQueries.map(qId => {
      return onSnapshot(doc(db, "bharatam_support_queries", qId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.answer && data.status === 'answered') {
            // Add bot reply to chat
            setMessages(prev => {
              // Check if we already displayed this answer
              const answerKey = `ans-${qId}`;
              if (prev.some(m => m.id === answerKey)) return prev;
              
              return [
                ...prev,
                {
                  id: answerKey,
                  sender: 'bot',
                  text: `🔔 Answer received from Support:\n\n"${data.answer}"`,
                  isSystemAlert: true
                }
              ];
            });
          }
        }
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [myQueries]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showSupportForm, isTyping]);

  // Helper function to simulate high-end typing indicators
  const replyWithTyping = (text, options = null, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text, options }
      ]);
    }, delay);
  };

  // Helper to fetch support tickets and display them in chat
  const fetchAndDisplayQueries = async (searchField, searchValue) => {
    try {
      setIsTyping(true);
      const q = query(
        collection(db, "bharatam_support_queries"),
        where(searchField, "==", searchValue)
      );
      const querySnapshot = await getDocs(q);
      setIsTyping(false);
      
      if (querySnapshot.empty) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `No support tickets found matching "${searchValue}". You can submit a query by clicking "Talk to a Human".`,
            options: ["Back to Main Menu"]
          }
        ]);
        return;
      }

      const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by newest first
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const resolutions = [];
      const lines = list.map((ticket, idx) => {
        let statusEmoji = ticket.status === 'solved' ? '🎉' : ticket.status === 'answered' ? '✅' : '⏳';
        let detail = `${idx + 1}. ${statusEmoji} **Ticket Ref**: ${ticket.id.slice(0, 8)}\n❓ Details: ${ticket.question}\nStatus: **${ticket.status.toUpperCase()}**`;
        if (ticket.answer) {
          detail += `\n💬 Answer: "${ticket.answer}"`;
        }
        
        if (ticket.status === 'answered') {
          const shortLabel = `👍 Mark Solved #${idx + 1}`;
          resolutions.push({ label: shortLabel, id: ticket.id });
        }
        return detail;
      }).join('\n\n');

      // Update pending resolutions map
      setPendingResolutions(prev => {
        // Filter out old ones that might conflict, or merge them
        const filtered = prev.filter(p => !resolutions.some(r => r.label === p.label));
        return [...filtered, ...resolutions];
      });

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `🎫 **Your Support Tickets**:\n\n${lines}`,
          options: [...resolutions.map(r => r.label), "Back to Main Menu"]
        }
      ]);
    } catch (err) {
      console.error("Failed to query support tickets:", err);
      setIsTyping(false);
      replyWithTyping("I experienced an error looking up your support tickets. Please try again later.", ["Back to Main Menu"]);
    }
  };

  const handleQuickOptionClick = (option) => {
    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text: option };
    setMessages(prev => [...prev, userMsg]);

    // Handle Quiz Active answers
    if (quizState.active) {
      const currentQuestion = QUIZ_QUESTIONS[quizState.currentIdx];
      const isCorrect = (option === currentQuestion.answer);
      const newScore = isCorrect ? quizState.score + 1 : quizState.score;
      const nextIdx = quizState.currentIdx + 1;
      
      let evalText = isCorrect 
        ? "🎉 **Correct!** " 
        : `❌ **Incorrect.** The correct answer was **${currentQuestion.answer}**. `;
      evalText += currentQuestion.explanation;

      if (nextIdx < QUIZ_QUESTIONS.length) {
        setQuizState({
          active: true,
          currentIdx: nextIdx,
          score: newScore
        });
        replyWithTyping(
          `${evalText}\n\nHere is your next question:\n\n${QUIZ_QUESTIONS[nextIdx].question}`,
          QUIZ_QUESTIONS[nextIdx].options
        );
      } else {
        setQuizState({ active: false, currentIdx: 0, score: 0 });
        let endText = `${evalText}\n\n🏆 **Challenge Complete!**\n\nYour Final Score: **${newScore}/3**\n\n`;
        if (newScore === 3) {
          endText += "Outstanding! You are a certified Banking Genius. Here is your promo code for 10% off any course: **BANKER10**!";
        } else {
          endText += "Great try! Practice is the key to banking success. Try again or check out our recommended courses below!";
        }
        replyWithTyping(endText, ["🔍 Course Recommender", "Back to Main Menu"]);
      }
      return;
    }

    if (option === "📝 1-Minute Challenge") {
      setQuizState({
        active: true,
        currentIdx: 0,
        score: 0
      });
      replyWithTyping(
        "📝 **Welcome to the Bhartam 1-Minute Daily Challenge!**\n\nI will ask you 3 quick questions. Answer them all correctly to win a course discount coupon!\n\nHere is your first question:\n\n" + QUIZ_QUESTIONS[0].question,
        QUIZ_QUESTIONS[0].options
      );
      return;
    }

    if (option === "Talk to a Human") {
      setTimeout(() => {
        setShowSupportForm(true);
      }, 300);
      return;
    }

    if (option === "🔍 Course Recommender") {
      // Find unique categories from courses list
      const categories = Array.from(new Set(courses.map(c => c.category || c.subject).filter(Boolean)));
      const optList = categories.length > 0 ? [...categories, "Show All Courses"] : ["Quantitative Aptitude", "Reasoning Ability", "Banking Awareness", "English Language", "Show All Courses"];
      
      replyWithTyping(
        "Sure! I can help you find a perfect course. What subject or category are you interested in studying today?",
        optList
      );
      return;
    }

    if (option === "👤 My Account Hub") {
      const isUserSignedIn = user && user.uid;
      const hubPrompt = isUserSignedIn
        ? `Welcome to your Bhartam Account Hub, ${user.displayName || 'Learner'}! Here you can check your live profile stats from Bhartam Cloud. What would you like to review?`
        : "Welcome to the Bhartam Account Hub! Since you aren't currently signed in, you can look up our instructors and public announcements below:";

      const hubOptions = isUserSignedIn
        ? ["My Enrolled Courses", "My Orders & Payments", "Platform Announcements", "Our Instructors", "Back to Main Menu"]
        : ["Platform Announcements", "Our Instructors", "Back to Main Menu"];

      replyWithTyping(hubPrompt, hubOptions);
      return;
    }

    if (option === "🎫 Track My Queries") {
      if (user && user.uid) {
        // Logged-in user: query by studentId
        fetchAndDisplayQueries("studentId", user.uid);
      } else {
        setIsTrackingQuery(true);
        replyWithTyping(
          "I can help you search and track all your support queries. Please type your 10-digit registered mobile number below:",
          ["Back to Main Menu"]
        );
      }
      return;
    }

    if (option.startsWith("👍 Mark Solved #")) {
      const match = pendingResolutions.find(r => r.label === option);
      if (match) {
        const ticketDocId = match.id;
        setIsTyping(true);
        updateDoc(doc(db, "bharatam_support_queries", ticketDocId), { status: "solved" })
          .then(() => {
            setIsTyping(false);
            replyWithTyping(
              `🎉 Success! Support ticket ref **${ticketDocId.slice(0, 8)}** has been marked as solved and resolved. Thank you!`,
              ["Back to Main Menu"]
            );
          })
          .catch((err) => {
            console.error("Failed to solve ticket:", err);
            setIsTyping(false);
            replyWithTyping("I encountered an error marking the ticket as resolved. Please try again.", ["Back to Main Menu"]);
          });
      } else {
        replyWithTyping("I couldn't locate that specific ticket reference in your active chat session.", ["Back to Main Menu"]);
      }
      return;
    }

    if (option === "My Enrolled Courses") {
      if (!user || !user.uid) {
        replyWithTyping("Please log in to your account first to check your active course enrollments.", ["Back to Main Menu"]);
        return;
      }
      if (userEnrollments.length === 0) {
        replyWithTyping(
          "You are not enrolled in any courses yet. Let's find a course that matches your interests!",
          ["🔍 Course Recommender", "Back to Main Menu"]
        );
      } else {
        const enrollList = "Here are your active course enrollments:\n\n" + 
          userEnrollments.map((e, idx) => `${idx + 1}. 📖 **${e.courseTitle || 'Premium Course'}**\n📅 Enrolled: ${new Date(e.enrolledAt || Date.now()).toLocaleDateString()}`).join('\n\n');
        
        replyWithTyping(enrollList, ["Back to Main Menu", "Talk to a Human"]);
      }
      return;
    }

    if (option === "My Orders & Payments") {
      if (!user || !user.uid) {
        replyWithTyping("Please log in to your account first to view your recent billing details.", ["Back to Main Menu"]);
        return;
      }
      if (userOrders.length === 0) {
        replyWithTyping("We didn't find any recent billing receipts or purchases under your account.", ["Back to Main Menu"]);
      } else {
        const orderList = "Here are your recent payments and invoices:\n\n" + 
          userOrders.map(o => `🧾 **Receipt Ref**: ${o.orderId || o.id || 'N/A'}\n📚 Course: ${o.courseTitle || 'Course Purchase'}\n💰 Amount Paid: ₹${o.amount || '499'}\nStatus: ${o.status === 'completed' ? '✅ Successful' : '⏳ Processing'}`).join('\n\n');
        
        replyWithTyping(orderList, ["Back to Main Menu", "Talk to a Human"]);
      }
      return;
    }

    if (option === "Platform Announcements" || option === "Live Platform Announcements") {
      if (ads.length === 0) {
        replyWithTyping(
          "No new platform announcements have been posted by the administrator today. Stay tuned!",
          ["Back to Main Menu"]
        );
      } else {
        const adsList = "📢 **Live Bhartam Announcements & Offers**:\n\n" + 
          ads.map(ad => `🔥 **${ad.title}**\n${ad.description || 'Check the homepage dashboard for promotional details.'}`).join('\n\n');
        
        replyWithTyping(adsList, ["Back to Main Menu", "Talk to a Human"]);
      }
      return;
    }

    if (option === "Our Instructors") {
      if (trainers.length === 0) {
        replyWithTyping(
          "All our certified trainers are currently offline, but you can explore their courses anytime in our catalogue!",
          ["🔍 Course Recommender", "Back to Main Menu"]
        );
      } else {
        const trainersList = "👨‍🏫 **Meet Our Certified Instructors**:\n\n" + 
          trainers.map((t, idx) => `${idx + 1}. **${t.fullName}**\n📧 Contact: ${t.email || 'Verified Partner'}`).join('\n\n');
        
        replyWithTyping(trainersList, ["Back to Main Menu", "Talk to a Human"]);
      }
      return;
    }

    if (option === "Show All Courses") {
      if (courses.length === 0) {
        replyWithTyping(
          "We are currently updating our course catalog. Please check back shortly!",
          ["Ask Another Question", "Talk to a Human"]
        );
      } else {
        const listText = "Here are all our premium courses:\n\n" + 
          courses.map(c => `📚 **${c.title}** (${c.category || 'General'})\n💰 Price: ${c.price === 'Free' ? 'Free' : '₹' + c.price}\n📝 ${c.description || 'No description available.'}`).join('\n\n');
        
        replyWithTyping(
          listText,
          ["Ask Another Question", "Talk to a Human"]
        );
      }
      return;
    }

    // Check if clicked option matches a course category
    const categories = Array.from(new Set(courses.map(c => c.category || c.subject).filter(Boolean)));
    const isCategorySelection = categories.includes(option) || ["Quantitative Aptitude", "Reasoning Ability", "Banking Awareness", "English Language"].includes(option);
    if (isCategorySelection) {
      const matched = courses.filter(c => 
        (c.category && c.category.toLowerCase() === option.toLowerCase()) || 
        (c.subject && c.subject.toLowerCase() === option.toLowerCase())
      );

      if (matched.length > 0) {
        const listText = `Based on your interest in **${option}**, here are the recommended courses for you:\n\n` + 
          matched.map(c => `📚 **${c.title}**\n💰 Price: ${c.price === 'Free' ? 'Free' : '₹' + c.price}\n📝 ${c.description || 'No description available.'}`).join('\n\n');
        
        replyWithTyping(
          listText,
          ["Ask Another Question", "Talk to a Human"]
        );
      } else {
        replyWithTyping(
          `We don't have courses registered under **${option}** at this moment. Would you like to check out our other subjects?`,
          ["🔍 Course Recommender", "Ask Another Question"]
        );
      }
      return;
    }

    if (option === "Back to Main Menu" || option === "Ask Another Question") {
      replyWithTyping(
        "How else can I assist you today?",
        Array.from(new Set([
          "🔍 Course Recommender",
          "👤 My Account Hub",
          "🎫 Track My Queries",
          ...faqs.map(f => f.question),
          "Talk to a Human"
        ]))
      );
      return;
    }

    // Find matching FAQ from Firestore
    const faq = faqs.find(f => f.question === option);
    if (faq) {
      replyWithTyping(faq.answer, ["Ask Another Question", "Talk to a Human"]);
      if (faq.id) {
        try {
          updateDoc(doc(db, "bharatam_faqs", faq.id), {
            clicks: (faq.clicks || 0) + 1
          }).catch(err => console.warn("Failed to increment FAQ click:", err));
        } catch (err) {
          console.warn("Failed to increment FAQ click:", err);
        }
      }
    } else {
      replyWithTyping(
        "I couldn't find an exact match for your question in my knowledge base. Would you like to submit a query to a support agent?",
        ["Talk to a Human", "Ask Another Question"]
      );
    }
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const queryText = inputText.trim();
    setInputText('');

    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: queryText }]);

    // Check if quiz is active: validate multiple-choice options
    if (quizState.active) {
      const currentQuestion = QUIZ_QUESTIONS[quizState.currentIdx];
      const matchedOption = currentQuestion.options.find(
        opt => opt.toLowerCase() === queryText.toLowerCase()
      );
      if (matchedOption) {
        const isCorrect = (matchedOption === currentQuestion.answer);
        const newScore = isCorrect ? quizState.score + 1 : quizState.score;
        const nextIdx = quizState.currentIdx + 1;
        
        let evalText = isCorrect 
          ? "🎉 **Correct!** " 
          : `❌ **Incorrect.** The correct answer was **${currentQuestion.answer}**. `;
        evalText += currentQuestion.explanation;

        if (nextIdx < QUIZ_QUESTIONS.length) {
          setQuizState({
            active: true,
            currentIdx: nextIdx,
            score: newScore
          });
          replyWithTyping(
            `${evalText}\n\nHere is your next question:\n\n${QUIZ_QUESTIONS[nextIdx].question}`,
            QUIZ_QUESTIONS[nextIdx].options
          );
        } else {
          setQuizState({ active: false, currentIdx: 0, score: 0 });
          let endText = `${evalText}\n\n🏆 **Challenge Complete!**\n\nYour Final Score: **${newScore}/3**\n\n`;
          if (newScore === 3) {
            endText += "Outstanding! You are a certified Banking Genius. Here is your promo code for 10% off any course: **BANKER10**!";
          } else {
            endText += "Great try! Practice is the key to banking success. Try again or check out our recommended courses below!";
          }
          replyWithTyping(endText, ["🔍 Course Recommender", "Back to Main Menu"]);
        }
      } else {
        replyWithTyping(
          `Please answer the quiz question by choosing one of the options below:\n\n${currentQuestion.options.join("  |  ")}`,
          currentQuestion.options
        );
      }
      return;
    }

    // Check if chatbot is waiting for user to enter phone number to track tickets
    if (isTrackingQuery) {
      const cleanedNum = queryText.replace(/\D/g, "");
      if (cleanedNum.length === 10) {
        setIsTrackingQuery(false);
        fetchAndDisplayQueries("studentContact", cleanedNum);
      } else {
        replyWithTyping(
          "That doesn't look like a valid 10-digit phone number. Please enter a valid number (e.g. 9876543210):",
          ["Back to Main Menu"]
        );
      }
      return;
    }

    // Local keyword matching
    const words = queryText.toLowerCase();
    let matchedFaq = null;

    // Find best matching FAQ based on keyword overlap
    let maxOverlap = 0;
    faqs.forEach(faq => {
      const questionWords = faq.question.toLowerCase().split(/\s+/);
      let overlap = 0;
      questionWords.forEach(w => {
        if (w.length > 3 && words.includes(w)) overlap++;
      });

      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        matchedFaq = faq;
      }
    });

    if (matchedFaq && maxOverlap > 0) {
      replyWithTyping(matchedFaq.answer, ["Ask Another Question", "Talk to a Human"]);
      if (matchedFaq.id) {
        try {
          updateDoc(doc(db, "bharatam_faqs", matchedFaq.id), {
            clicks: (matchedFaq.clicks || 0) + 1
          }).catch(err => console.warn("Failed to increment FAQ click:", err));
        } catch (err) {
          console.warn("Failed to increment FAQ click:", err);
        }
      }
    } else {
      // Check if user is asking about courses
      if (words.includes("course") || words.includes("learn") || words.includes("study") || words.includes("class")) {
        replyWithTyping(
          "I can help you look for courses! Click below to use the Course Recommender.",
          ["🔍 Course Recommender", "Ask Another Question", "Talk to a Human"]
        );
      } else if (words.includes("account") || words.includes("enrolled") || words.includes("my profile") || words.includes("order") || words.includes("payment") || words.includes("instructor") || words.includes("announcement")) {
        replyWithTyping(
          "I can help you view your account stats, live orders, active enrollments, announcements, or trainers directly from Bhartam Cloud! Please click on My Account Hub below:",
          ["👤 My Account Hub", "Ask Another Question", "Talk to a Human"]
        );
      } else if (words.includes("ticket") || words.includes("support query") || words.includes("my query") || words.includes("track") || words.includes("solved") || words.includes("resolve")) {
        replyWithTyping(
          "I can help you track and solve all your support queries directly in the chatbot! Click below to begin:",
          ["🎫 Track My Queries", "Ask Another Question", "Talk to a Human"]
        );
      } else {
        replyWithTyping(
          "I couldn't find an exact match for your question in my knowledge base. Would you like to submit a query to a support agent?",
          ["Talk to a Human", "Ask Another Question"]
        );
      }
    }
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportForm.name.trim() || !supportForm.contact.trim() || !supportForm.question.trim()) {
      alert("Please fill in all support details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "bharatam_support_queries"), {
        studentId: user?.uid || null,
        studentName: supportForm.name,
        studentContact: supportForm.contact,
        question: supportForm.question,
        answer: "",
        status: "pending",
        createdAt: new Date().toISOString()
      });

      setMyQueries(prev => [...prev, docRef.id]);
      setShowSupportForm(false);
      
      replyWithTyping(
        `✅ Question submitted! The support team has been notified. We will reply shortly. Your Query Ref ID: ${docRef.id}`,
        ["Ask Another Question"]
      );
      
      setSupportForm({ name: '', contact: '', question: '' });
    } catch (err) {
      console.error("Failed to submit support query:", err);
      alert("Failed to submit question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {/* Chat Widget Window */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="w-[360px] md:w-[400px] h-[520px] bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center relative overflow-hidden group">
                  <motion.div
                    animate={{ 
                      y: [0, -2, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 4, 
                      ease: "easeInOut" 
                    }}
                  >
                    <Bot className="w-5.5 h-5.5 text-white" />
                  </motion.div>
                  {/* Blinking green status light */}
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-orange-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Bhartam Support</h3>
                  <p className="text-[10px] text-orange-100 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Online & Ready
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4.5 py-3 text-sm font-medium leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-orange-500 text-white shadow-md rounded-tr-none'
                      : m.isSystemAlert
                      ? 'bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-tl-none shadow-sm'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-line">{m.text}</p>
                  </div>
                  
                  {/* Quick reply options */}
                  {m.options && m.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 max-w-[90%]">
                      {m.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleQuickOptionClick(opt)}
                          className="bg-white hover:bg-orange-50 border border-orange-100 text-orange-600 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Support Query Escalation Form */}
              {showSupportForm && (
                <motion.form 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSupportSubmit}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3"
                >
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5 text-orange-500" />
                    Submit Support Ticket
                  </h4>

                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={supportForm.name}
                      onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                      className="w-full bg-gray-50 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none text-xs font-medium focus:border-orange-500 focus:bg-white transition-all text-gray-900"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Mobile / Contact"
                      value={supportForm.contact}
                      onChange={(e) => setSupportForm({ ...supportForm, contact: e.target.value })}
                      className="w-full bg-gray-50 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none text-xs font-medium focus:border-orange-500 focus:bg-white transition-all text-gray-900"
                    />
                  </div>

                  <textarea
                    required
                    placeholder="Enter your question details here..."
                    rows={2.5}
                    value={supportForm.question}
                    onChange={(e) => setSupportForm({ ...supportForm, question: e.target.value })}
                    className="w-full bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-xs font-medium focus:border-orange-500 focus:bg-white transition-all text-gray-900 resize-none"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSupportForm(false)}
                      className="flex-1 py-2 rounded-xl text-gray-500 hover:bg-gray-100 text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-75 flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? "Submitting..." : (
                        <>
                          Send Question
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}

              {isTyping && (
                <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] max-w-[70px] ml-1">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form 
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-gray-50 px-4.5 py-3 rounded-2xl text-xs font-medium border border-gray-200 outline-none focus:border-orange-500 focus:bg-white transition-all text-gray-900"
              />
              <button
                type="submit"
                className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full flex items-center justify-center text-white shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer border border-white/20"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Bot className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
              {/* Glowing notification badge */}
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border border-orange-500 text-[8px] font-bold items-center justify-center text-white leading-none">1</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
