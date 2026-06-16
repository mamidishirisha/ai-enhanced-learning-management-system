export interface Student {
  id: string;
  name: string;
  email: string;
  password?: string; // hashed/stored
}

export interface Admin {
  id: string;
  username: string;
  password?: string;
}

export interface Course {
  id: string;
  course_name: string;
  description: string;
}

export interface Material {
  id: string;
  course_id: string;
  title: string;
  type: 'pdf' | 'notes' | 'link';
  file_path: string; // url or name
}

export interface Quiz {
  id: string;
  course_id: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_answer: number; // 1, 2, 3, or 4
}

export interface QuizResult {
  id: string;
  student_id: string;
  course_id: string;
  score: number;
  total_questions: number;
  createdAt?: string;
}

export interface StudentPerformance {
  id: string;
  student_id: string;
  attendance: number; // percentage, e.g. 85
  quiz_score: number; // current average quiz score, e.g. 78
  assignment_score: number; // average assignment score, e.g. 80
  study_time: number; // hours per week, e.g. 5
  previous_score: number; // previous mid-term or class score, e.g. 74
  predicted_category?: 'High Performer' | 'Average Performer' | 'Needs Improvement';
  weak_topics: string[];
}

export interface ModelMetrics {
  accuracy: number;
  confusionMatrix: number[][];
  report: {
    [key: string]: {
      precision: number;
      recall: number;
      f1Score: number;
      support: number;
    };
  };
  trainSize: number;
  testSize: number;
}
