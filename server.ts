import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, SQL_SCHEMA_EXPLANATION } from './src/lib/db.js';
import { generateLearningGapAnalysis } from './src/lib/genai.js';
import { StudentPerformance } from './src/types.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Body parser with higher limits for raw base64 file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploaded files
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

// Helper for wrapping endpoints to support both prefixed and base URLs
function registerRoute(method: 'get' | 'post', routeName: string, handler: express.RequestHandler) {
  // Support both /api/route and /route directly
  app[method](routeName, handler);
  app[method](`/api${routeName}`, handler);
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// POST /register
registerRoute('post', '/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
  }

  // Check duplicate
  const exists = db.getStudents().find(s => s.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  const newStudent = {
    id: 'student_' + Math.random().toString(36).substr(2, 9),
    name,
    email,
    password // Simple hashed password in production (plaintext for convenient database view)
  };

  db.addStudent(newStudent);

  // Setup initial default mock performance
  db.setPerformance({
    id: 'perf_' + Math.random().toString(36).substr(2, 9),
    student_id: newStudent.id,
    attendance: 80,
    quiz_score: 70,
    assignment_score: 75,
    study_time: 4,
    previous_score: 70,
    predicted_category: 'Average Performer',
    weak_topics: ['Arrays']
  });

  res.status(201).json({ message: 'Registration successful!', user: newStudent });
});

// POST /login
registerRoute('post', '/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Check admin
  const admin = db.getAdmins().find(
    a => a.username.toLowerCase() === email.toLowerCase() && a.password === password
  );
  if (admin) {
    return res.json({
      role: 'admin',
      user: { id: admin.id, name: 'Administrator', email: admin.username }
    });
  }

  // Check student
  const student = db.getStudents().find(
    s => s.email.toLowerCase() === email.toLowerCase() && s.password === password
  );
  if (student) {
    return res.json({
      role: 'student',
      user: { id: student.id, name: student.name, email: student.email }
    });
  }

  res.status(401).json({ error: 'Invalid credentials. Use student registration or admin/admin123.' });
});

// GET /courses
registerRoute('get', '/courses', (req, res) => {
  const courses = db.getCourses();
  const materials = db.getMaterials();
  const quizzes = db.getQuizzes();

  // Return augmented courses with their materials & quizzes counters
  const result = courses.map(c => ({
    ...c,
    materials: materials.filter(m => m.course_id === c.id),
    quizzes: quizzes.filter(q => q.course_id === c.id)
  }));

  res.json(result);
});

// POST /add-course
registerRoute('post', '/add-course', (req, res) => {
  const { course_name, description } = req.body;
  if (!course_name) {
    return res.status(400).json({ error: 'Course name is required.' });
  }

  const newCourse = {
    id: 'course_' + Math.random().toString(36).substr(2, 9),
    course_name,
    description: description || ''
  };

  db.addCourse(newCourse);
  res.status(201).json({ message: 'Course added successfully!', course: newCourse });
});

// POST /upload-material
registerRoute('post', '/upload-material', (req, res) => {
  const { course_id, title, type, file_path } = req.body;
  if (!course_id || !title || !type) {
    return res.status(400).json({ error: 'Course id, title, and type are required.' });
  }

  const newMat = {
    id: 'mat_' + Math.random().toString(36).substr(2, 9),
    course_id,
    title,
    type: type as any,
    file_path: file_path || 'Notes content placeholder'
  };

  db.addMaterial(newMat);
  res.status(201).json({ message: 'Learning material added successfully!', material: newMat });
});

// POST /upload-file
registerRoute('post', '/upload-file', (req, res) => {
  const { fileName, fileData } = req.body;
  if (!fileName || !fileData) {
    return res.status(400).json({ error: 'fileName and fileData (base64 string) are required.' });
  }

  try {
    // If the base64 string includes standard data:URL prefix, strip it (e.g., data:application/pdf;base64,)
    let base64Content = fileData;
    if (fileData.includes(';base64,')) {
      base64Content = fileData.split(';base64,')[1];
    }

    const buffer = Buffer.from(base64Content, 'base64');
    
    // Create clean safe unique filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${Date.now()}_${sanitizedFileName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    fs.writeFileSync(filePath, buffer);

    res.status(201).json({
      message: 'File written successfully',
      url: `/uploads/${uniqueFileName}`
    });
  } catch (error: any) {
    console.error('Error writing file upload:', error);
    res.status(500).json({ error: 'Failed to write file on server.' });
  }
});

// POST /create-quiz
registerRoute('post', '/create-quiz', (req, res) => {
  const { course_id, question, option1, option2, option3, option4, correct_answer } = req.body;
  if (!course_id || !question || !option1 || !option2 || !option3 || !option4 || !correct_answer) {
    return res.status(400).json({ error: 'All fields are required to create a quiz.' });
  }

  const newQuiz = {
    id: 'quiz_' + Math.random().toString(36).substr(2, 9),
    course_id,
    question,
    option1,
    option2,
    option3,
    option4,
    correct_answer: Number(correct_answer)
  };

  db.addQuiz(newQuiz);
  res.status(201).json({ message: 'Quiz question created successfully!', quiz: newQuiz });
});

