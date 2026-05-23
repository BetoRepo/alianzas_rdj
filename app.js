const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: '.' }),
  secret: 'scout-venezuela-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(async (req, res, next) => {
  if (req.session.userId) {
    const user = await db.getUserById(req.session.userId);
    req.user = user || null;
  } else {
    req.user = null;
  }
  res.locals.user = req.user;
  res.locals.message = req.session.message || '';
  delete req.session.message;
  next();
});

function requireLogin(req, res, next) {
  if (!req.user) {
    req.session.message = 'Debes iniciar sesión para acceder a esta página.';
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    req.session.message = 'Necesitas permisos de administrador.';
    return res.redirect('/');
  }
  next();
}

app.get('/', async (req, res) => {
  const courses = await db.getCourses();
  res.render('index', { courses });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    req.session.message = 'Todos los campos son obligatorios.';
    return res.redirect('/register');
  }
  const existing = await db.getUserByEmail(email);
  if (existing) {
    req.session.message = 'Ya existe una cuenta con ese correo.';
    return res.redirect('/register');
  }
  const hashed = await bcrypt.hash(password, 10);
  const userId = await db.createUser(name, email, hashed);
  req.session.userId = userId;
  res.redirect('/dashboard');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.getUserByEmail(email);
  if (!user) {
    req.session.message = 'Correo o contraseña incorrecta.';
    return res.redirect('/login');
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    req.session.message = 'Correo o contraseña incorrecta.';
    return res.redirect('/login');
  }
  req.session.userId = user.id;
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/dashboard', requireLogin, async (req, res) => {
  const courses = await db.getCourses();
  const enrolled = await db.getEnrollmentsByUser(req.user.id);
  const enrichedEnrollments = await Promise.all(enrolled.map(async (item) => {
    const sections = await db.getSectionsByCourse(item.course_id);
    const totalSections = sections.length;
    const completedSections = Number(item.completed) ? totalSections : Math.max(0, Number(item.current_section_order || 1) - 1);
    const nextSection = !item.completed && sections[completedSections] ? sections[completedSections].title : null;
    return {
      ...item,
      totalSections,
      progress: totalSections ? Math.round((completedSections / totalSections) * 100) : 0,
      nextSection
    };
  }));
  res.render('dashboard', { courses, enrolled: enrichedEnrollments });
});

app.get('/courses/:id', requireLogin, async (req, res) => {
  const course = await db.getCourse(req.params.id);
  if (!course) {
    return res.status(404).send('Curso no encontrado');
  }
  const enrolled = await db.getEnrollment(req.user.id, course.id);
  if (enrolled) {
    enrolled.completed = Number(enrolled.completed || 0);
    enrolled.current_section_order = Number(enrolled.current_section_order || 1);
  }
  const sections = await db.getSectionsByCourse(course.id) || [];
  const currentSectionIndex = enrolled ? Math.min(Math.max(enrolled.current_section_order - 1, 0), Math.max(sections.length - 1, 0)) : 0;

  res.render('course', {
    course,
    enrolled,
    sections,
    currentSectionIndex,
    selectedAnswers: {},
    quizError: null,
    scoreMessage: null,
    questionResults: {}
  });
});

