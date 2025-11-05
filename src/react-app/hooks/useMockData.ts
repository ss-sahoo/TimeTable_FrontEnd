import { useState, useEffect } from 'react';
import { Exam, ExamSubject, ExamSection, Question } from '@/shared/types';

// Mock data
const mockExams: Exam[] = [
  {
    id: 1,
    title: "Half-yearly Exam",
    status: "preparing",
    start_date: "2024-12-15T09:00:00Z",
    end_date: "2024-12-15T12:00:00Z",
    duration_minutes: 180,
    user_id: "user_1",
    created_at: "2024-10-01T10:30:00Z",
    updated_at: "2024-10-01T10:30:00Z",
  },
  {
    id: 2,
    title: "Annual Exam",
    status: "prepared",
    start_date: "2024-03-15T09:00:00Z", 
    end_date: "2024-03-15T12:00:00Z",
    duration_minutes: 180,
    user_id: "user_1",
    created_at: "2024-02-01T10:30:00Z",
    updated_at: "2024-02-28T10:30:00Z",
  },
  {
    id: 3,
    title: "Monthly Test",
    status: "preparing",
    start_date: "2024-11-20T14:00:00Z",
    end_date: "2024-11-20T16:00:00Z", 
    duration_minutes: 120,
    user_id: "user_1",
    created_at: "2024-09-15T10:30:00Z",
    updated_at: "2024-09-15T10:30:00Z",
  },
];

const mockSubjects: Record<number, ExamSubject[]> = {
  1: [
    {
      id: 1,
      exam_id: 1,
      name: "Physics",
      start_question: 1,
      end_question: 30,
      topics_syllabus: "Mechanics, Thermodynamics, Electricity & Magnetism",
      created_at: "2024-10-01T10:30:00Z",
      updated_at: "2024-10-01T10:30:00Z",
    },
    {
      id: 2,
      exam_id: 1,
      name: "Chemistry", 
      start_question: 31,
      end_question: 60,
      topics_syllabus: "Organic Chemistry, Inorganic Chemistry, Physical Chemistry",
      created_at: "2024-10-01T10:30:00Z",
      updated_at: "2024-10-01T10:30:00Z",
    },
    {
      id: 3,
      exam_id: 1,
      name: "Mathematics",
      start_question: 61,
      end_question: 90,
      topics_syllabus: "Calculus, Algebra, Geometry, Trigonometry",
      created_at: "2024-10-01T10:30:00Z",
      updated_at: "2024-10-01T10:30:00Z",
    },
  ],
  2: [
    {
      id: 4,
      exam_id: 2,
      name: "Physics",
      start_question: 1,
      end_question: 25,
      topics_syllabus: "Optics, Modern Physics, Wave Motion",
      created_at: "2024-02-01T10:30:00Z",
      updated_at: "2024-02-01T10:30:00Z",
    },
    {
      id: 5,
      exam_id: 2,
      name: "Chemistry",
      start_question: 26,
      end_question: 50,
      topics_syllabus: "Coordination Chemistry, Environmental Chemistry",
      created_at: "2024-02-01T10:30:00Z",
      updated_at: "2024-02-01T10:30:00Z",
    },
  ],
  3: [
    {
      id: 6,
      exam_id: 3,
      name: "Biology",
      start_question: 1,
      end_question: 40,
      topics_syllabus: "Cell Biology, Genetics, Evolution, Ecology",
      created_at: "2024-09-15T10:30:00Z",
      updated_at: "2024-09-15T10:30:00Z",
    },
  ],
};

const mockSections: Record<number, ExamSection[]> = {
  1: [
    {
      id: 1,
      exam_id: 1,
      subject_id: 1,
      name: "Part A - MCQ",
      question_start: 1,
      question_end: 15,
      min_questions_to_attempt: 10,
      question_type: "Single Correct MCQ",
      marking_if_attempted: 0,
      marking_if_correct: 4,
      marking_if_incorrect: -1,
      marking_in_any_other_case: -1,
      created_at: "2024-10-01T10:30:00Z",
      updated_at: "2024-10-01T10:30:00Z",
    },
    {
      id: 2,
      exam_id: 1,
      subject_id: 1,
      name: "Part B - Numerical",
      question_start: 16,
      question_end: 30,
      min_questions_to_attempt: 5,
      question_type: "Numerical",
      marking_if_attempted: 0,
      marking_if_correct: 4,
      marking_if_incorrect: 0,
      marking_in_any_other_case: 0,
      created_at: "2024-10-01T10:30:00Z",
      updated_at: "2024-10-01T10:30:00Z",
    },
  ],
  2: [
    {
      id: 3,
      exam_id: 1,
      subject_id: 2,
      name: "Section A",
      question_start: 31,
      question_end: 45,
      min_questions_to_attempt: 12,
      question_type: "Single Correct MCQ",
      marking_if_attempted: 0,
      marking_if_correct: 4,
      marking_if_incorrect: -1,
      marking_in_any_other_case: -1,
      created_at: "2024-10-01T10:30:00Z",
      updated_at: "2024-10-01T10:30:00Z",
    },
  ],
  3: [
    {
      id: 4,
      exam_id: 1,
      subject_id: 3,
      name: "Section I",
      question_start: 61,
      question_end: 75,
      min_questions_to_attempt: 10,
      question_type: "Single Correct MCQ",
      marking_if_attempted: 0,
      marking_if_correct: 4,
      marking_if_incorrect: -1,
      marking_in_any_other_case: -1,
      created_at: "2024-10-01T10:30:00Z",
      updated_at: "2024-10-01T10:30:00Z",
    },
  ],
};