// POST /submit-quiz
registerRoute('post', '/submit-quiz', (req, res) => {
  const { student_id, course_id, answers } = req.body; // answers is an object mapping { [quizId]: optionNumber }
  if (!student_id || !course_id || !answers) {
    return res.status(400).json({ error: 'student_id, course_id, and answers object are required.' });
  }

  // Get course quizzes
  const courseQuizzes = db.getQuizzes().filter(q => q.course_id === course_id);
  if (courseQuizzes.length === 0) {
    return res.status(400).json({ error: 'No quizzes found for this course.' });
  }

  let correctCount = 0;
  for (const quiz of courseQuizzes) {
    const studentAnswer = answers[quiz.id];
    if (Number(studentAnswer) === Number(quiz.correct_answer)) {
      correctCount++;
    }
  }

  const percentage = Math.round((correctCount / courseQuizzes.length) * 100);

  // Store result
  const newResult = {
    id: 'res_' + Math.random().toString(36).substr(2, 9),
    student_id,
    course_id,
    score: percentage,
    total_questions: courseQuizzes.length
  };
  db.addResult(newResult);

  // Re-calculate average quiz score and update performance values
  const studentResults = db.getResults().filter(r => r.student_id === student_id);
  const avgQuizScore = Math.round(studentResults.reduce((acc, curr) => acc + curr.score, 0) / studentResults.length);

  // Retrieve current student performance metrics
  const perf: StudentPerformance = db.getPerformanceByStudent(student_id) || {
    id: 'perf_' + Math.random().toString(36).substr(2, 9),
    student_id,
    attendance: 85,
    quiz_score: avgQuizScore,
    assignment_score: 80,
    study_time: 5,
    previous_score: 75,
    predicted_category: 'Average Performer',
    weak_topics: []
  };

  perf.quiz_score = avgQuizScore;

  // Rule-based weak topic generator to keep ML insights realistic
  const detectedWeak: string[] = [...perf.weak_topics];
  if (percentage < 70) {
    // Determine course topic and flag it
    const course = db.getCourses().find(c => c.id === course_id);
    if (course) {
      const topicName = course.course_name.includes('Arrays') ? 'Arrays' : 
                        course.course_name.includes('Structures') ? 'Data Structures' : 'Recursion';
      if (!detectedWeak.includes(topicName)) {
        detectedWeak.push(topicName);
      }
    }
  } else {
    // If they score high, maybe remove the topic
    const course = db.getCourses().find(c => c.id === course_id);
    if (course) {
      const topicName = course.course_name.includes('Arrays') ? 'Arrays' : 
                        course.course_name.includes('Structures') ? 'Data Structures' : 'Recursion';
      const index = detectedWeak.indexOf(topicName);
      if (index !== -1) detectedWeak.splice(index, 1);
    }
  }
  perf.weak_topics = detectedWeak.length > 0 ? detectedWeak : ['None'];

  // Re-predict performance
  const model = db.getModel();
  if (model) {
    // features: attendance, quiz_score, assignment_score, study_time, previous_score
    const classIdx = model.predictSingle([
      Number(perf.attendance),
      Number(perf.quiz_score),
      Number(perf.assignment_score),
      Number(perf.study_time),
      Number(perf.previous_score)
    ]);
    const labels: Array<'Needs Improvement' | 'Average Performer' | 'High Performer'> = [
      'Needs Improvement',
      'Average Performer',
      'High Performer'
    ];
    perf.predicted_category = labels[classIdx] || 'Average Performer';
  }

  db.setPerformance(perf);

  res.json({
    score: percentage,
    correct_count: correctCount,
    total: courseQuizzes.length,
    predicted_category: perf.predicted_category
  });
});

// POST /predict-performance
registerRoute('post', '/predict-performance', (req, res) => {
  const { student_id, attendance, quiz_score, assignment_score, study_time, previous_score } = req.body;

  if (attendance === undefined || quiz_score === undefined || assignment_score === undefined || study_time === undefined || previous_score === undefined) {
    return res.status(400).json({ error: 'attendance, quiz_score, assignment_score, study_time, and previous_score are required.' });
  }

  const model = db.getModel();
  let predictedCategory: 'Needs Improvement' | 'Average Performer' | 'High Performer' = 'Average Performer';

  if (model) {
    const classIdx = model.predictSingle([
      Number(attendance),
      Number(quiz_score),
      Number(assignment_score),
      Number(study_time),
      Number(previous_score)
    ]);
    const labels: Array<'Needs Improvement' | 'Average Performer' | 'High Performer'> = [
      'Needs Improvement',
      'Average Performer',
      'High Performer'
    ];
    predictedCategory = labels[classIdx] || 'Average Performer';
  }

  // If student is logged in, update their database metrics
  if (student_id) {
    const perf: StudentPerformance = db.getPerformanceByStudent(student_id) || {
      id: 'perf_' + Math.random().toString(36).substr(2, 9),
      student_id,
      attendance: 80,
      quiz_score: 70,
      assignment_score: 75,
      study_time: 4,
      previous_score: 70,
      predicted_category: 'Average Performer',
      weak_topics: ['Arrays']
    };

    perf.attendance = Number(attendance);
    perf.quiz_score = Number(quiz_score);
    perf.assignment_score = Number(assignment_score);
    perf.study_time = Number(study_time);
    perf.previous_score = Number(previous_score);
    perf.predicted_category = predictedCategory;

    db.setPerformance(perf);
  }

  res.json({
    predicted_category: predictedCategory,
    metrics: db.getModelMetrics()
  });
});

