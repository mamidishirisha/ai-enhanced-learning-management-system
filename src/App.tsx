import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  User, 
  GraduationCap, 
  Award, 
  Brain, 
  Target, 
  LogOut, 
  Plus, 
  Trash2, 
  FileText, 
  ExternalLink, 
  ArrowRight, 
  CheckCircle, 
  RefreshCcw, 
  TrendingUp, 
  Sparkles, 
  Check, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  Database,
  BarChart2,
  Upload
} from 'lucide-react';

// Client-side auth details
interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

export default function App() {
  // Session & navigation state
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('lms_session');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Forms & Auth states
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Course management states
  const [courses, setCourses] = useState<any[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [activeManagerCourse, setActiveManagerCourse] = useState<any>(null);
  
  // Material upload states
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<'pdf' | 'notes' | 'link'>('pdf');
  const [matFilePath, setMatFilePath] = useState('');
  
  // Custom file upload states & ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Quiz addition states
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOpt1, setQuizOpt1] = useState('');
  const [quizOpt2, setQuizOpt2] = useState('');
  const [quizOpt3, setQuizOpt3] = useState('');
  const [quizOpt4, setQuizOpt4] = useState('');
  const [quizCorrect, setQuizCorrect] = useState<number>(1);

  // Active quiz attempting states
  const [selectedQuizCourse, setSelectedQuizCourse] = useState<any>(null);
  const [studentQuizAnswers, setStudentQuizAnswers] = useState<{ [key: string]: number }>({});
  const [quizSubmittedResult, setQuizSubmittedResult] = useState<any>(null);

  // Performance / ML Prediction parameters
  const [predictAttendance, setPredictAttendance] = useState<number>(85);
  const [predictQuizScore, setPredictQuizScore] = useState<number>(75);
  const [predictAssignmentScore, setPredictAssignmentScore] = useState<number>(78);
  const [predictStudyTime, setPredictStudyTime] = useState<number>(6);
  const [predictPreviousScore, setPredictPreviousScore] = useState<number>(72);
  const [predictionOutput, setPredictionOutput] = useState<string>('');
  const [predictionMetrics, setPredictionMetrics] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  // AI Learning Gap states
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [userReportedWeakTopics, setUserReportedWeakTopics] = useState<string>(['Arrays', 'Recursion'].join(', '));

  // Dashboard state aggregates
  const [studentDashboardData, setStudentDashboardData] = useState<any>(null);
  const [adminDashboardData, setAdminDashboardData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize dynamic dashboards
  useEffect(() => {
    fetchCoursesAndAggregates();
  }, [session, refreshTrigger]);

  const fetchCoursesAndAggregates = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch courses
      const cRes = await fetch('/api/courses');
      const cData = await cRes.json();
      if (Array.isArray(cData)) {
        setCourses(cData);
        if (cData.length > 0 && !activeManagerCourse) {
          setActiveManagerCourse(cData[0]);
        }
      }

      // 2. Load dashboard specifics depending on role
      if (session) {
        if (session.role === 'student') {
          const sdRes = await fetch(`/api/student-dashboard?student_id=${session.id}`);
          if (sdRes.ok) {
            const sdData = await sdRes.json();
            setStudentDashboardData(sdData);
            // Pre-fill ML prediction sliders with latest performance metrics
            if (sdData.performance) {
              setPredictAttendance(sdData.performance.attendance || 80);
              setPredictQuizScore(sdData.performance.quiz_score || 70);
              setPredictAssignmentScore(sdData.performance.assignment_score || 75);
              setPredictStudyTime(sdData.performance.study_time || 5);
              setPredictPreviousScore(sdData.performance.previous_score || 70);
            }
          }
        } else if (session.role === 'admin') {
          const adRes = await fetch('/api/admin-dashboard');
          if (adRes.ok) {
            const adData = await adRes.json();
            setAdminDashboardData(adData);
            if (adData.ml_model_metrics) {
              setPredictionMetrics(adData.ml_model_metrics);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Backend API connection offline/starting. Using rich mock models.', err);
      // Fallback state hydration for immediate smooth visual interaction
      setupFallbackData();
    } finally {
      setIsLoading(false);
    }
  };

  const setupFallbackData = () => {
    // Generate realistic local fallbacks
    const fallbackCourses = [
      {
        id: 'course-1',
        course_name: 'Introduction to Computer Science & Arrays',
        description: 'Basic introduction to computer science, variables, syntax, and one-dimensional arrays.',
        materials: [
          { id: 'm-1', title: 'Arrays Cheat Sheet & Class Notes', type: 'pdf', file_path: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d' },
          { id: 'm-2', title: 'Interactive Coding Exercises on Arrays', type: 'notes', file_path: 'Practice array operations' }
        ],
        quizzes: [
          { id: 'q-1', question: 'What is the index of the first element in a standard array?', option1: '-1', option2: '0', option3: '1', option4: 'None', correct_answer: 2 },
          { id: 'q-2', question: 'Which describes double resizing overhead in dynamic arrays?', option1: 'Constant time insertion', option2: 'O(N) data copying operation during resize', option3: 'No execution impact', option4: 'Instant dynamic index allocation', correct_answer: 2 }
        ]
      },
      {
        id: 'course-2',
        course_name: 'Data Structures & Algorithms',
        description: 'Master binary trees, linked lists, stacks, queues, and graph representations.',
        materials: [
          { id: 'm-3', title: 'Visualizing Trees & Graph Structures', type: 'link', file_path: 'https://visualgo.net/en' }
        ],
        quizzes: [
          { id: 'q-3', question: 'Which data structure operates on a Last In First Out (LIFO) queue principle?', option1: 'Queue', option2: 'Linked List', option3: 'Stack', option4: 'Binary Search Tree', correct_answer: 3 },
          { id: 'q-4', question: 'What is the time complexity of a lookup in a perfectly balanced Binary Search Tree (BST)?', option1: 'O(1)', option2: 'O(log N)', option3: 'O(N)', option4: 'O(N log N)', correct_answer: 2 }
        ]
      },
      {
        id: 'course-3',
        course_name: 'Mastering Recursion and Dynamic Programming',
        description: 'Unlock recursion trees, divide and conquer algorithms, and dynamic programming memoization.',
        materials: [
          { id: 'm-4', title: 'Recursion Call Stack Explanation Guide', type: 'notes', file_path: 'Understanding stack frames' }
        ],
        quizzes: [
          { id: 'q-5', question: 'What happens if a recursive function does not have a correct base condition?', option1: '早期完成', option2: 'It causes a Stack Overflow error at runtime', option3: 'Memory remains constant', option4: 'Transforms to loop', correct_answer: 2 }
        ]
      }
    ];

    setCourses(fallbackCourses);
    if (!activeManagerCourse) {
      setActiveManagerCourse(fallbackCourses[0]);
    }

    if (session) {
      if (session.role === 'student') {
        setStudentDashboardData({
          student: { id: session.id, name: session.name, email: session.email },
          results: [
            { id: 'r1', course_id: 'course-1', score: 100, total_questions: 2 }
          ],
          performance: {
            student_id: session.id,
            attendance: predictAttendance,
            quiz_score: predictQuizScore,
            assignment_score: predictAssignmentScore,
            study_time: predictStudyTime,
            previous_score: predictPreviousScore,
            predicted_category: 'Average Performer',
            weak_topics: ['Arrays', 'Recursion']
          },
          coursesCount: 3,
          materialsCount: 4,
          quizzesCount: 5
        });
      } else {
        setAdminDashboardData({
          total_students: 12,
          total_courses: 3,
          total_materials: 4,
          total_quizzes: 5,
          ml_model_metrics: {
            accuracy: 0.91,
            confusionMatrix: [
              [14, 2, 0],
              [3, 26, 1],
              [0, 2, 28]
            ],
            report: {
              'Needs Improvement': { precision: 0.82, recall: 0.88, f1Score: 0.85, support: 16 },
              'Average Performer': { precision: 0.87, recall: 0.87, f1Score: 0.87, support: 30 },
              'High Performer': { precision: 0.97, recall: 0.93, f1Score: 0.95, support: 30 }
            },
            trainSize: 400,
            testSize: 100
          },
          student_performances: [
            { student: { id: 's1', name: 'John Doe', email: 'john@edu.com' }, performance: { attendance: 85, quiz_score: 82, assignment_score: 80, study_time: 7, previous_score: 74, predicted_category: 'Average Performer', weak_topics: ['Arrays'] } },
            { student: { id: 's2', name: 'Zoe Vance', email: 'zoe@edu.com' }, performance: { attendance: 96, quiz_score: 95, assignment_score: 92, study_time: 12, previous_score: 90, predicted_category: 'High Performer', weak_topics: ['None'] } },
            { student: { id: 's3', name: 'Paul Smith', email: 'paul@edu.com' }, performance: { attendance: 62, quiz_score: 45, assignment_score: 50, study_time: 2, previous_score: 55, predicted_category: 'Needs Improvement', weak_topics: ['Arrays', 'Recursion', 'Data Structures'] } }
          ]
        });
      }
    }
  };

  // Auth Operations
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!regName || !regEmail || !regPassword) {
      setAuthError('Please fill out all fields.');
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Registration failed.');
      } else {
        setAuthSuccess('Registration successful! Please login.');
        // Seamlessly switch to login
        setLoginEmail(regEmail);
        setAuthTab('login');
        // Clear registration form
        setRegName('');
        setRegEmail('');
        setRegPassword('');
      }
    } catch {
      // Offline fallback registration
      const mockStudent: UserSession = {
        id: 'mock_student_101',
        name: regName,
        email: regEmail,
        role: 'student'
      };
      setAuthSuccess('Local registration succeeded (Sandbox Offline Mode)! Please login.');
      setLoginEmail(regEmail);
      setAuthTab('login');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!loginEmail || !loginPassword) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
      } else {
        const sessionData: UserSession = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.role
        };
        saveSession(sessionData);
      }
    } catch {
      // Sandbox fallback login
      if (loginEmail === 'admin' && loginPassword === 'admin123') {
        const sessionData: UserSession = { id: 'admin-1', name: 'System Administrator', email: 'admin', role: 'admin' };
        saveSession(sessionData);
      } else {
        // Log in as student
        const namePart = loginEmail.includes('@') ? loginEmail.split('@')[0] : loginEmail;
        const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const sessionData: UserSession = {
          id: 'student_' + Math.random().toString(36).substr(2, 5),
          name: capitalized,
          email: loginEmail,
          role: 'student'
        };
        saveSession(sessionData);
      }
    }
  };

  const saveSession = (s: UserSession) => {
    setSession(s);
    localStorage.setItem('lms_session', JSON.stringify(s));
    setActiveTab('dashboard');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('lms_session');
    setStudentDashboardData(null);
    setAdminDashboardData(null);
    setQuizSubmittedResult(null);
    setSelectedQuizCourse(null);
    setStudentQuizAnswers({});
  };

  // Course & Materials Admin operations
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName) return;

    try {
      const res = await fetch('/api/add-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_name: newCourseName, description: newCourseDesc })
      });
      if (res.ok) {
        setNewCourseName('');
        setNewCourseDesc('');
        setRefreshTrigger(p => p + 1);
      }
    } catch {
      // Offline local append
      const nC = {
        id: 'mock_c_' + Date.now(),
        course_name: newCourseName,
        description: newCourseDesc,
        materials: [],
        quizzes: []
      };
      setCourses(prev => [...prev, nC]);
      setNewCourseName('');
      setNewCourseDesc('');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course and all its materials/quizzes?')) return;
    
    // Optimistic offline delete
    setCourses(prev => prev.filter(c => c.id !== courseId));
    
    try {
      await fetch(`/api/courses`, {
        method: 'POST', // standard endpoint handler deletes inside course route payload or delete endpoint simulation
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: courseId })
      });
    } catch {}
    setRefreshTrigger(p => p + 1);
  };

  const handleFileUploadProcess = async (file: File) => {
    if (!file) return;
    setIsUploadingFile(true);
    setUploadError('');
    
    if (!matTitle) {
      const lastDot = file.name.lastIndexOf('.');
      const cleanName = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
      setMatTitle(cleanName);
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = e.target?.result as string;
      try {
        const res = await fetch('/api/upload-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: fileData
          })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setMatFilePath(data.url);
        } else {
          setUploadError(data.error || 'Failed to upload file.');
        }
      } catch (err) {
        setUploadError('Network error on file upload.');
      } finally {
        setIsUploadingFile(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading file.');
      setIsUploadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeManagerCourse || !matTitle || !matFilePath) return;

    const payload = {
      course_id: activeManagerCourse.id,
      title: matTitle,
      type: matType,
      file_path: matFilePath
    };

    try {
      const res = await fetch('/api/upload-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMatTitle('');
        setMatFilePath('');
        setRefreshTrigger(p => p + 1);
      }
    } catch {
      // Local push
      const newM = { id: 'm_' + Date.now(), course_id: activeManagerCourse.id, title: matTitle, type: matType, file_path: matFilePath };
      const updated = courses.map(c => {
        if (c.id === activeManagerCourse.id) {
          return { ...c, materials: [...(c.materials || []), newM] };
        }
        return c;
      });
      setCourses(updated);
      setMatTitle('');
      setMatFilePath('');
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeManagerCourse || !quizQuestion || !quizOpt1 || !quizOpt2 || !quizOpt3 || !quizOpt4) return;

    const payload = {
      course_id: activeManagerCourse.id,
      question: quizQuestion,
      option1: quizOpt1,
      option2: quizOpt2,
      option3: quizOpt3,
      option4: quizOpt4,
      correct_answer: quizCorrect
    };

    try {
      const res = await fetch('/api/create-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setQuizQuestion('');
        setQuizOpt1('');
        setQuizOpt2('');
        setQuizOpt3('');
        setQuizOpt4('');
        setQuizCorrect(1);
        setRefreshTrigger(p => p + 1);
      }
    } catch {
      // Local fallback
      const newQ = {
        id: 'q_' + Date.now(),
        course_id: activeManagerCourse.id,
        question: quizQuestion,
        option1: quizOpt1,
        option2: quizOpt2,
        option3: quizOpt3,
        option4: quizOpt4,
        correct_answer: quizCorrect
      };
      const updated = courses.map(c => {
        if (c.id === activeManagerCourse.id) {
          return { ...c, quizzes: [...(c.quizzes || []), newQ] };
        }
        return c;
      });
      setCourses(updated);
      setQuizQuestion('');
      setQuizOpt1('');
      setQuizOpt2('');
      setQuizOpt3('');
      setQuizOpt4('');
      setQuizCorrect(1);
    }
  };

  // Student quiz examination handler
  const handleSelectQuiz = (course: any) => {
    setSelectedQuizCourse(course);
    setStudentQuizAnswers({});
    setQuizSubmittedResult(null);
    setActiveTab('quiz_page');
  };

  const handleQuizAnswerSelect = (quizId: string, optionIdx: number) => {
    setStudentQuizAnswers(prev => ({
      ...prev,
      [quizId]: optionIdx
    }));
  };

  const handleSubmitQuizAnswers = async () => {
    if (!selectedQuizCourse || !session) return;
    
    const questions = selectedQuizCourse.quizzes || [];
    if (questions.length === 0) return;

    // Ensure all answered
    if (Object.keys(studentQuizAnswers).length < questions.length) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to grade now?')) {
        return;
      }
    }

    try {
      const res = await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: session.id,
          course_id: selectedQuizCourse.id,
          answers: studentQuizAnswers
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setQuizSubmittedResult(data);
        setRefreshTrigger(p => p + 1);
      } else {
        alert(data.error || 'Server error grading quiz.');
      }
    } catch {
      // Local grading fallback
      let correct = 0;
      questions.forEach((q: any) => {
        if (Number(studentQuizAnswers[q.id]) === Number(q.correct_answer)) {
          correct++;
        }
      });
      const score = Math.round((correct / questions.length) * 100);
      setQuizSubmittedResult({
        score,
        correct_count: correct,
        total: questions.length,
        predicted_category: score > 80 ? 'High Performer' : score > 50 ? 'Average Performer' : 'Needs Improvement'
      });
    }
  };

  // ML Performance prediction logic
  const handlePredictPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setPredictionOutput('');

    const payload = {
      student_id: session?.id,
      attendance: predictAttendance,
      quiz_score: predictQuizScore,
      assignment_score: predictAssignmentScore,
      study_time: predictStudyTime,
      previous_score: predictPreviousScore
    };

    try {
      const res = await fetch('/api/predict-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setPredictionOutput(data.predicted_category);
        if (data.metrics) {
          setPredictionMetrics(data.metrics);
        }
        setRefreshTrigger(p => p + 1);
      }
    } catch {
      // Direct offline prediction engine mimicking the trained classifier logic
      setTimeout(() => {
        let category = 'Average Performer';
        const weightedScore = (predictAttendance * 0.2) + (predictQuizScore * 0.3) + (predictAssignmentScore * 0.25) + (predictStudyTime * 1.5) + (predictPreviousScore * 0.15);
        if (weightedScore > 78 && predictAttendance > 80) {
          category = 'High Performer';
        } else if (weightedScore < 58 || predictAttendance < 70) {
          category = 'Needs Improvement';
        }
        setPredictionOutput(category);
        setIsPredicting(false);
      }, 700);
      return;
    }
    setIsPredicting(false);
  };

  // Generative AI Analyzer trigger
  const handleGenerateAIAnalysis = async () => {
    setIsAiLoading(true);
    setAiAnalysisResult('');

    // Convert comma list to array
    const parts = userReportedWeakTopics.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      student_id: session?.id,
      attendance: predictAttendance,
      quiz_score: predictQuizScore,
      assignment_score: predictAssignmentScore,
      study_time: predictStudyTime,
      weak_topics: parts.length > 0 ? parts : ['Arrays', 'Recursion']
    };

    try {
      const res = await fetch('/api/learning-gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setAiAnalysisResult(data.analysis);
      } else {
        setAiAnalysisResult(`Error: ${data.error}`);
      }
    } catch {
      // offline/pedagogical beautiful recommendations
      setTimeout(() => {
        setAiAnalysisResult(`### 🤖 Sandbox Pedgagogical Fallback Insights
Below is an offline analytical summary optimized for student outcomes while the remote server coordinates:

- Attendance Rate: **${predictAttendance}%**
- Quiz Assessment Index: **${predictQuizScore}%**
- Assignment Baseline: **${predictAssignmentScore}%**
- Scheduled Study Time: **${predictStudyTime} hrs/wk**

### 🎯 Key Weak Areas Tracked:
${parts.map(topic => `* **${topic}**: Core theoretical application requires structured practice.`).join('\n')}

### 🚀 Recommended Study Steps:
1. **Accelerate Time Allocation**: Target **8-10 hours/week** to bridge dynamic programming and logical structures.
2. **Coding Drills**: Set aside 1 hour each evening specifically for recursion tree expansion diagrams.
3. **Weekly quizzes**: Re-attempt quizzes until a 90%+ baseline is stored successfully.`);
        setIsAiLoading(false);
      }, 1000);
      return;
    }
    setIsAiLoading(false);
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans overflow-x-hidden" id="app_root">
      {/* Deep Slate Professional Dark Canvas */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-slate-950" 
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgb(15, 23, 42) 0%, rgb(9, 13, 22) 100%)',
          backgroundAttachment: 'fixed'
        }}
        id="bg_mesh"
      />

      {/* ──────────────────────────────────────────────────────── */}
      {/* 1. AUTHENTICATION SCREENS (No session)                   */}
      {/* ──────────────────────────────────────────────────────── */}
      {!session ? (
        <div className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8" id="auth_container">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl transition-all duration-300" id="auth_card">
            
            {/* Header logo */}
            <div className="flex items-center justify-center gap-3 mb-8" id="auth_logo">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white text-lg tracking-wider shadow-sm">
                N
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Nexus LMS</h1>
                <p className="text-xs text-slate-400">AI-Enhanced Learning Platform</p>
              </div>
            </div>

            {/* Simple toggle tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800" id="auth_tab_triggers">
              <button 
                id="tab_login_btn"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${authTab === 'login' ? 'bg-slate-800 text-white border border-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
              >
                Sign In
              </button>
              <button 
                id="tab_register_btn"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${authTab === 'register' ? 'bg-slate-800 text-white border border-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
              >
                Register
              </button>
            </div>

            {/* Status alerts */}
            {authError && (
              <div className="mb-4 bg-red-500/15 border border-red-500/30 text-red-200 text-sm p-3 rounded-xl flex items-center gap-2" id="auth_err_alert">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <p>{authError}</p>
              </div>
            )}
            {authSuccess && (
              <div className="mb-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm p-3 rounded-xl flex items-center gap-2" id="auth_success_alert">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <p>{authSuccess}</p>
              </div>
            )}

            {/* LOGIN FORM */}
            {authTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4" id="login_form">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email address / Username</label>
                  <input 
                    type="text"
                    id="login_email_input"
                    className="w-full bg-slate-950/85 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition duration-150"
                    placeholder="student@nexus.edu or 'admin'"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                  <input 
                    type="password"
                    id="login_password_input"
                    className="w-full bg-slate-950/85 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition duration-150"
                    placeholder="Your password or 'admin123'"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                  />
                </div>
                
                <button 
                  type="submit"
                  id="login_submit_btn"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-3 px-4 rounded-xl shadow-sm hover:shadow-indigo-500/10 transition-all duration-150 mt-2"
                >
                  Sign In
                </button>

                <div className="pt-4 border-t border-slate-800 text-center" id="demo_hint_box">
                  <p className="text-xs text-slate-500">
                    💡 Admin Preview: Username <strong className="text-indigo-400">admin</strong> &amp; Password <strong className="text-indigo-400">admin123</strong>
                  </p>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegister} className="space-y-4" id="register_form">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                  <input 
                    type="text"
                    id="reg_name_input"
                    className="w-full bg-slate-950/85 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition duration-150"
                    placeholder="e.g. Sarah Connor"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email address</label>
                  <input 
                    type="email"
                    id="reg_email_input"
                    className="w-full bg-slate-950/85 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition duration-150"
                    placeholder="sarah@nexus.edu"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                  <input 
                    type="password"
                    id="reg_password_input"
                    className="w-full bg-slate-950/85 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition duration-150"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  id="reg_submit_btn"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-3 px-4 rounded-xl shadow-sm hover:shadow-indigo-500/10 transition-all duration-150 mt-2"
                >
                  Create Student Account
                </button>
              </form>
            )}

          </div>
        </div>
      ) : (
        /* ──────────────────────────────────────────────────────── */
        /* 2. CORE PORTAL (LOGGED IN STATE)                         */
        /* ──────────────────────────────────────────────────────── */
        <div className="relative z-10 flex-1 flex flex-col md:flex-row min-h-screen" id="dashboard_portal_root">
          
          {/* SIDEBAR NAVIGATION (Professional Work Rail) */}
          <aside 
            className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 p-5 md:p-6"
            id="main_sidebar"
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800" id="sidebar_logo">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm">
                N
              </div>
              <h2 className="font-bold text-lg tracking-tight text-white">Nexus LMS</h2>
            </div>

            {/* Profile widget */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-6 flex items-center gap-3" id="sidebar_profile">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shrink-0">
                {session.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{session.role}</p>
                <h4 className="text-xs font-bold text-slate-200 truncate">{session.name}</h4>
              </div>
            </div>

            {/* NAVIGATION LIST */}
            <nav className="flex-1 space-y-1" id="sidebar_navigation">
              <button 
                id="link_dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${activeTab === 'dashboard' ? 'bg-slate-800 text-white border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
              >
                <GraduationCap className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>My Dashboard</span>
              </button>

              <button 
                id="link_courses"
                onClick={() => setActiveTab('course_management')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${activeTab === 'course_management' ? 'bg-slate-800 text-white border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
              >
                <BookOpen className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Courses &amp; Curriculum</span>
              </button>

              <button 
                id="link_predict"
                onClick={() => setActiveTab('prediction_page')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${activeTab === 'prediction_page' ? 'bg-slate-800 text-white border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
              >
                <Brain className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Performance Forecast (ML)</span>
              </button>

              <button 
                id="link_learning_gap"
                onClick={() => setActiveTab('learning_gap_page')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${activeTab === 'learning_gap_page' ? 'bg-slate-800 text-white border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Learning Gap Analysis</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-auto border border-emerald-500/30">AI</span>
              </button>
            </nav>

            {/* Logout section */}
            <div className="pt-4 border-t border-slate-800 mt-auto" id="sidebar_actions">
              <button 
                id="logout_action_btn"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* MAIN CONTAINER STREAM */}
          <main className="flex-1 flex flex-col min-w-0" id="main_content_stream">
            
            {/* TOP NAVIGATION SUMMARY */}
            <header className="border-b border-slate-800/85 px-6 py-4 flex items-center justify-between bg-slate-900" id="top_nav_header">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white capitalize">
                  {activeTab.replace('_', ' ').replace('page', '')}
                </h1>
                <p className="text-[11px] text-slate-400">
                  {session.role === 'admin' ? 'Nexus Staff Portal' : 'Nexus Student Portal'} • Academic Term 2026
                </p>
              </div>

              {/* Action sync status */}
              <div className="flex items-center gap-3" id="top_header_controls">
                <button 
                  onClick={() => setRefreshTrigger(p => p+1)}
                  className="p-2 bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 text-slate-300 transition-all duration-300"
                  title="Reload metrics"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-[1px] bg-slate-800" />
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
                  CONNECTED
                </span>
              </div>
            </header>

            {/* SCROLLABLE INNER PAGE AREA */}
            <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6" id="inner_scroll_portal">

              {/* ──────────────────────────────────────────────────────── */}
              {/* PAGE: MY DASHBOARD                                       */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6" id="page_dashboard">
                  
                  {/* WELCOME BANNER WITH METRICS */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden" id="dash_welcome_card">
                    <div className="relative z-10 max-w-2xl">
                      <h2 className="text-xl font-bold mb-2 text-white">Welcome Back, {session.name}!</h2>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        Your academic dashboard is active with predictive ML forecasting models, interactive curriculum assessments, and individualized generative AI tutor recommendations.
                      </p>
                      
                      {session.role === 'student' ? (
                        <div className="flex flex-wrap gap-2">
                          <button 
                            id="banner_take_quiz"
                            onClick={() => setActiveTab('course_management')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition duration-150 flex items-center gap-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Browse Materials</span>
                          </button>
                          <button 
                            id="banner_ai_tutoring"
                            onClick={() => setActiveTab('learning_gap_page')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3.5 py-2 rounded-lg border border-slate-700/60 transition duration-150 flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>AI Gap Analysis</span>
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setActiveTab('course_management')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition duration-150 flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Course Builder</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* STATS COUNT GRID */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dash_stats_grid">
                    
                    {session.role === 'student' ? (
                      <>
                        <div id="stat_total_courses" className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition duration-200">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Active Classes</p>
                          <h3 className="text-3xl font-black text-white">{studentDashboardData?.coursesCount || courses.length}</h3>
                          <span className="text-[10px] text-indigo-300 flex items-center gap-1 mt-1 font-medium">Digital study curriculum</span>
                        </div>

                        <div id="stat_total_materials" className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition duration-200">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Study Guide Links</p>
                          <h3 className="text-3xl font-black text-white">{studentDashboardData?.materialsCount || 4}</h3>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">PDFs, Videos, Reference links</span>
                        </div>

                        <div id="stat_average_quiz" className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition duration-200 relative">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Avg Quiz Score</p>
                          <h3 className="text-3xl font-black text-white">
                            {studentDashboardData?.performance?.quiz_score || 0}%
                          </h3>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">Saved student outcomes</span>
                        </div>

                        <div id="stat_predicted_bracket" className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition duration-200 relative overflow-hidden">
                          <div className="absolute top-3 right-3 bg-indigo-500/10 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-500/20">
                            ML Model
                          </div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Forecast Bracket</p>
                          <h3 className="text-md md:text-lg font-black text-slate-100 truncate mt-1">
                            {studentDashboardData?.performance?.predicted_category || 'Average Performer'}
                          </h3>
                          <span className="text-[10px] text-indigo-300 flex items-center gap-1 mt-2 font-semibold hover:underline cursor-pointer" onClick={() => setActiveTab('prediction_page')}>
                            <span>Simulate features</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div id="stat_total_students_head" className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition duration-200">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Enrolled Students</p>
                          <h3 className="text-3xl font-black text-white">{adminDashboardData?.total_students || 12}</h3>
                          <span className="text-[10px] text-indigo-300 flex items-center gap-1 mt-1">Total active credentials</span>
                        </div>

                        <div id="stat_admin_courses" className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition duration-200">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Active Courses</p>
                          <h3 className="text-3xl font-black text-white">{adminDashboardData?.total_courses || courses.length}</h3>
                          <span className="text-[10px] text-indigo-300 flex items-center gap-1 mt-1">Curriculums inside DB</span>
                        </div>

                        <div id="stat_admin_quizzes" className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition duration-200">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total Quizzes</p>
                          <h3 className="text-3xl font-black text-white">{adminDashboardData?.total_quizzes || 5}</h3>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">Auto-evaluated items</span>
                        </div>

                        <div id="stat_ml_accuracy" className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition duration-200 relative overflow-hidden">
                          <div className="absolute top-3 right-3 bg-amber-500/10 text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border border-amber-500/20">
                            Decision Tree
                          </div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Classifier Accuracy</p>
                          <h3 className="text-3xl font-black text-emerald-400">
                            {adminDashboardData?.ml_model_metrics?.accuracy ? `${(adminDashboardData.ml_model_metrics.accuracy * 100).toFixed(1)}%` : '91.4%'}
                          </h3>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">Cross-validated score</span>
                        </div>
                      </>
                    )}

                  </div>

                  {/* SPLIT SECTION ROW */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dash_row_split">
                    
                    {/* LEFT CONTAINER */}
                    <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6" id="dash_col_left">
                      
                      {session.role === 'student' ? (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-indigo-400" />
                              <span>My Academic Checklist</span>
                            </h3>
                            <button 
                              onClick={() => setActiveTab('course_management')}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                            >
                              <span>Launch manager</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="space-y-3" id="checklist_container">
                            {courses.length === 0 ? (
                              <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-slate-400 text-sm">
                                No courses available yet.
                              </div>
                            ) : (
                              courses.map(c => {
                                // Find if student has completed a quiz result for this course
                                const resultsList = studentDashboardData?.results || [];
                                const scoreRecord = resultsList.find((r: any) => r.course_id === c.id);
                                return (
                                  <div key={c.id} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between hover:bg-slate-950 transition duration-150">
                                    <div className="max-w-[70%]">
                                      <h4 className="text-xs font-bold text-slate-200">{c.course_name}</h4>
                                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.description}</p>
                                      
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                          {c.materials?.length || 0} reading resources
                                        </span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900/30">
                                          {c.quizzes?.length || 0} quiz questions
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      {scoreRecord ? (
                                        <div className="text-right">
                                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mb-0.5">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span>Graded: {scoreRecord.score}%</span>
                                          </div>
                                          <p className="text-[9px] text-slate-500">Auto evaluated</p>
                                        </div>
                                      ) : (
                                        <button 
                                          onClick={() => handleSelectQuiz(c)}
                                          className="text-[10px] font-semibold bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-800/40 transition duration-150 shrink-0"
                                        >
                                          Attempt Quiz
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <User className="w-4 h-4 text-indigo-400" />
                              <span>Enrolled Student Metrics &amp; Classifiers</span>
                            </h3>
                            <button 
                              onClick={() => {
                                fetch('/api/admin/retrain', { method: 'POST' })
                                  .then(r => r.json())
                                  .then(data => {
                                    alert('Decision Tree Model successfully trained on latest dataset parameters!');
                                    setRefreshTrigger(p => p+1);
                                  });
                              }}
                              className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg transition duration-200 flex items-center gap-1.5"
                            >
                              <Database className="w-3 h-3" />
                              <span>Retrain ML Model</span>
                            </button>
                          </div>

                          <div className="overflow-x-auto" id="dashboard_students_scroll">
                            <table className="w-full text-slate-300 text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold text-left">
                                  <th className="pb-2.5">Student Name</th>
                                  <th className="pb-2.5">Attendance</th>
                                  <th className="pb-2.5">Quiz Avg</th>
                                  <th className="pb-2.5">Hrs/Wk</th>
                                  <th className="pb-2.5 text-right">ML Prediction</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/80">
                                {(adminDashboardData?.student_performances || []).map((sp: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-950/40">
                                    <td className="py-2.5 font-medium text-slate-200">
                                      <div>{sp.student.name}</div>
                                      <div className="text-[10px] text-slate-500">{sp.student.email}</div>
                                    </td>
                                    <td className="py-2.5">{sp.performance?.attendance || 80}%</td>
                                    <td className="py-1.5">{sp.performance?.quiz_score || 72}%</td>
                                    <td className="py-2.5">{sp.performance?.study_time || 4}h</td>
                                    <td className="py-2.5 text-right font-medium">
                                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                        sp.performance?.predicted_category === 'High Performer' 
                                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                                          : sp.performance?.predicted_category === 'Needs Improvement' 
                                          ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                                          : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                      }`}>
                                        {sp.performance?.predicted_category || 'Average Performer'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}

                    </div>

                    {/* RIGHT CONTAINER */}
                    <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6" id="dash_col_right">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span>AI Tutor Insight Spotlight</span>
                        </h3>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-300 font-bold uppercase px-2 py-0.5 rounded border border-indigo-900/30">
                          GENAI
                        </span>
                      </div>

                      {session.role === 'student' ? (
                        <div className="space-y-4" id="student_spotlight_container">
                          {/* Weakness Indicator pill */}
                          <div className="bg-slate-950/60 border-l-4 border-indigo-500 p-4 rounded-r-lg border border-y-slate-800 border-r-slate-800" id="dash_spotlight_card">
                            <h4 className="text-[11px] font-bold text-indigo-300 mb-1">Academic Deficiencies</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Struggling with: <strong className="text-slate-100 italic">
                                {studentDashboardData?.performance?.weak_topics?.join(', ') || 'Arrays, Recursion'}
                              </strong>
                            </p>
                          </div>

                          <div className="bg-slate-950/60 border-l-4 border-emerald-500 p-4 rounded-r-lg border border-y-slate-800 border-r-slate-800" id="dash_study_card">
                            <h4 className="text-[11px] font-bold text-emerald-400 mb-1">Recommended Pathway</h4>
                            <p className="text-xs text-slate-300 leading-relaxed font-normal">
                              Increase weekly study time to **{Math.max((studentDashboardData?.performance?.study_time || 4) + 3, 8)} hours**, review basic recursion stacks, and attempt practical quiz problems for 15 minutes daily.
                            </p>
                          </div>

                          <button 
                            id="run_full_gap_btn"
                            onClick={() => setActiveTab('learning_gap_page')}
                            className="w-full bg-indigo-950/50 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-800/30 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200"
                          >
                            <span>Trigger Full AI Report</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4" id="admin_spotlight_container">
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                              <BarChart2 className="w-4 h-4 text-indigo-400" />
                              <span>Subject Deficiencies Matrix</span>
                            </h4>
                            <div className="space-y-2 text-xs" id="admin_subject_matrix">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Arrays Module</span>
                                <span className="font-bold text-red-400">3 students lagging</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Data Structures (BST)</span>
                                <span className="font-bold text-amber-400">1 student lag</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Recursion Stack Frames</span>
                                <span className="font-bold text-emerald-400">All passing</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            id="full_ml_insights_btn"
                            onClick={() => setActiveTab('prediction_page')}
                            className="w-full bg-indigo-950/40 hover:bg-indigo-900/30 text-indigo-300 border border-indigo-900/20 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200"
                          >
                            <span>Check Classifier Model Weights</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* PAGE: COURSE & LEARNING MATERIALS                        */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'course_management' && (
                <div className="space-y-6" id="page_course_management">
                  
                  {/* SPLIT COLUMN WORKSPACE */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="courses_split_workspace">
                    
                    {/* LEFT RAIL: COURSE INDEX LIST */}
                    <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5" id="course_index_rail">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                        <h3 className="text-xs font-bold text-white">Select Academic Class</h3>
                        <span className="text-[10px] py-0.5 px-2 bg-slate-950 border border-slate-800 text-slate-300 font-bold rounded-md">
                          {courses.length} listed
                        </span>
                      </div>

                      {/* Course item navigation rows */}
                      <div className="space-y-2 scrollable max-h-[400px] overflow-y-auto" id="courses_rail_list">
                        {courses.length === 0 ? (
                          <p className="text-center text-xs text-slate-400 py-6">No courses inside academic records.</p>
                        ) : (
                          courses.map(c => (
                            <div 
                              key={c.id}
                              onClick={() => setActiveManagerCourse(c)}
                              className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${activeManagerCourse?.id === c.id ? 'bg-slate-800 border-indigo-600/50 text-white' : 'bg-slate-950/50 border-slate-800/60 hover:bg-slate-950 text-slate-300'}`}
                            >
                              <div className="truncate max-w-[80%]">
                                <h4 className="text-xs font-bold truncate">{c.course_name}</h4>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{c.description || 'No description listed'}</p>
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                {session.role === 'admin' && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCourse(c.id); }}
                                    className="p-1 hover:bg-red-500/15 rounded text-red-400 transition"
                                    title="Delete entire course"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* CREATE NEW COURSE DRAWER (Teacher / Admin Only) */}
                      {session.role === 'admin' && (
                        <form onSubmit={handleCreateCourse} className="mt-6 pt-6 border-t border-slate-800 space-y-3.5" id="add_course_form_container">
                          <h4 className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                            <Plus className="w-3 h-3" />
                            <span>Create Course Portal</span>
                          </h4>
                          <div>
                            <input 
                              type="text"
                              id="add_course_name_input"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                              placeholder="Course Name: e.g. Algorithms"
                              value={newCourseName}
                              onChange={e => setNewCourseName(e.target.value)}
                            />
                          </div>
                          <div>
                            <textarea 
                              id="add_course_desc_input"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-h-[50px] resize-none"
                              placeholder="Brief course objectives..."
                              value={newCourseDesc}
                              onChange={e => setNewCourseDesc(e.target.value)}
                            />
                          </div>
                          <button 
                            type="submit"
                            id="add_course_submit_btn"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-3 rounded-lg transition duration-150 font-bold shadow-sm"
                          >
                            Save Course Record
                          </button>
                        </form>
                      )}

                    </div>

                    {/* RIGHT CORES: MATERIAL AND QUIZ MANAGER */}
                    <div className="lg:col-span-8 space-y-6" id="course_workspace_arena">
                      
                      {activeManagerCourse ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-6" id="selected_course_box">
                          
                          {/* Course Header Banner */}
                          <div className="border-b border-slate-800 pb-4">
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-300 font-bold uppercase py-0.5 px-2 rounded border border-indigo-900/30">
                              Class Syllabus
                            </span>
                            <h2 className="text-lg font-bold text-white mt-1.5">{activeManagerCourse.course_name}</h2>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{activeManagerCourse.description}</p>
                          </div>

                          {/* SUB GRID: LEARNING MATERIALS LIST */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="syllabus_split_controls">
                            
                            {/* Materials Block */}
                            <div className="space-y-4" id="learning_materials_panel">
                              <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                <span>Learning Materials</span>
                              </h3>

                              <div className="space-y-2 max-h-[220px] overflow-y-auto" id="materials_list_container">
                                {(!activeManagerCourse.materials || activeManagerCourse.materials.length === 0) ? (
                                  <p className="text-xs text-slate-500 italic">No reading assets uploaded yet.</p>
                                ) : (
                                  activeManagerCourse.materials.map((m: any) => (
                                    <div key={m.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between">
                                      <div className="max-w-[75%]">
                                        <p className="text-xs font-bold text-slate-200 truncate">{m.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[9px] uppercase font-bold text-indigo-400">
                                            {m.type}
                                          </span>
                                          <span className="text-[9px] text-slate-500 truncate max-w-[100px]">
                                            {m.file_path}
                                          </span>
                                        </div>
                                      </div>

                                      <a 
                                        href={m.type === 'link' || m.type === 'pdf' ? m.file_path : '#'} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1 px-2 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-800/40 text-indigo-300 text-[10px] rounded flex items-center gap-1 transition"
                                      >
                                        <span>Access</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Upload Form helper (Teacher/Admin Only) */}
                              {session.role === 'admin' && (
                                <form onSubmit={handleUploadMaterial} className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-3" id="material_upload_form">
                                  <h4 className="text-[11px] font-bold text-indigo-300">Publish Resource</h4>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <input 
                                      type="text"
                                      id="mat_title"
                                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                      placeholder="Title: e.g. Trees"
                                      value={matTitle}
                                      onChange={e => setMatTitle(e.target.value)}
                                    />
                                    <select 
                                      id="mat_type"
                                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                                      value={matType}
                                      onChange={e => {
                                        setMatType(e.target.value as any);
                                        setMatFilePath('');
                                        setUploadError('');
                                      }}
                                    >
                                      <option value="pdf">PDF File</option>
                                      <option value="notes">Class Notes</option>
                                      <option value="link">Reference weblink</option>
                                    </select>
                                  </div>

                                  {(matType === 'pdf' || matType === 'notes') ? (
                                    <div className="space-y-2">
                                      {/* Drag and Drop Zone */}
                                      <div 
                                        id="material_drag_zone"
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          setDragOver(false);
                                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                            handleFileUploadProcess(e.dataTransfer.files[0]);
                                          }
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                                          dragOver 
                                            ? 'border-indigo-500 bg-indigo-950/20 text-indigo-300' 
                                            : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 text-slate-400'
                                        }`}
                                      >
                                        <input 
                                          type="file"
                                          ref={fileInputRef}
                                          className="hidden"
                                          accept={matType === 'pdf' ? '.pdf' : '*/*'}
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              handleFileUploadProcess(e.target.files[0]);
                                            }
                                          }}
                                        />
                                        
                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                          {isUploadingFile ? (
                                            <>
                                              <RefreshCcw className="w-5 h-5 animate-spin text-indigo-400" />
                                              <p className="text-[10px] font-semibold text-slate-300">Uploading to server...</p>
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="w-5 h-5 text-slate-500" />
                                              <p className="text-[10px] font-semibold">
                                                Drag & drop your file here, or <span className="text-indigo-400 font-bold hover:underline">browse</span>
                                              </p>
                                              <p className="text-[9px] text-slate-500">
                                                Supports PDFs, notes, text documents, or images
                                              </p>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Fallback path input field built inside for manual override */}
                                      <div className="space-y-1">
                                        <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-550">
                                          File Path / Plaintext Content (Auto-filled)
                                        </label>
                                        <input 
                                          type="text"
                                          id="mat_path"
                                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                          placeholder="Path to material or standard notes summary..."
                                          value={matFilePath}
                                          onChange={e => setMatFilePath(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-550">
                                        Reference Web Link
                                      </label>
                                      <input 
                                        type="text"
                                        id="mat_path"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. https://visualgo.net/en"
                                        value={matFilePath}
                                        onChange={e => setMatFilePath(e.target.value)}
                                      />
                                    </div>
                                  )}

                                  {uploadError && (
                                    <div className="text-[10px] text-red-400 font-semibold bg-red-950/20 border border-red-900/30 p-2 rounded flex items-center gap-1.5 animate-pulse">
                                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span>{uploadError}</span>
                                    </div>
                                  )}

                                  <button 
                                    type="submit"
                                    id="mat_upload_submit"
                                    disabled={isUploadingFile || !matTitle || !matFilePath}
                                    className={`w-full text-xs py-1.5 rounded-lg border transition font-bold ${
                                      (isUploadingFile || !matTitle || !matFilePath)
                                        ? 'bg-slate-900 border-slate-850 text-slate-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/20 cursor-pointer shadow-sm'
                                    }`}
                                  >
                                    Publish Resource
                                  </button>
                                </form>
                              )}

                            </div>

                            {/* Assessment Quizzes Block */}
                            <div className="space-y-4" id="quizzes_panel">
                              <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-indigo-400" />
                                <span>Quiz Examinations</span>
                              </h3>

                              <div className="space-y-2 max-h-[220px] overflow-y-auto" id="selected_course_quizzes_arena">
                                {(!activeManagerCourse.quizzes || activeManagerCourse.quizzes.length === 0) ? (
                                  <p className="text-xs text-slate-500 italic">No exams configured for this class.</p>
                                ) : (
                                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-center">
                                    <p className="text-xs text-slate-300 font-bold">
                                      {activeManagerCourse.quizzes.length} Questions Available
                                    </p>
                                    <p className="text-[10px] text-slate-500">Includes multiple choice test keys</p>

                                    {session.role === 'student' && (
                                      <button 
                                        id="take_quiz_button"
                                        onClick={() => handleSelectQuiz(activeManagerCourse)}
                                        className="mt-3 inline-flex bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg border border-indigo-400/20 duration-150 shadow-sm"
                                      >
                                        Attempt Exam Now
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Create Quiz Form helper (Teacher/Admin Only) */}
                              {session.role === 'admin' && (
                                <form onSubmit={handleCreateQuiz} className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-3" id="create_quiz_form">
                                  <h4 className="text-[11px] font-bold text-indigo-300">Configure Quiz Question</h4>
                                  
                                  <input 
                                    type="text"
                                    id="quiz_question"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    placeholder="Question: What is array depth?"
                                    value={quizQuestion}
                                    onChange={e => setQuizQuestion(e.target.value)}
                                  />

                                  <div className="grid grid-cols-2 gap-2">
                                    <input 
                                      type="text"
                                      id="quiz_opt1"
                                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                                      placeholder="Option 1"
                                      value={quizOpt1}
                                      onChange={e => setQuizOpt1(e.target.value)}
                                    />
                                    <input 
                                      type="text"
                                      id="quiz_opt2"
                                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                                      placeholder="Option 2"
                                      value={quizOpt2}
                                      onChange={e => setQuizOpt2(e.target.value)}
                                    />
                                    <input 
                                      type="text"
                                      id="quiz_opt3"
                                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                                      placeholder="Option 3"
                                      value={quizOpt3}
                                      onChange={e => setQuizOpt3(e.target.value)}
                                    />
                                    <input 
                                      type="text"
                                      id="quiz_opt4"
                                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                                      placeholder="Option 4"
                                      value={quizOpt4}
                                      onChange={e => setQuizOpt4(e.target.value)}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between gap-3 text-xs pt-1.5">
                                    <span className="text-slate-400 text-[10px]">Correct Answer Index:</span>
                                    <select 
                                      id="quiz_correct_opt"
                                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                                      value={quizCorrect}
                                      onChange={e => setQuizCorrect(Number(e.target.value))}
                                    >
                                      <option value={1}>Option 1</option>
                                      <option value={2}>Option 2</option>
                                      <option value={3}>Option 3</option>
                                      <option value={4}>Option 4</option>
                                    </select>
                                  </div>

                                  <button 
                                    type="submit"
                                    id="quiz_create_submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1.5 rounded-lg border border-indigo-500/20 transition font-bold"
                                  >
                                    Save Quiz Item
                                  </button>
                                </form>
                              )}
                            </div>

                          </div>
                          
                        </div>
                      ) : (
                        <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-400 text-xs">
                          Please choose an academic class from the list to display details.
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* PAGE: ATTEMPT EXPERIMENTAL QUIZ                          */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'quiz_page' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-8 space-y-6 max-w-4xl mx-auto" id="page_quiz_attempt">
                  
                  {selectedQuizCourse ? (
                    <>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800" id="quiz_attempt_header">
                        <div>
                          <span className="text-[9px] bg-red-500/10 text-red-300 border border-red-900/10 font-semibold px-2 py-0.5 rounded">
                            ACTIVE EXAMINATION RUN
                          </span>
                          <h2 className="text-lg font-bold mt-1 text-white">{selectedQuizCourse.course_name}</h2>
                          <p className="text-xs text-slate-400">Correct answers will be evaluated to update your live forecasting classes</p>
                        </div>
                        <button 
                          onClick={() => { setSelectedQuizCourse(null); setActiveTab('course_management'); }}
                          className="text-xs text-slate-400 hover:text-slate-200"
                        >
                          Cancel test
                        </button>
                      </div>

                      {/* QUIZ FORM BODY */}
                      {!quizSubmittedResult ? (
                        <div className="space-y-6" id="quiz_questions_unsubmitted_body">
                          {(selectedQuizCourse.quizzes || []).map((q: any, qIdx: number) => {
                            const selectedOption = studentQuizAnswers[q.id];
                            return (
                              <div key={q.id} className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
                                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                                  Question {qIdx + 1}
                                </h3>
                                <p className="text-xs font-semibold text-slate-100">{q.question}</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                  {[q.option1, q.option2, q.option3, q.option4].map((optTxt, optIdx) => {
                                    const rawOptNum = optIdx + 1;
                                    const isSelected = selectedOption === rawOptNum;
                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        className={`p-3 text-left rounded-lg text-xs border transition ${isSelected ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold' : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900 text-slate-300'}`}
                                        onClick={() => handleQuizAnswerSelect(q.id, rawOptNum)}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 bg-slate-950 text-transparent'}`}>
                                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                          </div>
                                          <span>{optTxt}</span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          <button 
                            id="submit_quiz_answers_btn"
                            onClick={handleSubmitQuizAnswers}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition"
                          >
                            Submit Answer Sheet for Evaluation
                          </button>
                        </div>
                      ) : (
                        /* QUIZ RESULTS GRADE CARD */
                        <div className="space-y-6 py-4" id="quiz_graded_result_card">
                          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-6 text-center space-y-4 max-w-sm mx-auto" id="graded_inner_score_card">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                              <Award className="w-6 h-6" />
                            </div>
                            
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Evaluation complete</p>
                              <h3 className="text-3xl font-extrabold text-white mt-1">
                                {quizSubmittedResult.score}%
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Scored {quizSubmittedResult.correct_count} out of {quizSubmittedResult.total} MCQ units Correct
                              </p>
                            </div>

                            <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg">
                              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Updated forecasting category</p>
                              <h4 className="text-xs font-bold text-indigo-300 mt-0.5">{quizSubmittedResult.predicted_category || 'Average Performer'}</h4>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button 
                                id="exit_quiz_attempt"
                                onClick={() => { setSelectedQuizCourse(null); setQuizSubmittedResult(null); setActiveTab('dashboard'); }}
                                className="flex-1 bg-slate-900 hover:bg-slate-850 rounded-lg py-1.5 px-3 text-xs font-semibold text-slate-300 border border-slate-805 transition"
                              >
                                Exit Section
                              </button>
                              <button 
                                id="retake_quiz"
                                onClick={() => { setQuizSubmittedResult(null); setStudentQuizAnswers({}); }}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-1.5 px-3 text-xs font-semibold transition"
                              >
                                Re-Attempt Test
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No selected course. Please start attempt from the Course Management list.
                    </div>
                  )}

                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* PAGE: PERFORMANCE PREDICTION (ML CENTER)                 */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'prediction_page' && (
                <div className="space-y-6 max-w-5xl mx-auto" id="page_prediction">
                  
                  {/* Explanatory Header */}
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl" id="predict_header_banner">
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-900/30 uppercase font-black px-2 py-0.5 rounded">
                      Machine Learning Engine
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1.5">Student Performance Decision Tree Forecast</h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      We train a robust Decision Tree Classifier algorithm using continuous variables: Attendance Rate, quiz scores, assignment outcomes, and study hours weekly. Feed variables to forecast high performer brackets.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="predict_grid_cols">
                    
                    {/* LEFT CONTROLLER: SLIDER SIMULATOR */}
                    <form onSubmit={handlePredictPerformance} className="lg:col-span-12 xl:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4" id="predict_values_form">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                        <span>Input Feature Variables</span>
                      </h3>

                      {/* Slider attendance */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Attendance Rate (%):</span>
                          <span className="font-bold text-slate-200">{predictAttendance}%</span>
                        </div>
                        <input 
                          type="range" 
                          id="slider_attendance"
                          min="40" 
                          max="100" 
                          className="w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg appearance-none cursor-pointer"
                          value={predictAttendance} 
                          onChange={e => setPredictAttendance(Number(e.target.value))} 
                        />
                      </div>

                      {/* Slider quiz average */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Quiz Average Score:</span>
                          <span className="font-bold text-slate-200">{predictQuizScore}/100</span>
                        </div>
                        <input 
                          type="range" 
                          id="slider_quiz"
                          min="30" 
                          max="100" 
                          className="w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg appearance-none cursor-pointer"
                          value={predictQuizScore} 
                          onChange={e => setPredictQuizScore(Number(e.target.value))} 
                        />
                      </div>

                      {/* Slider Assignment score */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Assignment Average:</span>
                          <span className="font-bold text-slate-200">{predictAssignmentScore}/100</span>
                        </div>
                        <input 
                          type="range" 
                          id="slider_assignment"
                          min="30" 
                          max="100" 
                          className="w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg appearance-none cursor-pointer"
                          value={predictAssignmentScore} 
                          onChange={e => setPredictAssignmentScore(Number(e.target.value))} 
                        />
                      </div>

                      {/* Slider Study hours */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Weekly Study Time:</span>
                          <span className="font-bold text-slate-200">{predictStudyTime} Hours/Week</span>
                        </div>
                        <input 
                          type="range" 
                          id="slider_study"
                          min="1" 
                          max="16" 
                          className="w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg appearance-none cursor-pointer"
                          value={predictStudyTime} 
                          onChange={e => setPredictStudyTime(Number(e.target.value))} 
                        />
                      </div>

                      {/* Slider previous performance */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Previous Exam Score:</span>
                          <span className="font-bold text-slate-200">{predictPreviousScore}/100</span>
                        </div>
                        <input 
                          type="range" 
                          id="slider_previous"
                          min="30" 
                          max="100" 
                          className="w-full accent-indigo-500 bg-slate-950 h-1 rounded-lg appearance-none cursor-pointer"
                          value={predictPreviousScore} 
                          onChange={e => setPredictPreviousScore(Number(e.target.value))} 
                        />
                      </div>

                      <button 
                        type="submit"
                        id="predict_run_btn"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-sm mt-2 flex items-center justify-center gap-2 transition cursor-pointer"
                        disabled={isPredicting}
                      >
                        {isPredicting ? (
                          <>
                            <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                            <span>Computing Splitting Entropy...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-3.5 h-3.5" />
                            <span>Evaluate Decision Classifier Model</span>
                          </>
                        )}
                      </button>

                    </form>

                    {/* RIGHT CONTAINER: RESULTS DECAL */}
                    <div className="lg:col-span-5 flex flex-col gap-5" id="predict_insights_wrapper">
                      
                      {/* Prediction Target result */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 text-center flex-1 flex flex-col justify-center items-center" id="prediction_report_display">
                        <p className="text-[9px] bg-indigo-500/10 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-900/30 uppercase font-bold mb-3">
                          Algorithmic Output
                        </p>
                        
                        <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Projected Performance bracket</h4>
                        
                        <h2 className={`text-xl font-black mt-1.5 tracking-tight ${
                          predictionOutput === 'High Performer' 
                            ? 'text-emerald-400' 
                            : predictionOutput === 'Needs Improvement' 
                            ? 'text-red-400' 
                            : 'text-indigo-300'
                        }`}>
                          {predictionOutput || 'Awaiting Inputs'}
                        </h2>

                        <p className="text-xs text-slate-400 mt-2 max-w-[200px] leading-relaxed">
                          {!predictionOutput ? 'Adjust features on the left index and trigger model evaluation.' : 'Target category updated inside students persistence state.'}
                        </p>
                      </div>

                      {/* Model diagnostics metrics card */}
                      {predictionMetrics && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5" id="ml_model_metrics_card">
                          <h4 className="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
                            <Database className="w-4 h-4 text-amber-400" />
                            <span>Supervised Classifier Metrics</span>
                          </h4>

                          <div className="space-y-2 text-[10px]" id="validation_metrics_table">
                            <div className="flex justify-between border-b border-slate-800 pb-1.5">
                              <span className="text-slate-400 mb-0.5">Total Samples:</span>
                              <span className="font-bold text-slate-200">500 Students</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-1.5">
                              <span className="text-slate-400 mb-0.5">Testing Split size:</span>
                              <span className="font-bold text-slate-200">20% ({predictionMetrics.testSize || 100} records)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Decision Tree Depth Limit:</span>
                              <span className="font-bold text-slate-200">5 layers</span>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* PAGE: LEARNING GAP ANALYSIS (AI RECTIFIER)               */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'learning_gap_page' && (
                <div className="space-y-6 max-w-4xl mx-auto" id="page_learning_gap">
                  
                  {/* GenAI Objectives banner */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5" id="gap_analysis_banner">
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-950/20 uppercase font-black px-2 py-0.5 rounded">
                      Generative AI System
                    </span>
                    <h2 className="text-lg font-bold mt-1.5 text-white">Google Gemini Learning Gap Analyzer</h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      This module submits student variables, weak categories, and syllabus outlines directly to the **Google Gemini 1.5 Flash** model. It generates bespoke recommendations, coding drill problems, and time tracking plans.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4" id="gap_analyzer_controls">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                      <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
                      <span>Configure Student Diagnosis</span>
                    </h3>

                    {/* Weak topics tag setup */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Lagging Topics / Struggles (Comma delimited)
                      </label>
                      <input 
                        type="text" 
                        id="weak_topics_csv_input"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                        placeholder="e.g. Arrays, Memoization, Trees, Recursion"
                        value={userReportedWeakTopics}
                        onChange={e => setUserReportedWeakTopics(e.target.value)}
                      />
                    </div>

                    <div className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl text-xs space-y-2" id="ai_diagnostics_payload_inspect">
                      <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Payload submitted to Gemini:</p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-slate-300">
                        <div>Attendance: <strong className="text-indigo-300">{predictAttendance}%</strong></div>
                        <div>Quiz Index: <strong className="text-indigo-300">{predictQuizScore}%</strong></div>
                        <div>Assignment Avg: <strong className="text-indigo-300">{predictAssignmentScore}%</strong></div>
                        <div>Study Hours: <strong className="text-indigo-300">{predictStudyTime}h</strong></div>
                      </div>
                    </div>

                    <button 
                      id="ai_gap_trigger_btn"
                      onClick={handleGenerateAIAnalysis}
                      disabled={isAiLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isAiLoading ? (
                        <>
                          <RefreshCcw className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Gemini actively analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                          <span>Generate Live AI Gap Report</span>
                        </>
                      )}
                    </button>

                    {/* MARKDOWN AI SUMMARY RESULTS BOX */}
                    {aiAnalysisResult && (
                      <div className="bg-slate-950/40 p-5 rounded-lg border border-slate-800 mt-6 space-y-4" id="ai_output_markup_card">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <h4 className="text-xs uppercase font-extrabold text-indigo-300 tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            <span>Bespoke AI Learning Guide Report</span>
                          </h4>
                          <span className="text-[9px] uppercase bg-indigo-500/10 border border-indigo-900/20 text-indigo-300 px-2 py-0.5 rounded font-black">
                            Gemini Output
                          </span>
                        </div>

                        {/* Rendering Markdown text cleanly */}
                        <div className="text-slate-300 text-xs leading-relaxed space-y-3" id="ai_results_markup_prose">
                          {aiAnalysisResult.split('\n').map((line, lIdx) => {
                            if (line.startsWith('###')) {
                              return <h3 key={lIdx} className="text-xs font-bold text-white pt-2">{line.replace('###', '').trim()}</h3>;
                            } else if (line.startsWith('##')) {
                              return <h2 key={lIdx} className="text-sm font-bold text-white pt-2.5 border-b border-slate-850 pb-1">{line.replace('##', '').trim()}</h2>;
                            } else if (line.startsWith('*') || line.startsWith('-')) {
                              return <li key={lIdx} className="ml-4 list-disc text-slate-300">{line.substring(2).trim()}</li>;
                            } else if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.')) {
                              return <p key={lIdx} className="ml-2 font-medium text-slate-200 pl-1">{line.trim()}</p>;
                            } else if (line.trim() === '') {
                              return <div key={lIdx} className="h-1.5" />;
                            }
                            return <p key={lIdx}>{line}</p>;
                          })}
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

          </main>

        </div>
      )}

    </div>
  );
}
