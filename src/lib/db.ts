import fs from 'fs';
import path from 'path';
import { 
  Student, 
  Admin, 
  Course, 
  Material, 
  Quiz, 
  QuizResult, 
  StudentPerformance, 
  ModelMetrics 
} from '../types.js';
import { DecisionTreeClassifier, generateDatasetCSV, calculateModelMetrics } from './ml.js';

const DATA_FILE = path.join(process.cwd(), 'data-store.json');
const DATASET_FILE = path.join(process.cwd(), 'ml', 'dataset.csv');

export interface DBState {
  students: Student[];
  admins: Admin[];
  courses: Course[];
  materials: Material[];
  quizzes: Quiz[];
  results: QuizResult[];
  performances: StudentPerformance[];
  trainedModelJSON: string | null;
  modelMetrics: ModelMetrics | null;
}

export class DBManager {
  private state: DBState;

  constructor() {
    this.state = {
      students: [],
      admins: [],
      courses: [],
      materials: [],
      quizzes: [],
      results: [],
      performances: [],
      trainedModelJSON: null,
      modelMetrics: null
    };
    this.init();
  }

  private init() {
    // Ensure ml directory exists
    const mlDir = path.join(process.cwd(), 'ml');
    if (!fs.existsSync(mlDir)) {
      fs.mkdirSync(mlDir, { recursive: true });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Load state from data-store.json
    if (fs.existsSync(DATA_FILE)) {
      try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.state = JSON.parse(fileContent);
      } catch (err) {
        console.error('Error loading database state:', err);
      }
    }

    // Create default dataset CSV if missing
    if (!fs.existsSync(DATASET_FILE)) {
      try {
        const dummyCSV = generateDatasetCSV(500);
        fs.writeFileSync(DATASET_FILE, dummyCSV, 'utf-8');
        console.log('Generated default ML dataset at:', DATASET_FILE);
      } catch (err) {
        console.error('Error seeding ML dataset:', err);
      }
    }

    // Seed dummy data if brand new
    let modified = false;
    if (this.state.admins.length === 0) {
      this.state.admins.push({
        id: 'admin-1',
        username: 'admin',
        password: 'admin123' // simple credential for easy preview login
      });
      modified = true;
    }

    if (this.state.courses.length === 0) {
      this.state.courses.push(
        {
          id: 'course-1',
          course_name: 'Introduction to Computer Science & Arrays',
          description: 'Basic introduction to computer science, variables, syntax, and one-dimensional arrays.'
        },
        {
          id: 'course-2',
          course_name: 'Data Structures & Algorithms',
          description: 'Master binary trees, linked lists, stacks, queues, and graph representations.'
        },
        {
          id: 'course-3',
          course_name: 'Mastering Recursion and Dynamic Programming',
          description: 'Unlock recursion trees, divide and conquer algorithms, and dynamic programming memoization.'
        }
      );

      this.state.materials.push(
        {
          id: 'mat-1',
          course_id: 'course-1',
          title: 'Arrays Cheat Sheet & Performance Notes',
          type: 'pdf',
          file_path: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d'
        },
        {
          id: 'mat-2',
          course_id: 'course-1',
          title: 'Interactive Coding Exercises on Arrays',
          type: 'notes',
          file_path: 'Practice array operations'
        },
        {
          id: 'mat-3',
          course_id: 'course-2',
          title: 'Visualizing Trees & Graph Structures',
          type: 'link',
          file_path: 'https://visualgo.net/en'
        },
        {
          id: 'mat-4',
          course_id: 'course-3',
          title: 'Recursion Call Stack Explanation Guide',
          type: 'notes',
          file_path: 'Understanding stack frames'
        }
      );

      this.state.quizzes.push(
        {
          id: 'quiz-1',
          course_id: 'course-1',
          question: 'What is the index of the first element in a standard array?',
          option1: '-1',
          option2: '0',
          option3: '1',
          option4: 'None of the above',
          correct_answer: 2
        },
        {
          id: 'quiz-2',
          course_id: 'course-1',
          question: 'Which of the following describes an array resizing overhead in dynamic arrays?',
          option1: 'Constant time insertion',
          option2: 'O(N) data copying operation during resize',
          option3: 'No execution impact',
          option4: 'Instant dynamic index allocation',
          correct_answer: 2
        },
        {
          id: 'quiz-3',
          course_id: 'course-2',
          question: 'Which data structure operates on a Last In First Out (LIFO) queue principle?',
          option1: 'Queue',
          option2: 'Linked List',
          option3: 'Stack',
          option4: 'Binary Search Tree',
          correct_answer: 3
        },
        {
          id: 'quiz-4',
          course_id: 'course-2',
          question: 'What is the time complexity of a lookup in a perfectly balanced Binary Search Tree (BST)?',
          option1: 'O(1)',
          option2: 'O(log N)',
          option3: 'O(N)',
          option4: 'O(N log N)',
          correct_answer: 2
        },
        {
          id: 'quiz-5',
          course_id: 'course-3',
          question: 'What happens if a recursive function does not have a correct base condition?',
          option1: 'The program compiles successfully and completes early',
          option2: 'It causes a Stack Overflow error at runtime',
          option3: 'Memory consumption stays constant',
          option4: 'It resolves dynamically into an iterative loop',
          correct_answer: 2
        }
      );
      modified = true;
    }

    if (modified || !this.state.trainedModelJSON) {
      this.trainModelOnDataset();
    } else {
      this.save();
    }
  }

