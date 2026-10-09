const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'students.json');

// Cấu hình EJS và static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Khởi tạo file data/students.json nếu chưa tồn tại
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = [
      {
        id: 'std-1',
        name: 'Nguyễn Văn An',
        email: 'an.nguyen@example.com',
        dateOfBirth: '2003-05-15',
        className: 'SE1'
      },
      {
        id: 'std-2',
        name: 'Trần Thị Bích',
        email: 'bich.tran@example.com',
        dateOfBirth: '2003-08-22',
        className: 'IT2'
      },
      {
        id: 'std-3',
        name: 'Lê Hoàng Cường',
        email: 'cuong.le@example.com',
        dateOfBirth: '2002-11-10',
        className: 'SE1'
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

// Đọc danh sách sinh viên từ JSON
function readStudents() {
  ensureDataFile();
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(content);
  } catch (err) {
    console.error('Lỗi phân tích cú pháp JSON:', err);
    return [];
  }
}

// Ghi danh sách sinh viên vào JSON
function saveStudents(students) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf-8');
}

// Lấy danh sách tên lớp duy nhất (chuẩn hóa không trùng logic)
function getUniqueClasses(students) {
  const map = new Map();
  students.forEach(s => {
    if (s.className && typeof s.className === 'string') {
      const trimmed = s.className.trim();
      if (trimmed) {
        const key = trimmed.toLowerCase();
        if (!map.has(key)) {
          map.set(key, trimmed);
        }
      }
    }
  });
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

// Kiểm tra định dạng ngày YYYY-MM-DD và tính hợp lệ lịch
function parseAndValidateDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return { year, month, day, dateObj: d };
}

// Kiểm tra sinh viên có đủ 17 tuổi hay không tính đến hôm nay
// Cộng 17 năm vào ngày sinh. Xử lý trường hợp 29/02: năm không nhuận kỷ niệm ngày 28/02.
function isAtLeast17YearsOld(year, month, day) {
  const targetYear = year + 17;
  let targetMonth = month;
  let targetDay = day;

  if (month === 2 && day === 29) {
    // Kiểm tra targetYear có phải năm nhuận không
    const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
    if (!isLeap) {
      targetDay = 28; // Trong năm không nhuận kỷ niệm vào ngày 28/02
    }
  }

  const seventeenthBirthday = new Date(targetYear, targetMonth - 1, targetDay);
  seventeenthBirthday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today >= seventeenthBirthday;
}

// ROUTE 1: GET /students
app.get('/students', (req, res) => {
  try {
    const students = readStudents();
    const uniqueClasses = getUniqueClasses(students);
    const selectedClass = req.query.className ? req.query.className.trim() : '';
    
    let filteredStudents = students;
    let notFoundClassMessage = null;

    if (selectedClass) {
      const normalizedQuery = selectedClass.toLowerCase();
      const classExists = uniqueClasses.some(c => c.toLowerCase() === normalizedQuery);
      if (!classExists) {
        notFoundClassMessage = 'Không tìm thấy lớp phù hợp.';
        filteredStudents = [];
      } else {
        filteredStudents = students.filter(s => 
          s.className && s.className.trim().toLowerCase() === normalizedQuery
        );
      }
    }

    const successMessage = req.query.success === 'created' ? 'Thêm sinh viên thành công!' : null;

    res.render('students', {
      students: filteredStudents,
      allClasses: uniqueClasses,
      selectedClass: selectedClass,
      successMessage: successMessage,
      errorMessage: notFoundClassMessage,
      displayCount: filteredStudents.length,
      formData: {},
      errors: {}
    });
  } catch (error) {
    console.error('Lỗi khi tải trang sinh viên:', error);
    res.status(500).send('Đã xảy ra lỗi nội bộ.');
  }
});

