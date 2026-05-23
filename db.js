const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    video_url TEXT,
    passing_score INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  db.all(`PRAGMA table_info(courses)`, (err, rows) => {
    if (!err) {
      const hasVideo = rows.some(row => row.name === 'video_url');
      if (!hasVideo) {
        db.run(`ALTER TABLE courses ADD COLUMN video_url TEXT`);
      }
      const hasPassingScore = rows.some(row => row.name === 'passing_score');
      if (!hasPassingScore) {
        db.run(`ALTER TABLE courses ADD COLUMN passing_score INTEGER NOT NULL DEFAULT 1`);
      }
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS course_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS course_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    section_id INTEGER,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'multiple-choice',
    correct_text TEXT,
    FOREIGN KEY(course_id) REFERENCES courses(id),
    FOREIGN KEY(section_id) REFERENCES course_sections(id)
  )`);

  db.all(`PRAGMA table_info(course_questions)`, (err, rows) => {
    if (!err) {
      const hasSection = rows.some(row => row.name === 'section_id');
      if (!hasSection) {
        db.run(`ALTER TABLE course_questions ADD COLUMN section_id INTEGER`);
      }
      const hasType = rows.some(row => row.name === 'question_type');
      if (!hasType) {
        db.run(`ALTER TABLE course_questions ADD COLUMN question_type TEXT NOT NULL DEFAULT 'multiple-choice'`);
      }
      const hasCorrectText = rows.some(row => row.name === 'correct_text');
      if (!hasCorrectText) {
        db.run(`ALTER TABLE course_questions ADD COLUMN correct_text TEXT`);
      }
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS question_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(question_id) REFERENCES course_questions(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_section_order INTEGER NOT NULL DEFAULT 1,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    UNIQUE(user_id, course_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(course_id) REFERENCES courses(id)
  )`);

  db.all(`PRAGMA table_info(enrollments)`, (err, rows) => {
    if (!err) {
      const hasCurrentSection = rows.some(row => row.name === 'current_section_order');
      if (!hasCurrentSection) {
        db.run(`ALTER TABLE enrollments ADD COLUMN current_section_order INTEGER NOT NULL DEFAULT 1`);
      }
    }
  });

  db.get(`SELECT COUNT(*) AS count FROM users WHERE is_admin = 1`, (err, row) => {
    if (!err && row.count === 0) {
      bcrypt.hash('admin123', 10).then(hashed => {
        db.run(`INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)`,
          ['Admin Scout Venezuela', 'admin@scoutvenezuela.org', hashed]);
      });
    }
  });
});

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