  // Train decision tree algorithm using CSV dataset
  public trainModelOnDataset(): boolean {
    try {
      if (!fs.existsSync(DATASET_FILE)) {
        return false;
      }
      const dataStr = fs.readFileSync(DATASET_FILE, 'utf-8');
      const lines = dataStr.trim().split('\n');
      if (lines.length <= 1) return false;

      const headers = lines[0].split(',');
      const rows: number[][] = [];
      const labels: number[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(',').map(Number);
        if (vals.length < 6) continue;
        rows.push(vals.slice(0, 5)); // attendance, quiz_score, assignment_score, study_time, previous_score
        labels.push(vals[5]); // performance_category
      }

      if (rows.length === 0) return false;

      // Train-Test Split (80% / 20%)
      const shuffledIndices = Array.from({ length: rows.length }, (_, i) => i).sort(() => Math.random() - 0.5);
      const splitLimit = Math.floor(rows.length * 0.8);

      const X_train: number[][] = [];
      const y_train: number[] = [];
      const X_test: number[][] = [];
      const y_test: number[] = [];

      for (let idx = 0; idx < shuffledIndices.length; idx++) {
        const origI = shuffledIndices[idx];
        if (idx < splitLimit) {
          X_train.push(rows[origI]);
          y_train.push(labels[origI]);
        } else {
          X_test.push(rows[origI]);
          y_test.push(labels[origI]);
        }
      }

      const clf = new DecisionTreeClassifier(5, 2);
      clf.fit(X_train, y_train);

      const metrics = calculateModelMetrics(X_train, y_train, X_test, y_test, clf);

      this.state.trainedModelJSON = clf.serialize();
      this.state.modelMetrics = metrics;
      this.save();
      console.log(`ML DecisionTree trained successfully. Samples: ${rows.length}. Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
      return true;
    } catch (err) {
      console.error('Error training model:', err);
      return false;
    }
  }

  public getModel(): DecisionTreeClassifier | null {
    if (!this.state.trainedModelJSON) return null;
    const clf = new DecisionTreeClassifier();
    clf.deserialize(this.state.trainedModelJSON);
    return clf;
  }

  public save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save state:', err);
    }
  }

  // CRUD Operations
  public getStudents() { return this.state.students; }
  public getAdmins() { return this.state.admins; }
  public getCourses() { return this.state.courses; }
  public getMaterials() { return this.state.materials; }
  public getQuizzes() { return this.state.quizzes; }
  public getResults() { return this.state.results; }
  public getPerformances() { return this.state.performances; }
  public getModelMetrics() { return this.state.modelMetrics; }

  public addStudent(student: Student) {
    this.state.students.push(student);
    this.save();
  }

  public addCourse(course: Course) {
    this.state.courses.push(course);
    this.save();
  }

  public editCourse(id: string, name: string, description: string) {
    const course = this.state.courses.find(c => c.id === id);
    if (course) {
      course.course_name = name;
      course.description = description;
      this.save();
      return true;
    }
    return false;
  }

  public deleteCourse(id: string) {
    this.state.courses = this.state.courses.filter(c => c.id !== id);
    this.state.materials = this.state.materials.filter(m => m.course_id !== id);
    this.state.quizzes = this.state.quizzes.filter(q => q.course_id !== id);
    this.state.results = this.state.results.filter(r => r.course_id !== id);
    this.save();
  }

  public addMaterial(material: Material) {
    this.state.materials.push(material);
    this.save();
  }

  public addQuiz(quiz: Quiz) {
    this.state.quizzes.push(quiz);
    this.save();
  }

  public addResult(result: QuizResult) {
    this.state.results.push(result);
    this.save();
  }

  public setPerformance(performance: StudentPerformance) {
    const idx = this.state.performances.findIndex(p => p.student_id === performance.student_id);
    if (idx !== -1) {
      this.state.performances[idx] = performance;
    } else {
      this.state.performances.push(performance);
    }
    this.save();
  }

  public getPerformanceByStudent(studentId: string): StudentPerformance | null {
    return this.state.performances.find(p => p.student_id === studentId) || null;
  }
}

export const db = new DBManager();
export const SQL_SCHEMA_EXPLANATION = `
-- ===========================================
-- REAL PRODUCTION MYSQL DATABASE SCHEMA
-- ===========================================

CREATE DATABASE lms_db;
USE lms_db;

-- 1. Table schema: students
CREATE TABLE students (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- 2. Table schema: admins
CREATE TABLE admins (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- 3. Table schema: courses
CREATE TABLE courses (
  id VARCHAR(255) PRIMARY KEY,
  course_name VARCHAR(255) NOT NULL,
  description TEXT
);

-- 4. Table schema: materials
CREATE TABLE materials (
  id VARCHAR(255) PRIMARY KEY,
  course_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_path TEXT,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 5. Table schema: quizzes
CREATE TABLE quizzes (
  id VARCHAR(255) PRIMARY KEY,
  course_id VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  option1 VARCHAR(255) NOT NULL,
  option2 VARCHAR(255) NOT NULL,
  option3 VARCHAR(255) NOT NULL,
  option4 VARCHAR(255) NOT NULL,
  correct_answer INT NOT NULL, -- 1, 2, 3 or 4
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 6. Table schema: quiz_results
CREATE TABLE quiz_results (
  id VARCHAR(255) PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  course_id VARCHAR(255) NOT NULL,
  score INT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 7. Table schema: student_performance
CREATE TABLE student_performance (
  id VARCHAR(255) PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  attendance INT NOT NULL,
  quiz_score INT NOT NULL,
  assignment_score INT NOT NULL,
  study_time INT NOT NULL,
  previous_score INT NOT NULL,
  predicted_category VARCHAR(50),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ===========================================
`;