const mockQuestions: Record<string, Question> = {
  "1-1": {
    id: 1,
    exam_id: 1,
    subject: "Physics",
    question_number: 1,
    section_name: "Part A - MCQ",
    question_type: "Single Correct MCQ",
    text: "A particle moves in a circle of radius 5 m with constant speed 10 m/s. What is the magnitude of its centripetal acceleration?",
    options: JSON.stringify(["10 m/s²", "20 m/s²", "25 m/s²", "50 m/s²"]),
    correct_option: "B",
    solution: "Centripetal acceleration = v²/r = (10)²/5 = 100/5 = 20 m/s²",
    created_at: "2024-10-01T10:30:00Z",
    updated_at: "2024-10-01T10:30:00Z",
  },
  "1-2": {
    id: 2,
    exam_id: 1,
    subject: "Physics", 
    question_number: 2,
    section_name: "Part A - MCQ",
    question_type: "Single Correct MCQ",
    text: "The SI unit of electric potential is:",
    options: JSON.stringify(["Ampere", "Volt", "Coulomb", "Ohm"]),
    correct_option: "B",
    solution: "The SI unit of electric potential is Volt (V), named after Alessandro Volta.",
    created_at: "2024-10-01T10:30:00Z",
    updated_at: "2024-10-01T10:30:00Z",
  },
  "1-16": {
    id: 16,
    exam_id: 1,
    subject: "Physics",
    question_number: 16,
    section_name: "Part B - Numerical", 
    question_type: "Numerical",
    text: "A block of mass 2 kg is placed on a rough horizontal surface with coefficient of friction 0.3. If a horizontal force of 10 N is applied, find the acceleration of the block. (g = 10 m/s²)",
    options: null,
    correct_option: "2",
    solution: "Maximum friction = μmg = 0.3 × 2 × 10 = 6 N. Net force = 10 - 6 = 4 N. Acceleration = F/m = 4/2 = 2 m/s²",
    created_at: "2024-10-01T10:30:00Z",
    updated_at: "2024-10-01T10:30:00Z",
  },
};

// Generic mock API hook
export function useMockApi<T>(url: string, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    
    // Simulate API delay
    setTimeout(() => {
      try {
        let result: any = null;
        
        if (url.includes('/api/exams') && !url.includes('/subjects') && !url.includes('/questions')) {
          const status = url.includes('status=prepared') ? 'prepared' : 'preparing';
          result = mockExams.filter(exam => exam.status === status);
        } else if (url.match(/\/api\/exams\/(\d+)$/)) {
          const examId = parseInt(url.match(/\/api\/exams\/(\d+)$/)![1]);
          result = mockExams.find(exam => exam.id === examId);
        } else if (url.match(/\/api\/exams\/(\d+)\/subjects/)) {
          const examId = parseInt(url.match(/\/api\/exams\/(\d+)\/subjects/)![1]);
          result = mockSubjects[examId] || [];
        } else if (url.match(/\/api\/subjects\/(\d+)\/sections/)) {
          const subjectId = parseInt(url.match(/\/api\/subjects\/(\d+)\/sections/)![1]);
          result = mockSections[subjectId] || [];
        } else if (url.match(/\/api\/questions\/(\d+)\?exam_id=(\d+)/)) {
          const match = url.match(/\/api\/questions\/(\d+)\?exam_id=(\d+)/)!;
          const questionNumber = match[1];
          const examId = match[2];
          const key = `${examId}-${questionNumber}`;
          result = mockQuestions[key] || null;
          
          // Parse options if they exist
          if (result?.options) {
            try {
              result = { ...result, options: JSON.parse(result.options) };
            } catch (e) {
              result.options = null;
            }
          }
        }
        
        setData(result);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }, 300); // Simulate network delay
  }, [url, ...dependencies]);

  return { data, loading, error, refetch: () => setLoading(true) };
}

// Mock API utilities
export const mockApi = {
  get: async <T>(_url: string): Promise<T> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    throw new Error('Mock API - GET operations not implemented for demo');
  },

  post: async <T>(url: string, data: any): Promise<T> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url.includes('/api/exams') && !url.includes('/subjects')) {
      // Mock exam creation
      const newExam: Exam = {
        id: Math.max(...mockExams.map(e => e.id)) + 1,
        ...data,
        status: 'preparing',
        user_id: 'user_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockExams.push(newExam);
      return { id: newExam.id, message: 'Exam created successfully' } as T;
    }
    
    return { message: 'Mock operation completed' } as T;
  },

  put: async <T>(url: string, data: any): Promise<T> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (url.match(/\/api\/subjects\/(\d+)/)) {
      const subjectId = parseInt(url.match(/\/api\/subjects\/(\d+)/)![1]);
      // Find and update subject in mock data
      for (const examSubjects of Object.values(mockSubjects)) {
        const subject = examSubjects.find(s => s.id === subjectId);
        if (subject) {
          Object.assign(subject, data, { updated_at: new Date().toISOString() });
          break;
        }
      }
    } else if (url.match(/\/api\/exams\/(\d+)$/)) {
      const examId = parseInt(url.match(/\/api\/exams\/(\d+)$/)![1]);
      // Find and update exam in mock data
      const examIndex = mockExams.findIndex(exam => exam.id === examId);
      if (examIndex !== -1) {
        mockExams[examIndex] = { ...mockExams[examIndex], ...data, updated_at: new Date().toISOString() };
      }
    }
    
    return { message: 'Mock update completed' } as T;
  },

  delete: async <T>(_url: string): Promise<T> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return { message: 'Mock delete completed' } as T;
  },
};
