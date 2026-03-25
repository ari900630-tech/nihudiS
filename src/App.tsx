/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Menu, 
  MessageCircle, 
  Users, 
  User,
  Heart, 
  Settings, 
  X,
  Sparkles,
  Camera,
  Moon,
  Sun,
  Share2,
  LogOut,
  AlertTriangle,
  ShieldBan,
  Palette,
  Type,
  Trash2,
  Eye,
  HelpCircle,
  FileText,
  Mail,
  ToggleLeft,
  ToggleRight,
  Star,
  ChevronLeft,
  ChevronRight,
  Send,
  Check,
  CheckCheck
} from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, deleteDoc, collection, getDocs, serverTimestamp, Timestamp, query, where, addDoc, orderBy, updateDoc } from 'firebase/firestore';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

// Constants for profile options
const CITIES = ["ירושלים", "בני ברק", "תל אביב", "חיפה", "אשדוד", "פתח תקווה", "נתניה", "באר שבע", "אלעד", "בית שמש", "מודיעין עילית", "ביתר עילית", "צפת", "רעננה", "גבעת שמואל", "אחר"];
const EDUCATION_OPTIONS = ["ישיבה גבוהה", "מדרשה", "תואר ראשון", "תואר שני", "דוקטורט", "לימודי תעודה", "תיכון", "אחר"];
const OCCUPATION_OPTIONS = ["לומד בישיבה", "חינוך", "הייטק", "רפואה", "אמנות", "עסקים", "סטודנט/ית", "תורני/כולל", "צבא/שירות לאומי", "אחר"];
const HEIGHTS = Array.from({ length: 71 }, (_, i) => (1.40 + i * 0.01).toFixed(2));
const AGES = Array.from({ length: 82 }, (_, i) => 18 + i);

