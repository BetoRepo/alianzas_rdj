const db = require('./db');
(async () => {
  try {
    const courses = await db.getCourses();
    console.log('courses', courses);
    for (const course of courses) {
      const qs = await db.getQuestionsByCourse(course.id);
      console.log('course', course.id, course.title, 'questions', qs.length);
      for (const q of qs) {
        console.log(' q', q.id, q.question_text, q.question_type, q.correct_text, 'options', q.options.length);
        console.log(' options', q.options.map(o => ({ id: o.id, text: o.text, is_correct: o.is_correct })));
      }
    }
  } catch (err) {
    console.error(err);
  }
})();