app.post('/courses/:id/submit', requireLogin, async (req, res) => {
  const course = await db.getCourse(req.params.id);
  if (!course) {
    return res.status(404).send('Curso no encontrado');
  }

  const enrolled = await db.getEnrollment(req.user.id, course.id);
  if (!enrolled) {
    req.session.message = 'Debes inscribirte en el curso antes de responder el quiz.';
    return res.redirect(`/courses/${course.id}`);
  }
  enrolled.completed = Number(enrolled.completed || 0);
  enrolled.current_section_order = Number(enrolled.current_section_order || 1);

  const sections = await db.getSectionsByCourse(course.id) || [];
  const currentSectionIndex = Math.min(Math.max(enrolled.current_section_order - 1, 0), Math.max(sections.length - 1, 0));
  const currentSection = sections[currentSectionIndex] || null;
  const questions = currentSection ? currentSection.questions : [];

  if (!currentSection || questions.length === 0) {
    res.render('course', {
      course,
      enrolled,
      sections,
      currentSectionIndex,
      selectedAnswers: {},
      questionResults: {},
      quizError: 'No hay preguntas disponibles en la sección actual.',
      scoreMessage: null
    });
    return;
  }

  const answers = {};
  for (const key of Object.keys(req.body || {})) {
    if (key.startsWith('answers_')) {
      answers[key.replace('answers_', '')] = req.body[key];
    }
  }

  const passingScore = Number(course.passing_score || 1);
  let score = 0;
  const questionResults = {};

  for (const question of questions) {
    if (question.question_type === 'short-answer') {
      const given = String(answers[question.id] || '').trim();
      const expected = String(question.correct_text || '').trim();
      const isCorrect = given && expected && given.toLowerCase() === expected.toLowerCase();
      questionResults[question.id] = isCorrect ? 'correct' : 'incorrect';
      if (isCorrect) score += 1;
    } else {
      const selectedOptionId = Number(answers[question.id]);
      const correctOption = question.options.find(option => Number(option.is_correct) === 1);
      const isCorrect = selectedOptionId && correctOption && Number(selectedOptionId) === Number(correctOption.id);
      questionResults[question.id] = isCorrect ? 'correct' : 'incorrect';
      question.selectedOptionId = selectedOptionId;
      question.correctOptionId = correctOption ? Number(correctOption.id) : null;
      if (isCorrect) score += 1;
    }
  }

  const requiredScore = questions.length;
  const isSectionPassed = score === requiredScore;

  if (!isSectionPassed) {
    res.render('course', {
      course,
      enrolled,
      sections,
      currentSectionIndex,
      selectedAnswers: answers,
      questionResults,
      quizError: `No pasaste la sección. Obtuviste ${score} de ${requiredScore}. Revisa tus respuestas e intenta de nuevo.`,
      scoreMessage: `Debes lograr al menos ${requiredScore} puntos en esta sección para avanzar.`
    });
    return;
  }

  const nextSectionOrder = enrolled.current_section_order + 1;
  const hasMoreSections = nextSectionOrder <= sections.length;

  if (hasMoreSections) {
    await db.updateEnrollmentSection(req.user.id, course.id, nextSectionOrder);
    enrolled.current_section_order = nextSectionOrder;
    res.render('course', {
      course,
      enrolled,
      sections,
      currentSectionIndex: enrolled.current_section_order - 1,
      selectedAnswers: {},
      questionResults: {},
      scoreMessage: `¡Sección completada! Continúa con la siguiente sección.`,
      quizSuccess: null
    });
    return;
  }

  await db.completeCourse(req.user.id, course.id);
  enrolled.completed = 1;
  enrolled.completed_at = new Date().toISOString();

  res.render('course', {
    course,
    enrolled,
    sections,
    currentSectionIndex,
    selectedAnswers: answers,
    questionResults,
    quizSuccess: '¡Has finalizado el curso! Ahora puedes descargar tu certificado.',
    certificateUrl: `/certificate/${course.id}`
  });
});

app.post('/courses/:id/enroll', requireLogin, async (req, res) => {
  const course = await db.getCourse(req.params.id);
  if (!course) {
    return res.status(404).send('Curso no encontrado');
  }
  await db.enrollUser(req.user.id, course.id);
  req.session.message = 'Te has inscrito en el curso.';
  res.redirect('/dashboard');
});

app.post('/courses/:id/complete', requireLogin, async (req, res) => {
  const course = await db.getCourse(req.params.id);
  if (!course) {
    return res.status(404).send('Curso no encontrado');
  }
  await db.completeCourse(req.user.id, course.id);
  req.session.message = 'Has completado el curso. Puedes descargar tu certificado.';
  res.redirect(`/certificate/${course.id}`);
});

app.get('/certificate/:id', requireLogin, async (req, res) => {
  const course = await db.getCourse(req.params.id);
  if (!course) {
    return res.status(404).send('Curso no encontrado');
  }
  const enrollment = await db.getEnrollment(req.user.id, course.id);
  if (!enrollment || !enrollment.completed) {
    req.session.message = 'Debes completar el curso para ver el certificado.';
    return res.redirect(`/courses/${course.id}`);
  }
  res.render('certificate', { course, user: req.user, completedAt: enrollment.completed_at });
});

app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const courses = await db.getCourses();
    const userCountRow = await db.getUserCount();
    const courseCountRow = await db.getCourseCount();
    const enrollmentCountRow = await db.getEnrollmentCount();
    const completedCountRow = await db.getCompletedEnrollmentCount();
    const totalEnrollments = Number(enrollmentCountRow?.count || 0);
    const completedEnrollments = Number(completedCountRow?.count || 0);
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    res.render('admin', {
      courses,
      userCount: Number(userCountRow?.count || 0),
      courseCount: Number(courseCountRow?.count || 0),
      completedEnrollments,
      completionRate
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    const courses = await db.getCourses().catch(() => []);
    res.render('admin', {
      courses,
      userCount: 0,
      courseCount: 0,
      completedEnrollments: 0,
      completionRate: 0
    });
  }
});

