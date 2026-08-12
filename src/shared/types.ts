import z from "zod";

// Exam schema
export const ExamSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.enum(['preparing', 'prepared']),
  start_date: z.string(),
  end_date: z.string(),
  duration_minutes: z.number(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateExamSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  start_date: z.string(),
  end_date: z.string(),
  duration_minutes: z.number().min(1, "Duration must be at least 1 minute"),
  subjects: z.array(z.object({
    name: z.string().min(1, "Subject name is required"),
    start_question: z.number().min(1, "Start question must be at least 1"),
    end_question: z.number().min(1, "End question must be at least 1"),
  })),
});

// Subject schema
export const ExamSubjectSchema = z.object({
  id: z.number(),
  exam_id: z.number(),
  name: z.string(),
  start_question: z.number(),
  end_question: z.number(),
  topics_syllabus: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  start_question: z.number().min(1, "Start question must be at least 1"),
  end_question: z.number().min(1, "End question must be at least 1"),
  topics_syllabus: z.string().optional(),
});

// Marking Scheme Types
export const MarkingSchemeSchema = z.object({
  // Common fields
  max_marks: z.number(),
  negative_marking_percentage: z.number().min(0).max(100).optional(), // Legacy field
  negative_marks: z.number().min(0).optional(), // New field for negative marks

  // MCQ specific
  partial_marking: z.boolean().optional(), // For multiple correct MCQ
  marks_per_correct_option: z.number().optional(), // For partial marking

  // Numerical specific
  tolerance_range: z.number().optional(), // ±tolerance for numerical answers
  decimal_precision: z.number().optional(), // Decimal places for rounding

  // Subjective specific
  manual_grading: z.boolean().optional(), // Always true for subjective
});

// Section schema
export const ExamSectionSchema = z.object({
  id: z.number(),
  exam_id: z.number(),
  subject_id: z.number(),
  name: z.string(),
  question_start: z.number(),
  question_end: z.number(),
  min_questions_to_attempt: z.number(),
  question_type: z.enum(['Single Correct MCQ', 'Multiple Correct MCQ', 'Numerical', 'Subjective', 'True/False', 'Fill in the Blanks']),
  marking_scheme: MarkingSchemeSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  question_start: z.number().min(1, "Start question must be at least 1"),
  question_end: z.number().min(1, "End question must be at least 1"),
  min_questions_to_attempt: z.number().min(0, "Minimum questions cannot be negative"),
  question_type: z.enum(['Single Correct MCQ', 'Multiple Correct MCQ', 'Numerical', 'Subjective', 'True/False', 'Fill in the Blanks']),
  marking_scheme: MarkingSchemeSchema,
});

// Question Image schema
export const QuestionImageSchema = z.object({
  id: z.number(),
  image: z.string(),
  caption: z.string().optional(),
  order: z.number().default(1),
});

export type QuestionImage = z.infer<typeof QuestionImageSchema>;

// Question schema
export const QuestionSchema = z.object({
  id: z.number(),
  exam_id: z.number(),
  subject: z.string(),
  question_number: z.number(),
  section_name: z.string(),
  question_type: z.enum(['Single Correct MCQ', 'Multiple Correct MCQ', 'Numerical', 'Subjective', 'True/False', 'Fill in the Blanks']),
  text: z.string(),
  options: z.array(z.string()).nullable(), // Array for multiple options
  correct_options: z.array(z.string()).nullable(), // Array for multiple correct answers
  correct_answer: z.string().nullable(), // For single correct answer
  numerical_answer: z.number().nullable(), // For numerical questions
  tolerance_range: z.number().nullable(), // For numerical questions
  solution: z.string().nullable(),
  images: z.array(QuestionImageSchema).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateQuestionSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  question_number: z.number().min(1, "Question number must be at least 1"),
  section_name: z.string().min(1, "Section name is required"),
  question_type: z.enum(['Single Correct MCQ', 'Multiple Correct MCQ', 'Numerical', 'Subjective', 'True/False', 'Fill in the Blanks']),
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).optional(),
  correct_options: z.array(z.string()).optional(), // For multiple correct MCQ
  correct_answer: z.string().optional(), // For single correct MCQ
  numerical_answer: z.number().optional(), // For numerical questions
  tolerance_range: z.number().optional(), // For numerical questions
  solution: z.string().optional(),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial();

// Type exports
export type Exam = z.infer<typeof ExamSchema>;
export type CreateExam = z.infer<typeof CreateExamSchema>;
export type ExamSubject = z.infer<typeof ExamSubjectSchema>;
export type CreateSubject = z.infer<typeof CreateSubjectSchema>;
export type MarkingScheme = z.infer<typeof MarkingSchemeSchema>;
export type ExamSection = z.infer<typeof ExamSectionSchema>;
export type CreateSection = z.infer<typeof CreateSectionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type CreateQuestion = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestion = z.infer<typeof UpdateQuestionSchema>;