// ROUTE 2: POST /students
app.post('/students', (req, res) => {
  const rawBody = req.body || {};
  const name = (rawBody.name || '').trim();
  const email = (rawBody.email || '').trim();
  const dateOfBirth = (rawBody.dateOfBirth || '').trim();
  const className = (rawBody.className || '').trim();

  const formData = {
    name: rawBody.name || '',
    email: rawBody.email || '',
    dateOfBirth: rawBody.dateOfBirth || '',
    className: rawBody.className || ''
  };

  let students = [];
  try {
    students = readStudents();
  } catch (err) {
    console.error('Lỗi đọc file JSON trong POST:', err);
    return res.status(500).render('students', {
      students: [],
      allClasses: [],
      selectedClass: '',
      successMessage: null,
      errorMessage: 'Không thể đọc cơ sở dữ liệu file.',
      displayCount: 0,
      formData: formData,
      errors: {}
    });
  }

  const uniqueClasses = getUniqueClasses(students);
  const errors = {};

  // 1. Kiểm tra Name
  if (!name) {
    errors.name = 'Vui lòng nhập họ và tên.';
  }

  // 2. Kiểm tra Email
  if (!email) {
    errors.email = 'Vui lòng nhập email.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email không hợp lệ.';
  } else if (students.some(s => s.email && s.email.trim().toLowerCase() === email.toLowerCase())) {
    errors.email = 'Email này đã tồn tại.';
  }

  // 3. Kiểm tra Ngày sinh & Độ tuổi (từ đủ 17 tuổi)
  if (!dateOfBirth) {
    errors.dateOfBirth = 'Ngày sinh không hợp lệ.';
  } else {
    const parsedDate = parseAndValidateDate(dateOfBirth);
    if (!parsedDate) {
      errors.dateOfBirth = 'Ngày sinh không hợp lệ.';
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (parsedDate.dateObj > today) {
        errors.dateOfBirth = 'Ngày sinh không hợp lệ.';
      } else if (!isAtLeast17YearsOld(parsedDate.year, parsedDate.month, parsedDate.day)) {
        errors.dateOfBirth = 'Sinh viên phải đủ 17 tuổi trở lên.';
      }
    }
  }

  // 4. Kiểm tra Lớp
  if (!className) {
    errors.className = 'Vui lòng nhập lớp.';
  }

  const hasErrors = Object.keys(errors).length > 0;

  // Nếu có bất kỳ lỗi nào:
  // Render lại students.ejs, giữ nguyên formData, hiển thị errors, không ghi file, không redirect
  if (hasErrors) {
    return res.render('students', {
      students: students,
      allClasses: uniqueClasses,
      selectedClass: '',
      successMessage: null,
      errorMessage: 'Vui lòng kiểm tra và sửa các thông tin bị lỗi bên dưới.',
      displayCount: students.length,
      formData: formData,
      errors: errors
    });
  }

  // Thành công: tạo sinh viên mới và lưu JSON
  try {
    const newStudent = {
      id: 'std-' + Date.now(),
      name: name,
      email: email,
      dateOfBirth: dateOfBirth,
      className: className
    };

    students.push(newStudent);
    saveStudents(students);

    // PRG: redirect 303 về GET /students
    return res.redirect(303, '/students?success=created');
  } catch (err) {
    console.error('Lỗi khi ghi dữ liệu sinh viên:', err);
    return res.render('students', {
      students: students,
      allClasses: uniqueClasses,
      selectedClass: '',
      successMessage: null,
      errorMessage: 'Lỗi hệ thống khi lưu sinh viên. Vui lòng thử lại.',
      displayCount: students.length,
      formData: formData,
      errors: errors
    });
  }
});

// Chuyển hướng route gốc / về /students để tiện trải nghiệm
app.get('/', (req, res) => {
  res.redirect('/students');
});

// Khởi chạy server nếu chạy trực tiếp
if (require.main === module) {
  ensureDataFile();
  app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}/students`);
  });
}

module.exports = app;