// Mock data for profiles
const MOCK_PROFILES = [
  { 
    id: 1, 
    name: "נועה", 
    age: 24, 
    bio: "אוהבת טיולים וקפה. מחפשת מישהו עם ראש פתוח וערכים.", 
    image: "https://picsum.photos/seed/noa/400/600",
    sector: "דתי לאומי",
    city: "ירושלים",
    height: "1.65",
    religiousLevel: "דתי",
    maritalStatus: "רווקה",
    occupation: "סטודנטית לעיצוב",
    gender: "נקבה"
  },
  { 
    id: 2, 
    name: "יוסי", 
    age: 28, 
    bio: "חובב טכנולוגיה ואוכל טוב. מחפש שותפה לחיים מלאי עניין.", 
    image: "https://picsum.photos/seed/yossi/400/600",
    sector: "חרדי",
    city: "בני ברק",
    height: "1.80",
    religiousLevel: "תורני",
    maritalStatus: "רווק",
    occupation: "מתכנת",
    gender: "זכר"
  },
  { 
    id: 3, 
    name: "מיה", 
    age: 26, 
    bio: "אמנית ומטיילת בעולם. מחפשת מישהו יצירתי וסבלני.", 
    image: "https://picsum.photos/seed/maya/400/600",
    sector: "מסורתי",
    city: "תל אביב",
    height: "1.70",
    religiousLevel: "מסורתי",
    maritalStatus: "רווקה",
    occupation: "מורה לאמנות",
    gender: "נקבה"
  },
  { 
    id: 4, 
    name: "איתי", 
    age: 30, 
    bio: "אוהב ספורט ובישול. מחפש מישהי לרוץ איתה למרחקים ארוכים.", 
    image: "https://picsum.photos/seed/itai/400/600",
    sector: "דתי לאומי",
    city: "רעננה",
    height: "1.85",
    religiousLevel: "דתי לייט",
    maritalStatus: "רווק",
    occupation: "עורך דין",
    gender: "זכר"
  },
  { 
    id: 5, 
    name: "שירה", 
    age: 22, 
    bio: "סטודנטית לפסיכולוגיה, אוהבת מוזיקה וספרים.", 
    image: "https://picsum.photos/seed/shira/400/600",
    sector: "דתי לאומי",
    city: "גבעת שמואל",
    height: "1.60",
    religiousLevel: "דתי",
    maritalStatus: "רווקה",
    occupation: "סטודנטית",
    gender: "נקבה"
  },
  { 
    id: 6, 
    name: "דוד", 
    age: 32, 
    bio: "איש עסקים, אוהב את החיים הטובים ומחפש יציבות.", 
    image: "https://picsum.photos/seed/david/400/600",
    sector: "חרדי",
    city: "אלעד",
    height: "1.75",
    religiousLevel: "תורני",
    maritalStatus: "גרוש",
    occupation: "מנהל שיווק",
    gender: "זכר"
  }
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [previousTab, setPreviousTab] = useState('suggestions');
  const [showRules, setShowRules] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm?: () => void, isDestructive?: boolean}>({isOpen: false, title: '', message: ''});
  
  // Firebase Auth State
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // User Settings State
  const [appColor, setAppColor] = useState('rose');
  const [textSize, setTextSize] = useState('normal');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '', 
    age: '', 
    sector: '', 
    bio: '', 
    lookingFor: '',
    gender: '',
    city: '',
    height: '',
    education: '',
    occupation: '',
    religiousLevel: '',
    maritalStatus: '',
    image: '',
    createdAt: ''
  });

  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [realProfiles, setRealProfiles] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = user?.email === 'ari900630@gmail.com' && user?.emailVerified;
  const [reports, setReports] = useState<any[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const unreadMessagesCount = useMemo(() => {
    if (!user) return 0;
    return allMessages.filter(m => m.recipientUid === user.uid && !m.read).length;
  }, [allMessages, user]);

  const totalUnreadCount = unreadCount + unreadMessagesCount;
  const [myLikes, setMyLikes] = useState<any[]>([]);
  const [likesMe, setLikesMe] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [skippedProfiles, setSkippedProfiles] = useState<string[]>([]);
  const [adminOnline, setAdminOnline] = useState(false);
  const [adminUid, setAdminUid] = useState<string | null>(null);

  // Fetch real profiles for suggestions
  useEffect(() => {
    const fetchRealProfiles = async () => {
      try {
        const q = query(collection(db, 'users'), where('name', '!=', ''));
        const querySnapshot = await getDocs(q);
        const profiles = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((p: any) => p.uid !== user?.uid && p.image); // Don't show self, must have image
        setRealProfiles(profiles);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    };
    if (isAuthReady) {
      fetchRealProfiles();
    }
  }, [user, isAuthReady]);

  // Track Admin Presence
  useEffect(() => {
    if (isAuthReady) {
      const q = query(collection(db, 'users'), where('email', '==', 'ari900630@gmail.com'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const adminData = snapshot.docs[0].data();
          setAdminUid(adminData.uid);
          if (adminData.lastSeen && typeof adminData.lastSeen.toDate === 'function') {
            const lastSeen = adminData.lastSeen.toDate();
            const now = new Date();
            const diff = (now.getTime() - lastSeen.getTime()) / 1000;
            setAdminOnline(diff < 90); // 90 seconds
          } else {
            setAdminOnline(false);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [isAuthReady]);

  // Mark messages as read
  useEffect(() => {
    if (user && activeChatId) {
      const unreadMessages = allMessages.filter(m => 
        m.chatId === activeChatId && 
        m.recipientUid === user.uid && 
        !m.read
      );
      
      unreadMessages.forEach(async (msg) => {
        try {
          await updateDoc(doc(db, 'messages', msg.id), { read: true });
        } catch (error) {
          console.error("Error marking message as read:", error);
        }
      });
    }
  }, [activeChatId, allMessages, user]);

  useEffect(() => {
    if (isAdmin) {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(users);
      });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  // Presence Heartbeat
  useEffect(() => {
    if (user && isAuthReady) {
      const updatePresence = async () => {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            lastSeen: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          // Silent fail for heartbeat
        }
      };
      
      updatePresence();
      const interval = setInterval(updatePresence, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [user, isAuthReady]);

  useEffect(() => {
    if (user && isAuthReady) {
      const welcomeNotification = {
        id: Date.now(),
        title: 'ברוך הבא!',
        message: 'שמחים שחזרת אלינו. המשך בחיפוש הזיווג שלך!',
        time: 'עכשיו',
        icon: <Sparkles className="w-5 h-5 text-amber-500" />
      };
      setNotifications(prev => [welcomeNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  }, [user, isAuthReady]);

  const filteredProfiles = useMemo(() => {
    // Show only real profiles from the database that haven't been liked or skipped
    return realProfiles.filter(p => {
      if (myLikes.some(l => l.to === p.uid)) return false;
      if (skippedProfiles.includes(p.uid)) return false;
      if (!profileData.gender) return true;
      return p.gender !== profileData.gender;
    });
  }, [profileData.gender, realProfiles, myLikes, skippedProfiles]);

  const handleProfileAction = (action: 'pass' | 'superlike' | 'like', profile: any) => {
    if (action === 'pass') setExitDirection('left');
    else if (action === 'like') setExitDirection('right');
    else if (action === 'superlike') setExitDirection('up');

    setTimeout(async () => {
      if (action === 'pass') {
        setSkippedProfiles(prev => [...prev, profile.uid]);
      } else if (action === 'like') {
        await handleLike(profile);
      }
      setExitDirection(null);
    }, 300);
  };



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAuthReady) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.appColor) setAppColor(data.appColor);
          if (data.textSize) setTextSize(data.textSize);
          if (data.notificationsEnabled !== undefined) setNotificationsEnabled(data.notificationsEnabled);
          if (data.showOnlineStatus !== undefined) setShowOnlineStatus(data.showOnlineStatus);
          if (data.isDarkMode !== undefined) setIsDarkMode(data.isDarkMode);
          if (data.agreedToRules) setAgreedToRules(data.agreedToRules);
          setProfileData({
            name: data.name || '',
            age: data.age || '',
            sector: data.sector || '',
            bio: data.bio || '',
            lookingFor: data.lookingFor || '',
            gender: data.gender || '',
            city: data.city || '',
            height: data.height || '',
            education: data.education || '',
            occupation: data.occupation || '',
            religiousLevel: data.religiousLevel || '',
            maritalStatus: data.maritalStatus || '',
            image: data.image || '',
            createdAt: data.createdAt || ''
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  const saveProfile = async () => {
    if (!user) return;
    try {
      const dataToSave: any = {
        ...profileData,
        uid: user.uid,
        age: profileData.age ? Number(profileData.age) : null,
        agreedToRules,
        appColor,
        textSize,
        role: isAdmin ? 'admin' : 'user',
        createdAt: profileData.createdAt || new Date().toISOString()
      };
      
      // Remove null or empty fields to avoid rule validation issues if they are optional
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === null || dataToSave[key] === '') {
          delete dataToSave[key];
        }
      });

      await setDoc(doc(db, 'users', user.uid), dataToSave, { merge: true });
      alert('הפרופיל נשמר בהצלחה!');
      setActiveTab('suggestions');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const saveSettings = async (newColor: string, newSize: string, newNotifications?: boolean, newOnlineStatus?: boolean, newDarkMode?: boolean) => {
    if (newColor) setAppColor(newColor);
    if (newSize) setTextSize(newSize);
    if (newNotifications !== undefined) setNotificationsEnabled(newNotifications);
    if (newOnlineStatus !== undefined) setShowOnlineStatus(newOnlineStatus);
    if (newDarkMode !== undefined) setIsDarkMode(newDarkMode);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          appColor: newColor || appColor,
          textSize: newSize || textSize,
          notificationsEnabled: newNotifications !== undefined ? newNotifications : notificationsEnabled,
          showOnlineStatus: newOnlineStatus !== undefined ? newOnlineStatus : showOnlineStatus,
          isDarkMode: newDarkMode !== undefined ? newDarkMode : isDarkMode
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit for base64 in Firestore
        alert('התמונה גדולה מדי. אנא בחר תמונה קטנה מ-500KB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      const unsubscribe = onSnapshot(collection(db, 'reports'), (snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(reportsData);
      });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (user) {
      // Listen to likes FROM me
      const qFrom = query(collection(db, 'likes'), where('from', '==', user.uid));
      const unsubFrom = onSnapshot(qFrom, (snapshot) => {
        setMyLikes(snapshot.docs.map(doc => doc.data()));
      });

      // Listen to likes TO me
      const qTo = query(collection(db, 'likes'), where('to', '==', user.uid));
      const unsubTo = onSnapshot(qTo, (snapshot) => {
        setLikesMe(snapshot.docs.map(doc => doc.data()));
      });

      // Listen to matches
      const qMatches = query(collection(db, 'matches'), where('users', 'array-contains', user.uid));
      const unsubMatches = onSnapshot(qMatches, (snapshot) => {
        setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        unsubFrom();
        unsubTo();
        unsubMatches();
      };
    }
  }, [user]);

  const handleLike = async (targetUser: any) => {
    if (!user) return;
    try {
      // Check if already liked
      if (myLikes.some(l => l.to === targetUser.uid)) {
        setModalConfig({ isOpen: true, title: 'כבר שלחת לייק', message: `כבר שלחת לייק ל${targetUser.name}` });
        return;
      }

      // Save like
      await addDoc(collection(db, 'likes'), {
        from: user.uid,
        to: targetUser.uid,
        createdAt: serverTimestamp()
      });

      // Check for match
      if (likesMe.some(l => l.from === targetUser.uid)) {
        // It's a match!
        await addDoc(collection(db, 'matches'), {
          users: [user.uid, targetUser.uid],
          createdAt: serverTimestamp()
        });
        setModalConfig({ 
          isOpen: true, 
          title: 'יש לכם התאמה! 🎉', 
          message: `גם ${targetUser.name} אהב/ה אותך! עכשיו תוכלו להתכתב.` 
        });
      } else {
        setModalConfig({ isOpen: true, title: 'התאמה', message: `שלחת לייק ל${targetUser.name}!` });
      }
    } catch (error) {
      console.error("Error liking user:", error);
    }
  };

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllMessages(msgs);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const sendMessage = async (chatId: string, recipientUid: string) => {
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderUid: user.uid,
        recipientUid,
        text: newMessage,
        read: false,
        createdAt: new Date().toISOString()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const deleteUserByAdmin = async (userId: string) => {
    if (userId === user.uid) {
      setModalConfig({ isOpen: true, title: 'שגיאה', message: 'אינך יכול למחוק את עצמך.' });
      return;
    }
    setModalConfig({
      isOpen: true,
      title: 'מחיקת משתמש',
      message: 'האם אתה בטוח שברצונך למחוק משתמש זה? פעולה זו אינה ניתנת לביטול.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', userId));
          setModalConfig({ isOpen: true, title: 'בוצע', message: 'המשתמש נמחק בהצלחה.' });
        } catch (error) {
          console.error("Error deleting user:", error);
        }
      }
    });
  };

  const resolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
    } catch (error) {
      console.error("Error resolving report:", error);
    }
  };

  const submitReport = async () => {
    if (!reportContent.trim()) return;
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: user.uid,
        reporterName: profileData.name || user.displayName || 'אנונימי',
        content: reportContent,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      setReportContent('');
      setIsReporting(false);
      setModalConfig({ isOpen: true, title: 'דיווח נשלח', message: 'הדיווח שלך נשלח למנהל המערכת. תודה על העדכון.' });
    } catch (error) {
      console.error("Error submitting report:", error);
      setModalConfig({ isOpen: true, title: 'שגיאה', message: 'אירעה שגיאה בשליחת הדיווח. נסה שוב מאוחר יותר.' });
    }
  };
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
      setActiveTab('suggestions');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    setModalConfig({
      isOpen: true,
      title: 'מחיקת חשבון',
      message: 'האם אתה בטוח שברצונך למחוק את כל הפרטים והחשבון שלך? פעולה זו אינה הפיכה.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          if (user) {
            await deleteDoc(doc(db, 'users', user.uid));
            await deleteUser(user);
          }
          setIsMenuOpen(false);
          setActiveTab('suggestions');
          setModalConfig({ isOpen: false, title: '', message: '' });
        } catch (error) {
          console.error('Error deleting account:', error);
          setModalConfig({
            isOpen: true,
            title: 'שגיאה',
            message: 'שגיאה במחיקת החשבון. ייתכן שתצטרך להתחבר מחדש כדי לבצע פעולה זו.',
          });
        }
      }
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'שידוכין',
          text: 'בואו להכיר את החצי השני שלכם באפליקציית שידוכין!',
          url: window.location.href,
        });
      } else {
        alert('האפליקציה הועתקה ללוח!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => saveSettings(appColor, textSize, notificationsEnabled, showOnlineStatus, !isDarkMode);

  const deleteChat = async (chatId: string) => {
    setModalConfig({
      isOpen: true,
      title: 'מחיקת שיחה',
      message: 'האם אתה בטוח שברצונך למחוק את כל היסטוריית השיחה? פעולה זו אינה ניתנת לביטול.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          // Delete all messages in the chat
          const chatMessages = allMessages.filter(m => m.chatId === chatId);
          for (const msg of chatMessages) {
            await deleteDoc(doc(db, 'messages', msg.id));
          }
          
          // If it's a match, delete the match
          const match = matches.find(m => m.id === chatId);
          if (match) {
            await deleteDoc(doc(db, 'matches', chatId));
          }
          
          // If it's a report, delete the report
          const report = reports.find(r => r.id === chatId);
          if (report) {
            await deleteDoc(doc(db, 'reports', chatId));
          }
          
          setActiveChatId(null);
          setModalConfig({ isOpen: false, title: '', message: '' });
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `chat/${chatId}`);
        }
      }
    });
  };

  const TABS = [
    { id: 'chat', label: 'צ\'אט', icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'suggestions', label: 'הצעות', icon: <User className="w-5 h-5" /> },
    { id: 'likes', label: 'לייקים', icon: <Heart className="w-5 h-5" /> },
  ];

  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  
  const tabOrder = ['chat', 'suggestions', 'likes', 'notifications', 'about', 'admin', 'settings', 'registration'];

  const handleTabChange = (tabId: string) => {
    if (!user && (tabId === 'likes' || tabId === 'chat' || tabId === 'settings')) {
      handleLogin();
      return;
    }
    
    if (tabId !== activeTab) {
      setPreviousTab(activeTab);
    }
    
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(tabId);
    
    if (currentIndex !== -1 && newIndex !== -1) {
      setSlideDirection(newIndex > currentIndex ? 'left' : 'right');
    } else {
      setSlideDirection('left');
    }
    
    if (tabId === 'notifications') {
      setUnreadCount(0);
    }
    
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  // Dynamic styling based on user settings
  const downloadCode = async () => {
    try {
      const zip = new JSZip();
      
      // Try to fetch main files
      const filesToDownload = [
        { path: 'src/App.tsx', url: '/src/App.tsx' },
        { path: 'src/firebase.ts', url: '/src/firebase.ts' },
        { path: 'src/index.css', url: '/src/index.css' },
        { path: 'package.json', url: '/package.json' },
        { path: 'index.html', url: '/index.html' }
      ];

      for (const file of filesToDownload) {
        try {
          const content = await fetch(file.url).then(r => {
            if (!r.ok) throw new Error(`Failed to fetch ${file.path}`);
            return r.text();
          });
          zip.file(file.path, content);
        } catch (err) {
          console.warn(`Could not include ${file.path} in zip:`, err);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "shiduchin-app-code.zip");
    } catch (error) {
      console.error('Download error:', error);
      alert('שגיאה בהורדת הקוד. ניתן לייצא את הקוד דרך תפריט ההגדרות של AI Studio (Export to ZIP).');
    }
  };

  const colorClasses = {
    rose: 'text-rose-500 bg-rose-500 border-rose-500 shadow-rose-500/30',
    blue: 'text-blue-500 bg-blue-500 border-blue-500 shadow-blue-500/30',
    emerald: 'text-emerald-500 bg-emerald-500 border-emerald-500 shadow-emerald-500/30',
    violet: 'text-violet-500 bg-violet-500 border-violet-500 shadow-violet-500/30',
  };
  
  const textClasses = {
    small: 'text-sm',
    normal: 'text-base',
    large: 'text-lg',
  };

  const activeColor = appColor as keyof typeof colorClasses;
  const activeTextSize = textSize as keyof typeof textClasses;

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1, 
      transition: { duration: 0.2, ease: 'easeOut' } 
    },
    exit: { 
      opacity: 0, 
      transition: { duration: 0.15, ease: 'easeIn' } 
    }
  };

  const cardVariants = {
    initial: { scale: 0.95, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
    exit: (direction: string) => {
      let x = 0;
      let y = 0;
      let rotate = 0;
      if (direction === 'left') { x = -300; rotate = -15; }
      if (direction === 'right') { x = 300; rotate = 15; }
      if (direction === 'up') { y = -300; }
      return {
        x, y, rotate, opacity: 0,
        transition: { duration: 0.3 }
      };
    }
  };

  // Admin Statistics Calculation
  const adminStats = useMemo(() => {
    if (!isAdmin || allUsers.length === 0) return null;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeLast24h = allUsers.filter(u => {
      if (!u.lastSeen) return false;
      const lastSeen = u.lastSeen instanceof Timestamp ? u.lastSeen.toDate() : new Date(u.lastSeen);
      return lastSeen > last24h;
    }).length;

    // Registrations per day (last 7 days)
    const registrationsByDay: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
      registrationsByDay[dateString] = 0;
    }

    allUsers.forEach(u => {
      if (u.createdAt) {
        const createdDate = new Date(u.createdAt);
        if (createdDate > last7d) {
          const dateString = createdDate.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
          if (registrationsByDay[dateString] !== undefined) {
            registrationsByDay[dateString]++;
          }
        }
      }
    });

    const registrationData = Object.entries(registrationsByDay)
      .map(([date, count]) => ({ date, count }))
      .reverse();

    // City breakdown
    const cityCounts: { [key: string]: number } = {};
    allUsers.forEach(u => {
      if (u.city) {
        cityCounts[u.city] = (cityCounts[u.city] || 0) + 1;
      }
    });
    const cityData = Object.entries(cityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Sector (Religious Level) breakdown
    const sectorCounts: { [key: string]: number } = {};
    allUsers.forEach(u => {
      if (u.religiousLevel) {
        sectorCounts[u.religiousLevel] = (sectorCounts[u.religiousLevel] || 0) + 1;
      }
    });
    const sectorData = Object.entries(sectorCounts)
      .map(([name, value]) => ({ name, value }));

    return {
      activeLast24h,
      registrationData,
      cityData,
      sectorData
    };
  }, [isAdmin, allUsers]);

  const COLORS = ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} font-sans overflow-hidden flex flex-col ${textClasses[activeTextSize]}`} dir="rtl">
      
      {/* Top Header */}
      <header className="p-4 flex justify-between items-center z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 border-b border-zinc-100 dark:border-zinc-800">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-tight">שידוכין</h1>

        <button 
          onClick={() => handleTabChange('notifications')}
          className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors relative"
        >
          <Bell className="w-6 h-6" />
          {totalUnreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white rounded-full border-2 border-white dark:border-zinc-950 ${appColor === 'rose' ? 'bg-rose-500' : appColor === 'blue' ? 'bg-blue-500' : appColor === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`}>
              {totalUnreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full overflow-y-auto pb-24"
          >
            {activeTab === 'suggestions' && (
              <div className="p-4 space-y-6 h-full flex flex-col">
                <h2 className="text-2xl font-bold mt-2">הצעות עבורך</h2>
                
                <div className="flex-1 relative pb-20">
                  <AnimatePresence mode="popLayout" custom={exitDirection}>
                    {filteredProfiles.length > 0 ? (
                      <motion.div 
                        key={filteredProfiles[0].id}
                        custom={exitDirection}
                        variants={cardVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex flex-col"
                      >
                        <div className="relative flex-1">
                          <img 
                            src={filteredProfiles[0].image} 
                            alt={filteredProfiles[0].name} 
                            className="absolute inset-0 w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 text-white text-right">
                            <div className="flex items-baseline gap-2 flex-row-reverse justify-end">
                              <span className="text-3xl font-bold">{filteredProfiles[0].name},</span>
                              <span className="text-2xl opacity-90">{filteredProfiles[0].age}</span>
                            </div>
                            <p className="text-sm opacity-90 mt-1">{filteredProfiles[0].bio}</p>
                            
                            <div className="flex flex-wrap gap-2 mt-3 justify-end">
                              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold">
                                {filteredProfiles[0].sector}
                              </span>
                              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold">
                                {filteredProfiles[0].city}
                              </span>
                              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold">
                                {filteredProfiles[0].religiousLevel}
                              </span>
                              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold">
                                {filteredProfiles[0].maritalStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-center items-center gap-10 p-6 bg-white dark:bg-zinc-900">
                          <button 
                            className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full shadow-md flex items-center justify-center text-black dark:text-white hover:scale-110 active:scale-95 transition-transform"
                            onClick={() => handleProfileAction('pass', filteredProfiles[0])}
                          >
                            <X className="w-8 h-8" />
                          </button>
                          <button 
                            className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full shadow-md flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition-transform"
                            onClick={() => handleProfileAction('like', filteredProfiles[0])}
                          >
                            <Heart className={`w-8 h-8 ${myLikes.some(l => l.to === filteredProfiles[0].uid) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center text-center space-y-4 py-20 h-full"
                      >
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                          <User className="w-10 h-10 text-zinc-400" />
                        </div>
                        <h3 className="text-xl font-bold">אין עוד הצעות כרגע</h3>
                        <p className="text-zinc-500">חזור מאוחר יותר כדי לראות פרופילים חדשים.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

        {activeTab === 'likes' && (
          <div className="p-4 space-y-4">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-20 -mx-4 -mt-4 p-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <button 
                onClick={() => handleTabChange(previousTab)}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="text-sm font-bold">חזרה</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold mt-2">לייקים שקיבלת</h2>
            
            <div className="grid grid-cols-2 gap-4 pb-20">
              {likesMe.length > 0 ? (
                likesMe.map((like) => {
                  const otherUser = realProfiles.find(p => p.uid === like.from);
                  if (!otherUser) return null;

                  const isMatched = matches.some(m => m.users.includes(otherUser.uid));

                  return (
                    <div 
                      key={like.from}
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md border border-zinc-100 dark:border-zinc-800"
                    >
                      <img 
                        src={otherUser.image} 
                        className="absolute inset-0 w-full h-full object-cover blur-[2px] hover:blur-0 transition-all duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white text-right">
                        <p className="font-bold text-sm">{otherUser.name}</p>
                        <p className="text-[10px] opacity-80">{otherUser.city}</p>
                        
                        {!isMatched && (
                          <button 
                            onClick={() => handleLike(otherUser)}
                            className={`mt-2 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-lg transition-transform active:scale-95 ${appColor === 'rose' ? 'bg-rose-500' : appColor === 'blue' ? 'bg-blue-500' : appColor === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`}
                          >
                            שלח לייק בחזרה
                          </button>
                        )}
                        {isMatched && (
                          <div className="mt-2 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/80 text-white text-center">
                            יש התאמה!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${appColor === 'rose' ? 'bg-rose-100' : appColor === 'blue' ? 'bg-blue-100' : appColor === 'emerald' ? 'bg-emerald-100' : 'bg-violet-100'}`}>
                    <Heart className={`w-10 h-10 ${appColor === 'rose' ? 'text-rose-500 fill-rose-500' : appColor === 'blue' ? 'text-blue-500 fill-blue-500' : appColor === 'emerald' ? 'text-emerald-500 fill-emerald-500' : 'text-violet-500 fill-violet-500'}`} />
                  </div>
                  <h2 className="text-xl font-bold">הלייקים שלך</h2>
                  <p className="text-zinc-500 max-w-[200px]">אנשים שאהבו אותך יופיעו כאן כשתהיה התאמה.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="p-4 space-y-4">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-20 -mx-4 -mt-4 p-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <button 
                onClick={() => handleTabChange(previousTab)}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="text-sm font-bold">חזרה</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold mt-2">הודעות</h2>
            
            <div className="space-y-3">
              {matches.length > 0 ? (
                matches.map((match) => {
                  const otherUid = match.users.find((uid: string) => uid !== user?.uid);
                  const otherUser = realProfiles.find(p => p.uid === otherUid);
                  if (!otherUser) return null;

                  const lastMessage = allMessages.filter(m => m.chatId === match.id).pop();

                  return (
                    <button 
                      key={match.id}
                      onClick={() => setActiveChatId(match.id)}
                      className="w-full flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-right"
                    >
                      <div className="relative">
                        <img 
                          src={otherUser.image} 
                          className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-sm" 
                          referrerPolicy="no-referrer"
                        />
                        {/* Online status indicator if available */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-sm">{otherUser.name}</h4>
                          {lastMessage && (
                            <span className="text-[10px] text-zinc-400">
                              {new Date(lastMessage.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">
                          {lastMessage ? lastMessage.text : 'התחילו לדבר עכשיו! 👋'}
                        </p>
                      </div>
                      {allMessages.filter(m => m.chatId === match.id && m.senderUid !== user?.uid).length > 0 && (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${appColor === 'rose' ? 'bg-rose-500' : appColor === 'blue' ? 'bg-blue-500' : appColor === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`}>
                          {allMessages.filter(m => m.chatId === match.id && m.senderUid !== user?.uid).length}
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
                  <p>אין הודעות חדשות</p>
                  <p className="text-xs mt-2">הודעות יופיעו כאן לאחר שתהיה התאמה.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-4 space-y-4">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-20 -mx-4 -mt-4 p-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <button 
                onClick={() => handleTabChange(previousTab)}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="text-sm font-bold">חזרה</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold mt-2">התראות</h2>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 text-right animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      {notif.icon || <Bell className="w-5 h-5 text-zinc-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm">{notif.title}</span>
                        <span className="text-[10px] text-zinc-400">{notif.time}</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                <Bell className="w-12 h-12 mb-4 opacity-20" />
                <p>אין התראות חדשות</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="p-6 space-y-8 text-right pb-20">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-20 -mx-6 -mt-6 p-6 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <button 
                onClick={() => handleTabChange(previousTab)}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="text-sm font-bold">חזרה</span>
              </button>
            </div>
            <div className="text-center space-y-4">
              <div className={`w-20 h-20 rounded-3xl rotate-12 flex items-center justify-center mx-auto shadow-lg ${appColor === 'rose' ? 'bg-rose-500 shadow-rose-500/20' : appColor === 'blue' ? 'bg-blue-500 shadow-blue-500/20' : appColor === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-violet-500 shadow-violet-500/20'}`}>
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight">על האתר</h2>
              <p className="text-zinc-500 leading-relaxed">הפלטפורמה המובילה למציאת הזיווג הנכון עבורך, המשלבת טכנולוגיה מתקדמת עם ערכים של פעם.</p>
            </div>

            <div className="space-y-6">
              <h3 className={`text-xl font-bold border-r-4 pr-3 ${appColor === 'rose' ? 'border-rose-500' : appColor === 'blue' ? 'border-blue-500' : appColor === 'emerald' ? 'border-emerald-500' : 'border-violet-500'}`}>החזון שלנו</h3>
              <p className="text-zinc-600 leading-relaxed bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                אנחנו מאמינים שכל אחד ואחת ראויים למצוא את החצי השני שלהם בצורה מכובדת, בטוחה ונעימה. המטרה שלנו היא להחזיר את השמחה והפשטות לתהליך השידוכים, תוך שימוש בכלים טכנולוגיים שחוסכים זמן ומאמץ מיותר.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className={`text-xl font-bold border-r-4 pr-3 ${appColor === 'rose' ? 'border-rose-500' : appColor === 'blue' ? 'border-blue-500' : appColor === 'emerald' ? 'border-emerald-500' : 'border-violet-500'}`}>איך זה עובד?</h3>
              <div className="space-y-4">
                {[
                  { step: "1", title: "הרשמה ופרופיל", desc: "נרשמים וממלאים פרופיל מפורט שמשקף את מי שאתם ומה שאתם מחפשים." },
                  { step: "2", title: "התאמות חכמות", desc: "המערכת שלנו מציעה לכם התאמות רלוונטיות על בסיס העדפות וערכים משותפים." },
                  { step: "3", title: "היכרות", desc: "יוצרים קשר ראשוני בצורה בטוחה ומתחילים את המסע המשותף שלכם." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white ${appColor === 'rose' ? 'bg-rose-500' : appColor === 'blue' ? 'bg-blue-500' : appColor === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`}>
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className={`text-xl font-bold border-r-4 pr-3 ${appColor === 'rose' ? 'border-rose-500' : appColor === 'blue' ? 'border-blue-500' : appColor === 'emerald' ? 'border-emerald-500' : 'border-violet-500'}`}>הצלחות על האתר</h3>
              <div className="grid gap-4">
                {[
                  { title: "מעל 500 חתונות", desc: "בשנה האחרונה זכינו לראות מאות זוגות שהכירו כאן ומקימים בית בישראל." },
                  { title: "אלפי שידוכים", desc: "מערכת ההתאמה החכמה שלנו יצרה אלפי קשרים משמעותיים." },
                ].map((item, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <h4 className={`font-bold mb-1 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`}>{item.title}</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => handleTabChange('registration')}
                className={`w-full py-5 text-white rounded-2xl font-black text-lg shadow-xl ${appColor === 'rose' ? 'bg-rose-500 shadow-rose-500/30' : appColor === 'blue' ? 'bg-blue-500 shadow-blue-500/30' : appColor === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-violet-500 shadow-violet-500/30'}`}
              >
                הרשמה לאתר
              </button>
            </div>
          </div>
        )}

        {activeTab === 'reports' && isAdmin && (
          <div className="p-6 space-y-8 text-right pb-24">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-20 -mx-6 -mt-6 p-6 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <button 
                onClick={() => handleTabChange(previousTab)}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="text-sm font-bold">חזרה</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-6">דיווחים מהמשתמשים</h2>
            
            <div className="space-y-4">
              {reports.length > 0 ? (
                reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((report) => (
                  <div key={report.id} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-right">
                    <div className="flex justify-between items-center mb-2 flex-row-reverse">
                      <span className="font-bold text-sm">{report.reporterName}</span>
                      <span className="text-xs text-zinc-400">{new Date(report.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">{report.content}</p>
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={() => setActiveChatId(report.id)}
                        className={`text-xs font-bold flex items-center gap-2 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        התכתב עם המשתמש
                        {allMessages.filter(m => m.chatId === report.id && m.senderUid !== user.uid).length > 0 && (
                          <span className="w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold mr-1">
                            {allMessages.filter(m => m.chatId === report.id && m.senderUid !== user.uid).length}
                          </span>
                        )}
                      </button>
                      <button 
                        onClick={() => resolveReport(report.id)}
                        className={`text-xs px-3 py-1 rounded-full font-bold ${report.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'} transition-colors`}
                      >
                        {report.status === 'resolved' ? 'טופל' : 'סמן כטופל'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
                  <p className="text-zinc-400">אין דיווחים חדשים כרגע</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="p-6 space-y-8 text-right pb-24">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-20 -mx-6 -mt-6 p-6 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <button 
                onClick={() => handleTabChange(previousTab)}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="text-sm font-bold">חזרה</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-6">ניהול מערכת</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-900/30 shadow-sm">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{allUsers.length}</div>
                <div className="text-xs text-zinc-500">סה"כ משתמשים</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {adminStats?.activeLast24h || 0}
                </div>
                <div className="text-xs text-zinc-500">פעילים (24 ש')</div>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-sm">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {allUsers.filter(u => u.gender === 'זכר').length}
                </div>
                <div className="text-xs text-zinc-500">בנים</div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {allUsers.filter(u => u.gender === 'נקבה').length}
                </div>
                <div className="text-xs text-zinc-500">בנות</div>
              </div>
            </div>

            {/* Registration Chart */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <h4 className="text-sm font-bold mb-4">הרשמות חדשות (7 ימים אחרונים):</h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminStats?.registrationData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: isDarkMode ? '#18181b' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" fill={appColor === 'rose' ? '#F43F5E' : appColor === 'blue' ? '#3B82F6' : appColor === 'emerald' ? '#10B981' : '#8B5CF6'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sector Breakdown */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <h4 className="text-sm font-bold mb-4">התפלגות לפי מגזר:</h4>
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adminStats?.sectorData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(adminStats?.sectorData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: isDarkMode ? '#18181b' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* City Breakdown Chart */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <h4 className="text-sm font-bold mb-4">ערים מובילות:</h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={adminStats?.cityData || []}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
                    <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} width={60} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: isDarkMode ? '#18181b' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <h4 className="text-sm font-bold mb-3">ניהול משתמשים ({allUsers.length}):</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {allUsers.map((u) => (
                  <div key={u.id} className="flex justify-between items-center p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => deleteUserByAdmin(u.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-right">
                        <div className="text-xs font-bold">{u.name || 'ללא שם'}</div>
                        <div className="text-[10px] text-zinc-400">{u.email}</div>
                      </div>
                    </div>
                    {u.image && <img src={u.image} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-zinc-100 dark:bg-zinc-800 rounded-3xl text-center">
              <ShieldBan className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
              <p className="text-xs text-zinc-400">שלום, {user?.email}</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 space-y-8 text-right">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-20 -mx-6 -mt-6 p-6 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <button 
                onClick={() => handleTabChange(previousTab)}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="text-sm font-bold">חזרה</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-6">הגדרות אפליקציה</h2>
            
            <div className="space-y-6">
              {/* Report & Block */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-500">בטיחות ופרטיות</h3>
                
                {isReporting ? (
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
                    <h4 className="font-bold text-sm">דיווח למנהל המערכת</h4>
                    <textarea 
                      value={reportContent}
                      onChange={(e) => setReportContent(e.target.value)}
                      placeholder="פרט כאן את הדיווח או הבקשה שלך..."
                      className="w-full h-32 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={submitReport}
                        className={`flex-1 py-3 rounded-xl font-bold text-white ${appColor === 'rose' ? 'bg-rose-500' : appColor === 'blue' ? 'bg-blue-500' : appColor === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`}
                      >
                        שלח דיווח
                      </button>
                      <button 
                        onClick={() => { setIsReporting(false); setReportContent(''); }}
                        className="flex-1 py-3 rounded-xl font-bold bg-zinc-100 dark:bg-zinc-800"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsReporting(true)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                  >
                    <span className="font-medium">דיווח למנהל</span>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </button>
                )}

                <button 
                  onClick={() => setModalConfig({ isOpen: true, title: 'משתמשים חסומים', message: 'רשימת המשתמשים שחסמתם תופיע כאן. כרגע אין לכם משתמשים חסומים.' })}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                >
                  <span className="font-medium">משתמשים חסומים</span>
                  <ShieldBan className="w-5 h-5 text-rose-500" />
                </button>
              </div>

              {/* Admin Options */}
              {isAdmin && (
                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-lg font-bold text-zinc-500">אפשרויות ניהול</h3>
                  <button 
                    onClick={() => handleTabChange('admin')}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                  >
                    <span className="font-medium">ניהול מערכת</span>
                    <ShieldBan className={`w-5 h-5 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`} />
                  </button>
                  <button 
                    onClick={() => handleTabChange('reports')}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                  >
                    <span className="font-medium">דיווחים מהמשתמשים</span>
                    <AlertTriangle className={`w-5 h-5 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`} />
                  </button>
                </div>
              )}

              {/* My Reports */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-500">הדיווחים שלי</h3>
                <div className="space-y-2">
                  {reports.filter(r => r.reporterUid === user?.uid).length > 0 ? (
                    reports.filter(r => r.reporterUid === user?.uid).map((report) => (
                      <button 
                        key={report.id}
                        onClick={() => setActiveChatId(report.id)}
                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${report.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="font-medium text-sm truncate max-w-[150px]">{report.content}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {allMessages.filter(m => m.chatId === report.id && m.senderUid !== user.uid).length > 0 && (
                            <span className="w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                              {allMessages.filter(m => m.chatId === report.id && m.senderUid !== user.uid).length}
                            </span>
                          )}
                          <MessageCircle className="w-5 h-5 text-zinc-400" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400 text-center py-2">טרם שלחת דיווחים</p>
                  )}
                </div>
              </div>

              {/* Appearance */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-500">תצוגה</h3>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">צבע אפליקציה</span>
                    <Palette className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex gap-3 justify-end">
                    {['rose', 'blue', 'emerald', 'violet'].map((color) => (
                      <button 
                        key={color}
                        onClick={() => saveSettings(color, textSize)}
                        className={`w-10 h-10 rounded-full border-2 ${appColor === color ? 'border-zinc-800 dark:border-white scale-110' : 'border-transparent'} transition-all`}
                        style={{ backgroundColor: color === 'rose' ? '#f43f5e' : color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : '#8b5cf6' }}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">גודל טקסט</span>
                    <Type className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                    {[
                      { id: 'small', label: 'קטן' },
                      { id: 'normal', label: 'רגיל' },
                      { id: 'large', label: 'גדול' }
                    ].map((size) => (
                      <button 
                        key={size.id}
                        onClick={() => saveSettings(appColor, size.id)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${textSize === size.id ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notifications & Privacy */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-500">התראות ופרטיות</h3>
                <button 
                  onClick={() => saveSettings(appColor, textSize, !notificationsEnabled, showOnlineStatus)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {notificationsEnabled ? (
                      <ToggleRight className={`w-6 h-6 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`} />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-zinc-400" />
                    )}
                    <span className="font-medium">התראות פוש</span>
                  </div>
                  <Bell className="w-5 h-5 text-zinc-400" />
                </button>
                <button 
                  onClick={() => saveSettings(appColor, textSize, notificationsEnabled, !showOnlineStatus)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {showOnlineStatus ? (
                      <ToggleRight className={`w-6 h-6 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`} />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-zinc-400" />
                    )}
                    <span className="font-medium">הצג סטטוס מחובר</span>
                  </div>
                  <Eye className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Support */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-500">עזרה ותמיכה</h3>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, title: 'צור קשר', message: 'ניתן ליצור איתנו קשר במייל: support@example.com' })}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                >
                  <span className="font-medium">צור קשר</span>
                  <Mail className="w-5 h-5 text-zinc-400" />
                </button>
                <button 
                  onClick={() => setModalConfig({ 
                    isOpen: true, 
                    title: 'שאלות נפוצות', 
                    message: '1. האם האפליקציה בחינם? כן, השימוש בסיסי הוא בחינם.\n2. איך משנים פרטים? דרך טאב הפרופיל.\n3. האם המידע שלי מאובטח? כן, אנחנו משתמשים בהצפנה מתקדמת.' 
                  })}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                >
                  <span className="font-medium">שאלות נפוצות</span>
                  <HelpCircle className="w-5 h-5 text-zinc-400" />
                </button>
                <button 
                  onClick={() => setShowRules(true)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                >
                  <span className="font-medium">תקנון האתר</span>
                  <FileText className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Danger Zone */}
              <div className="space-y-3 pt-4">
                <h3 className="text-lg font-bold text-red-500">אזור מסוכן</h3>
                <button 
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm text-red-600 dark:text-red-400"
                >
                  <span className="font-bold">מחיקת כל הפרטים והחשבון</span>
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Admin Panel */}
              {isAdmin && (
                <div className="space-y-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-lg font-bold text-violet-500 flex items-center gap-2">
                    <ShieldBan className="w-5 h-5" />
                    ניהול
                  </h3>
                  <button 
                    onClick={() => handleTabChange('admin')}
                    className="w-full flex items-center justify-between p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-900/30 shadow-sm text-violet-600 dark:text-violet-400"
                  >
                    <span className="font-bold">פתח פאנל ניהול</span>
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={downloadCode}
                    className="w-full flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-sm text-amber-600 dark:text-amber-400"
                  >
                    <span className="font-bold">הורדת קוד האפליקציה (ZIP)</span>
                    <FileText className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'registration' && (
          <div className="p-6 space-y-6 text-right">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-20 -mx-6 -mt-6 p-6 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <button 
                onClick={() => handleTabChange(previousTab)}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="text-sm font-bold">חזרה</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              הרשמה
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-700 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border-2 border-white dark:border-zinc-600 shadow-sm">
                  {profileData.image ? (
                    <img src={profileData.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-zinc-400" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className={`font-bold text-sm cursor-pointer ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`}>
                    {profileData.image ? 'שנה תמונה' : 'הוסף תמונה +'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <span className="text-[10px] text-zinc-400">מומלץ תמונה ברורה של הפנים</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="שם מלא" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none focus:border-rose-500 dark:focus:border-rose-500" 
                />
                <select 
                  value={profileData.age}
                  onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none appearance-none focus:border-rose-500 dark:focus:border-rose-500"
                >
                  <option value="">גיל</option>
                  {AGES.map(age => <option key={age} value={age}>{age}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select 
                  value={profileData.gender}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none appearance-none focus:border-rose-500 dark:focus:border-rose-500"
                >
                  <option value="">מין</option>
                  <option value="זכר">זכר</option>
                  <option value="נקבה">נקבה</option>
                </select>
                <select 
                  value={profileData.maritalStatus}
                  onChange={(e) => setProfileData({...profileData, maritalStatus: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none appearance-none focus:border-rose-500 dark:focus:border-rose-500"
                >
                  <option value="">מצב משפחתי</option>
                  <option value="רווק/ה">רווק/ה</option>
                  <option value="גרוש/ה">גרוש/ה</option>
                  <option value="אלמן/ה">אלמן/ה</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select 
                  value={profileData.city}
                  onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none appearance-none focus:border-rose-500 dark:focus:border-rose-500"
                >
                  <option value="">עיר מגורים</option>
                  {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                <select 
                  value={profileData.height}
                  onChange={(e) => setProfileData({...profileData, height: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none appearance-none focus:border-rose-500 dark:focus:border-rose-500"
                >
                  <option value="">גובה</option>
                  {HEIGHTS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select 
                  value={profileData.sector}
                  onChange={(e) => setProfileData({...profileData, sector: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none appearance-none focus:border-rose-500 dark:focus:border-rose-500"
                >
                  <option value="">מגזר</option>
                  <option value="דתי לאומי">דתי לאומי</option>
                  <option value="חרדי">חרדי</option>
                  <option value="מסורתי">מסורתי</option>
                  <option value="חילוני">חילוני</option>
                </select>
                <select 
                  value={profileData.religiousLevel}
                  onChange={(e) => setProfileData({...profileData, religiousLevel: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none appearance-none focus:border-rose-500 dark:focus:border-rose-500"
                >
                  <option value="">רמה דתית</option>
                  <option value="תורני">תורני</option>
                  <option value="דתי">דתי</option>
                  <option value="דתי לייט">דתי לייט</option>
                  <option value="מסורתי">מסורתי</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select 
                  value={profileData.education}
                  onChange={(e) => setProfileData({...profileData, education: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none appearance-none focus:border-rose-500 dark:focus:border-rose-500"
                >
                  <option value="">השכלה</option>
                  {EDUCATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select 
                  value={profileData.occupation}
                  onChange={(e) => setProfileData({...profileData, occupation: e.target.value})}
                  className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none appearance-none focus:border-rose-500 dark:focus:border-rose-500"
                >
                  <option value="">עיסוק</option>
                  {OCCUPATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <textarea 
                placeholder="קצת עליך... (תחביבים, שאיפות, אופי)" 
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none min-h-[100px] resize-none focus:border-rose-500 dark:focus:border-rose-500" 
              />
              <textarea 
                placeholder="מה אתה מחפש בחצי השני שלך?" 
                value={profileData.lookingFor}
                onChange={(e) => setProfileData({...profileData, lookingFor: e.target.value})}
                className="w-full p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none min-h-[100px] resize-none focus:border-rose-500 dark:focus:border-rose-500" 
              />

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={agreedToRules}
                    onChange={(e) => setAgreedToRules(e.target.checked)}
                    className="w-5 h-5 accent-rose-500" 
                  />
                  <span className="text-sm font-medium">אני מאשר שקראתי והסכמתי לכללים</span>
                </label>
                <button 
                  onClick={() => setShowRules(true)}
                  className={`text-sm font-bold underline ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`}
                >
                  כפתור כללים
                </button>
              </div>

              <button 
                onClick={saveProfile}
                className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-colors ${agreedToRules ? (appColor === 'rose' ? 'bg-rose-500 text-white shadow-rose-500/30' : appColor === 'blue' ? 'bg-blue-500 text-white shadow-blue-500/30' : appColor === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-violet-500 text-white shadow-violet-500/30') : 'bg-zinc-300 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-600'}`}
              >
                שמור כרטיס
              </button>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-40">
        <div className="flex items-center justify-around h-full px-4">
          {TABS.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 relative py-2 px-4 rounded-2xl ${activeTab === tab.id ? (appColor === 'rose' ? 'text-rose-500 scale-110' : appColor === 'blue' ? 'text-blue-500 scale-110' : appColor === 'emerald' ? 'text-emerald-500 scale-110' : 'text-violet-500 scale-110') : 'text-zinc-400'}`}
            >
              <div className="relative">
                {tab.icon}
              </div>
              <span className="text-[10px] font-bold whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-[80%] max-w-sm bg-white dark:bg-zinc-900 h-full p-6 flex flex-col shadow-2xl text-right animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="flex justify-between items-center mb-8 flex-row-reverse">
              <div className="flex items-center gap-2 flex-row-reverse">
                <h3 className="text-xl font-bold">תפריט</h3>
                {isAdmin && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white ${appColor === 'rose' ? 'bg-rose-500' : appColor === 'blue' ? 'bg-blue-500' : appColor === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`}>Admin</span>
                )}
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <button 
                onClick={() => handleTabChange('about')}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-right flex-row-reverse"
              >
                <Sparkles className={`w-5 h-5 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`} />
                <span className="font-medium">על האתר</span>
              </button>

              <button 
                onClick={() => handleTabChange('registration')}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-right flex-row-reverse"
              >
                <User className={`w-5 h-5 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`} />
                <span className="font-medium">הרשמה</span>
              </button>

              <button 
                onClick={() => handleTabChange('settings')}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-right flex-row-reverse"
              >
                <Settings className={`w-5 h-5 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`} />
                <span className="font-medium">הגדרות אפליקציה</span>
              </button>

              <button 
                onClick={handleShare}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-right flex-row-reverse"
              >
                <Share2 className={`w-5 h-5 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`} />
                <span className="font-medium">שתף אפליקציה</span>
              </button>

              {isAdmin && (
                <>
                  <button 
                    onClick={() => handleTabChange('admin')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-right flex-row-reverse"
                  >
                    <ShieldBan className={`w-5 h-5 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`} />
                    <span className="font-medium">ניהול מערכת</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('reports')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-right flex-row-reverse"
                  >
                    <AlertTriangle className={`w-5 h-5 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`} />
                    <span className="font-medium">דיווחים מהמשתמשים</span>
                  </button>
                </>
              )}
            </div>

            <div className="mt-auto pt-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 flex-row-reverse">
                <span className="font-bold">מצב לילה</span>
                <button 
                  onClick={toggleTheme}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-rose-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform flex items-center justify-center ${isDarkMode ? '-translate-x-6' : 'translate-x-0'}`}>
                    {isDarkMode ? <Moon className="w-4 h-4 text-rose-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                </button>
              </div>

              {user ? (
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors flex-row-reverse"
                >
                  <LogOut className="w-5 h-5" />
                  <span>יציאה מהמערכת</span>
                </button>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex-row-reverse"
                >
                  <User className="w-5 h-5" />
                  <span>התחברות</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChatId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-sm truncate max-w-[200px]">
                {matches.find(m => m.id === activeChatId) 
                  ? `שיחה עם ${realProfiles.find(p => p.uid === matches.find(m => m.id === activeChatId).users.find((u: string) => u !== user?.uid))?.name || 'משתמש'}`
                  : 'התכתבות בנושא דיווח'}
              </h3>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => deleteChat(activeChatId)} 
                  className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-full transition-colors"
                  title="מחק שיחה"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                {matches.find(m => m.id === activeChatId) && (
                  <button 
                    onClick={() => {
                      setIsReporting(true);
                      setActiveTab('settings');
                      setActiveChatId(null);
                    }} 
                    className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 rounded-full transition-colors"
                    title="דווח על משתמש"
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => setActiveChatId(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {allMessages.filter(m => m.chatId === activeChatId).map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderUid === user.uid ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.senderUid === user.uid ? (appColor === 'rose' ? 'bg-rose-500 text-white' : appColor === 'blue' ? 'bg-blue-500 text-white' : appColor === 'emerald' ? 'bg-emerald-500 text-white' : 'bg-violet-500 text-white') : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                    {msg.text}
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <div className="flex items-center">
                        {msg.senderUid === user?.uid && (
                          <div className="flex items-center gap-1">
                            {msg.read ? (
                              <CheckCheck className="w-4 h-4 text-sky-300" strokeWidth={3} />
                            ) : (
                              <Check className="w-4 h-4 text-white/80" strokeWidth={3} />
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
              <input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const report = reports.find(r => r.id === activeChatId);
                    const match = matches.find(m => m.id === activeChatId);
                    let recipientUid = '';
                    if (report) {
                      recipientUid = isAdmin ? (report?.reporterUid || '') : (adminUid || '');
                    } else if (match) {
                      recipientUid = match.users.find((u: string) => u !== user?.uid) || '';
                    }
                    if (recipientUid) {
                      sendMessage(activeChatId, recipientUid);
                    }
                  }
                }}
                placeholder="הקלד הודעה..."
                className="flex-1 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-sm outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button 
                onClick={() => {
                  const report = reports.find(r => r.id === activeChatId);
                  const match = matches.find(m => m.id === activeChatId);
                  let recipientUid = '';
                  if (report) {
                    recipientUid = isAdmin ? (report?.reporterUid || '') : (adminUid || '');
                  } else if (match) {
                    recipientUid = match.users.find((u: string) => u !== user?.uid) || '';
                  }
                  if (recipientUid) {
                    sendMessage(activeChatId, recipientUid);
                  }
                }}
                className={`p-3 rounded-xl text-white ${appColor === 'rose' ? 'bg-rose-500' : appColor === 'blue' ? 'bg-blue-500' : appColor === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRules(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl z-10 max-h-[80vh] overflow-y-auto text-right">
            <h3 className={`text-2xl font-bold mb-6 ${appColor === 'rose' ? 'text-rose-500' : appColor === 'blue' ? 'text-blue-500' : appColor === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`}>כללי האתר</h3>
            <div className="space-y-4 text-sm leading-relaxed text-zinc-600">
              <p>1. יש לשמור על שפה מכובדת ונקייה בכל התקשרות באתר.</p>
              <p>2. חל איסור מוחלט על התחזות או מסירת פרטים כוזבים.</p>
              <p>3. האתר נועד למטרות נישואין בלבד. אין להשתמש בו למטרות אחרות.</p>
              <p>4. פרטיות המשתמשים היא ערך עליון - אין להפיץ מידע על משתמשים אחרים.</p>
            </div>
            <button 
              onClick={() => setShowRules(false)}
              className={`w-full mt-8 py-4 text-white rounded-2xl font-bold ${appColor === 'rose' ? 'bg-rose-500' : appColor === 'blue' ? 'bg-blue-500' : appColor === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`}
            >
              הבנתי, סגור
            </button>
          </div>
        </div>
      )}

      {/* Generic Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-zinc-100 dark:border-zinc-800 relative z-10">
            <h3 className="text-xl font-bold mb-2">{modalConfig.title}</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              {modalConfig.message}
            </p>
            <div className="flex gap-3">
              {modalConfig.onConfirm ? (
                <>
                  <button 
                    onClick={modalConfig.onConfirm}
                    className={`flex-1 py-3 rounded-xl font-bold text-white ${modalConfig.isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'} transition-colors`}
                  >
                    אישור
                  </button>
                  <button 
                    onClick={() => setModalConfig({ isOpen: false, title: '', message: '' })}
                    className="flex-1 py-3 rounded-xl font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    ביטול
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setModalConfig({ isOpen: false, title: '', message: '' })}
                  className="w-full py-3 rounded-xl font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 transition-colors"
                >
                  סגור
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