module.exports = {
  getUserById(id) {
    return get(`SELECT * FROM users WHERE id = ?`, [id]);
  },
  getUserByEmail(email) {
    return get(`SELECT * FROM users WHERE email = ?`, [email]);
  },
  createUser(name, email, password, isAdmin = 0) {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)`, [name, email, password, isAdmin], function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },
  getCourses() {
    return query(`SELECT * FROM courses ORDER BY created_at DESC`);
  },
  getCourse(id) {
    return get(`SELECT * FROM courses WHERE id = ?`, [id]);
  },
  createCourse(title, description, content, videoUrl, passingScore = 1) {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO courses (title, description, content, video_url, passing_score) VALUES (?, ?, ?, ?, ?)`, [title, description, content, videoUrl, passingScore], function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },
  createQuestion(courseId, questionText, questionType = 'multiple-choice', correctText = null, sectionId = null) {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO course_questions (course_id, section_id, question_text, question_type, correct_text) VALUES (?, ?, ?, ?, ?)`, [courseId, sectionId, questionText, questionType, correctText], function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },
  createQuestionOption(questionId, text, isCorrect) {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO question_options (question_id, text, is_correct) VALUES (?, ?, ?)`, [questionId, text, isCorrect ? 1 : 0], function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },
  createSection(courseId, title, content, orderIndex = 1) {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO course_sections (course_id, title, content, order_index) VALUES (?, ?, ?, ?)`, [courseId, title, content, orderIndex], function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },
  getSectionsByCourse(courseId) {
    return new Promise(async (resolve, reject) => {
      try {
        let sections = await query(`SELECT * FROM course_sections WHERE course_id = ? ORDER BY order_index ASC`, [courseId]);
        if (sections.length === 0) {
          const questions = await query(`SELECT * FROM course_questions WHERE course_id = ? ORDER BY id ASC`, [courseId]);
          for (const question of questions) {
            question.options = await query(`SELECT * FROM question_options WHERE question_id = ?`, [question.id]);
          }
          if (questions.length === 0) {
            return resolve([]);
          }
          sections = [{
            id: null,
            course_id: courseId,
            title: 'Sección 1',
            content: '',
            order_index: 1,
            questions
          }];
          return resolve(sections);
        }

        for (const section of sections) {
          section.questions = await query(`SELECT * FROM course_questions WHERE section_id = ? ORDER BY id ASC`, [section.id]);
          for (const question of section.questions) {
            question.options = await query(`SELECT * FROM question_options WHERE question_id = ?`, [question.id]);
          }
        }

        const unassignedQuestions = await query(`SELECT * FROM course_questions WHERE course_id = ? AND section_id IS NULL ORDER BY id ASC`, [courseId]);
        if (unassignedQuestions.length > 0 && sections.length > 0) {
          for (const question of unassignedQuestions) {
            question.options = await query(`SELECT * FROM question_options WHERE question_id = ?`, [question.id]);
          }
          sections[0].questions = sections[0].questions.concat(unassignedQuestions);
        }

        resolve(sections);
      } catch (error) {
        reject(error);
      }
    });
  },
  enrollUser(userId, courseId) {
    return new Promise((resolve, reject) => {
      db.run(`INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)`, [userId, courseId], function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },
  getEnrollmentsByUser(userId) {
    return query(`SELECT e.*, c.title FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = ?`, [userId]);
  },
  getEnrollment(userId, courseId) {
    return get(`SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?`, [userId, courseId]);
  },
  updateEnrollmentSection(userId, courseId, sectionOrder) {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE enrollments SET current_section_order = ? WHERE user_id = ? AND course_id = ?`, [sectionOrder, userId, courseId], function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
  },
  completeCourse(userId, courseId) {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE enrollments SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND course_id = ?`, [userId, courseId], function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
  },
  getAllUsers() {
    return query(`SELECT id, name, email, is_admin FROM users ORDER BY name`);
  },
  getUserCount() {
    return get(`SELECT COUNT(*) AS count FROM users`, []);
  },
  getCourseCount() {
    return get(`SELECT COUNT(*) AS count FROM courses`, []);
  },
  getEnrollmentCount() {
    return get(`SELECT COUNT(*) AS count FROM enrollments`, []);
  },
  getCompletedEnrollmentCount() {
    return get(`SELECT COUNT(*) AS count FROM enrollments WHERE completed = 1`, []);
  },
  deleteUser(userId) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM users WHERE id = ?`, [userId], function(err) {
        if (err) return reject(err);
        resolve();
      });
    });
  },
  deleteCourse(courseId) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`DELETE FROM question_options WHERE question_id IN (SELECT id FROM course_questions WHERE course_id = ?)`, [courseId]);
        db.run(`DELETE FROM course_questions WHERE course_id = ?`, [courseId]);
        db.run(`DELETE FROM enrollments WHERE course_id = ?`, [courseId]);
        db.run(`DELETE FROM courses WHERE id = ?`, [courseId], function(err) {
          if (err) return reject(err);
          db.get(`SELECT COUNT(*) AS count, MAX(id) AS maxId FROM courses`, [], (err2, row) => {
            if (err2) return reject(err2);
            if (!row || row.count === 0) {
              db.run(`DELETE FROM sqlite_sequence WHERE name = 'courses'`, [], (err3) => {
                if (err3) return reject(err3);
                resolve();
              });
            } else {
              db.run(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'courses'`, [row.maxId], (err3) => {
                if (err3) return reject(err3);
                resolve();
              });
            }
          });
        });
      });
    });
  }
};
