
CREATE TABLE exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'preparing',
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exam_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_question INTEGER NOT NULL,
  end_question INTEGER NOT NULL,
  topics_syllabus TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exam_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  question_start INTEGER NOT NULL,
  question_end INTEGER NOT NULL,
  min_questions_to_attempt INTEGER NOT NULL,
  question_type TEXT NOT NULL,
  marking_if_attempted INTEGER DEFAULT 0,
  marking_if_correct INTEGER DEFAULT 4,
  marking_if_incorrect INTEGER DEFAULT -1,
  marking_in_any_other_case INTEGER DEFAULT -1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  section_name TEXT NOT NULL,
  question_type TEXT NOT NULL,
  text TEXT NOT NULL,
  options TEXT,
  correct_option TEXT,
  solution TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exam_subjects_exam_id ON exam_subjects(exam_id);
CREATE INDEX idx_exam_sections_exam_id ON exam_sections(exam_id);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_questions_subject ON questions(subject);