app.post('/admin/create', requireAdmin, async (req, res) => {
  const { title, description, content, video_url, passing_score } = req.body;
  const sectionsInput = req.body.sections || {};
  const sections = Array.isArray(sectionsInput) ? sectionsInput : Object.values(sectionsInput || {});
  const questionsInput = req.body.questions || {};
  const questions = Array.isArray(questionsInput) ? questionsInput : Object.values(questionsInput || {});
  const parsedPassingScore = Number(passing_score) || 1;

  if (!title || !description || !content) {
    req.session.message = 'Título, descripción y contenido son obligatorios.';
    return res.redirect('/admin');
  }

  if (sections.length === 0) {
    req.session.message = 'Debes agregar al menos una sección para el curso.';
    return res.redirect('/admin');
  }

  if (questions.length === 0) {
    req.session.message = 'Debes agregar al menos una pregunta para que el curso sea respondible.';
    return res.redirect('/admin');
  }

  const courseId = await db.createCourse(title, description, content, video_url, parsedPassingScore);
  const sectionIdsByIndex = {};
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    if (!section || !section.title) continue;
    const orderIndex = index + 1;
    const sectionId = await db.createSection(courseId, section.title, section.content || '', orderIndex);
    sectionIdsByIndex[String(orderIndex)] = sectionId;
  }

  for (const question of questions) {
    if (!question || !question.text) {
      continue;
    }

    const questionType = question.type || 'multiple-choice';
    const correctText = questionType === 'short-answer' ? question.answer : null;
    const sectionIndex = String(question.section || '1');
    const sectionId = sectionIdsByIndex[sectionIndex] || null;
    const questionId = await db.createQuestion(courseId, question.text, questionType, correctText, sectionId);
    const options = Array.isArray(question.options) ? question.options : Object.values(question.options || {});
    const correctIndex = typeof question.correct !== 'undefined' ? String(question.correct) : null;

    if (questionType !== 'short-answer') {
      if (questionType === 'true-false' && options.length < 2) {
        options.splice(0, options.length, 'Verdadero', 'Falso');
      }
      for (let index = 0; index < options.length; index += 1) {
        const optionText = options[index];
        if (!optionText) continue;
        await db.createQuestionOption(questionId, optionText, correctIndex === String(index));
      }
    }
  }

  req.session.message = 'Curso creado correctamente con multimedia y preguntas.';
  res.redirect('/admin');
});

app.get('/admin/users', requireAdmin, async (req, res) => {
  const users = await db.getAllUsers();
  res.render('admin_users', { users });
});

app.post('/admin/users/create', requireAdmin, async (req, res) => {
  const { name, email, password, is_admin } = req.body;
  if (!name || !email || !password) {
    req.session.message = 'Todos los campos son obligatorios.';
    return res.redirect('/admin/users');
  }
  const existing = await db.getUserByEmail(email);
  if (existing) {
    req.session.message = 'Ya existe una cuenta con ese correo.';
    return res.redirect('/admin/users');
  }
  const hashed = await bcrypt.hash(password, 10);
  const isAdmin = is_admin === 'on' ? 1 : 0;
  await db.createUser(name, email, hashed, isAdmin);
  req.session.message = 'Usuario creado correctamente.';
  res.redirect('/admin/users');
});

app.post('/admin/users/:id/delete', requireAdmin, async (req, res) => {
  const userId = req.params.id;
  if (userId == req.user.id) {
    req.session.message = 'No puedes eliminar tu propia cuenta.';
    return res.redirect('/admin/users');
  }
  await db.deleteUser(userId);
  req.session.message = 'Usuario eliminado correctamente.';
  res.redirect('/admin/users');
});

app.post('/admin/courses/:id/delete', requireAdmin, async (req, res) => {
  const courseId = req.params.id;
  await db.deleteCourse(courseId);
  req.session.message = 'Curso eliminado correctamente.';
  res.redirect('/admin');
});

app.listen(port, () => {
  console.log(`Aula virtual funcionando en http://localhost:${port}`);
});