// POST /learning-gap-analysis
registerRoute('post', '/learning-gap-analysis', async (req, res) => {
  const { student_id, attendance, quiz_score, assignment_score, study_time, weak_topics } = req.body;

  let finalData = {
    attendance: Number(attendance || 80),
    quiz_score: Number(quiz_score || 70),
    assignment_score: Number(assignment_score || 75),
    study_time: Number(study_time || 4),
    weak_topics: weak_topics || ['Arrays']
  };

  // Pull from DB if student_id is provided and parameters are missing
  if (student_id) {
    const perf = db.getPerformanceByStudent(student_id);
    if (perf) {
      finalData = {
        attendance: Number(perf.attendance),
        quiz_score: Number(perf.quiz_score),
        assignment_score: Number(perf.assignment_score),
        study_time: Number(perf.study_time),
        weak_topics: perf.weak_topics.length > 0 ? perf.weak_topics : ['None']
      };
    }
  }

  try {
    const analysis = await generateLearningGapAnalysis(finalData);
    res.json({ analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error generating learning gap analysis.' });
  }
});

// GET /student-dashboard
registerRoute('get', '/student-dashboard', (req, res) => {
  const studentId = req.query.student_id as string;
  if (!studentId) {
    return res.status(400).json({ error: 'student_id query parameter is required.' });
  }

  const student = db.getStudents().find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const results = db.getResults().filter(r => r.student_id === studentId);
  const perf = db.getPerformanceByStudent(studentId) || {
    id: 'perf_' + Math.random().toString(36).substr(2, 9),
    student_id: studentId,
    attendance: 80,
    quiz_score: 70,
    assignment_score: 75,
    study_time: 4,
    previous_score: 70,
    predicted_category: 'Average Performer',
    weak_topics: ['Arrays']
  };

  res.json({
    student,
    results,
    performance: perf,
    coursesCount: db.getCourses().length,
    materialsCount: db.getMaterials().length,
    quizzesCount: db.getQuizzes().length
  });
});

// GET /admin-dashboard
registerRoute('get', '/admin-dashboard', (req, res) => {
  const students = db.getStudents();
  const courses = db.getCourses();
  const results = db.getResults();
  const performances = db.getPerformances();
  const metrics = db.getModelMetrics();

  // Standard calculation aggregates
  const studentPerformances = students.map(s => {
    const perf = db.getPerformanceByStudent(s.id) || {
      id: 'perf_' + Math.random().toString(36).substr(2, 9),
      student_id: s.id,
      attendance: 80,
      quiz_score: 70,
      assignment_score: 75,
      study_time: 4,
      previous_score: 70,
      predicted_category: 'Average Performer',
      weak_topics: ['Arrays']
    };
    return {
      student: s,
      performance: perf,
      lastScore: results.filter(r => r.student_id === s.id).slice(-1)[0]?.score || null
    };
  });

  res.json({
    total_students: students.length,
    total_courses: courses.length,
    total_materials: db.getMaterials().length,
    total_quizzes: db.getQuizzes().length,
    student_performances: studentPerformances,
    ml_model_metrics: metrics,
    sql_schema_explanation: SQL_SCHEMA_EXPLANATION
  });
});

// Extra diagnostics / Admin trigger to retrain classifier on dataset
app.post('/api/admin/retrain', (req, res) => {
  const success = db.trainModelOnDataset();
  if (success) {
    res.json({ message: 'Model trained successfully on updated csv!', metrics: db.getModelMetrics() });
  } else {
    res.status(500).json({ error: 'Failed to train algorithm. Check dataset file.' });
  }
});

// -------------------------------------------------------------
// Integrate Vite for dynamic full-stack preview
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, 'dist'));

  if (!isProduction) {
    // Development server leveraging Vite dev middle-tier
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });

    console.log('Running in Development mode with Vite Middleware.');
  } else {
    // Production build delivery
    console.log('Running in Production mode. Serving dist/ static assets.');
    app.use(express.static(path.join(__dirname, 'dist')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LMS Full Stack system actively listening on port ${port}...`);
  });
}

startServer();
