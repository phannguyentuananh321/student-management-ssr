const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./app');

const PORT = 3002; // Dùng port riêng để test
const DATA_FILE = path.join(__dirname, 'data', 'students.json');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function resetToInitialData() {
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

async function runNewTests() {
  resetToInitialData();
  const server = app.listen(PORT);
  console.log('--- BẮT ĐẦU CHẠY KIỂM THỬ BỔ SUNG: GIỮ FORM & TUỔI 18+ ---');

  const results = [];

  try {
    // -------------------------------------------------------------
    // Test N1: Nhập tên, email, ngày sinh, lớp; để trống 1 trường và gửi form -> các trường còn lại giữ nguyên
    // -------------------------------------------------------------
    console.log('\nChạy Test N1...');
    const postDataN1 = new URLSearchParams({
      name: 'Ngô Bá Khá',
      email: '', // để trống email
      dateOfBirth: '2003-04-12',
      className: 'SE-TEST'
    }).toString();

    const resN1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataN1)
      }
    }, postDataN1);

    const testN1_pass = resN1.statusCode === 200 &&
                        resN1.body.includes('value="Ngô Bá Khá"') &&
                        resN1.body.includes('value="2003-04-12"') &&
                        resN1.body.includes('value="SE-TEST"') &&
                        resN1.body.includes('Vui lòng nhập email.') &&
                        resN1.body.includes('aria-invalid="true"');

    results.push({
      id: 'N1',
      name: 'Để trống 1 trường: các trường khác giữ nguyên',
      status: testN1_pass ? 'PASS' : 'FAIL',
      note: 'Để trống email: Name, DateOfBirth, ClassName giữ nguyên trong input value, báo lỗi tại email với aria-invalid'
    });

    // -------------------------------------------------------------
    // Test N2: Nhập email sai định dạng: chỉ cần sửa email, các trường khác không bị mất
    // -------------------------------------------------------------
    console.log('Chạy Test N2...');
    const postDataN2 = new URLSearchParams({
      name: 'Trần Văn Nam',
      email: 'invalid-email-format',
      dateOfBirth: '2004-06-18',
      className: 'SE2'
    }).toString();

    const resN2 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataN2)
      }
    }, postDataN2);

    const testN2_pass = resN2.statusCode === 200 &&
                        resN2.body.includes('value="Trần Văn Nam"') &&
                        resN2.body.includes('value="invalid-email-format"') &&
                        resN2.body.includes('value="2004-06-18"') &&
                        resN2.body.includes('value="SE2"') &&
                        resN2.body.includes('Email không hợp lệ.');

    results.push({
      id: 'N2',
      name: 'Email sai định dạng: giữ nguyên form và báo lỗi tại email',
      status: testN2_pass ? 'PASS' : 'FAIL',
      note: 'Email sai định dạng: giữ nguyên toàn bộ form, hiển thị lỗi "Email không hợp lệ."'
    });

    // -------------------------------------------------------------
    // Test N3: Nhập email đã tồn tại: giữ lại dữ liệu form và thông báo đúng trường email
    // -------------------------------------------------------------
    console.log('Chạy Test N3...');
    const postDataN3 = new URLSearchParams({
      name: 'Người Trùng Email',
      email: 'an.nguyen@example.com', // đã có trong mẫu
      dateOfBirth: '2004-01-01',
      className: 'IT3'
    }).toString();

    const resN3 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataN3)
      }
    }, postDataN3);

    const testN3_pass = resN3.statusCode === 200 &&
                        resN3.body.includes('value="Người Trùng Email"') &&
                        resN3.body.includes('value="an.nguyen@example.com"') &&
                        resN3.body.includes('value="2004-01-01"') &&
                        resN3.body.includes('value="IT3"') &&
                        resN3.body.includes('Email này đã tồn tại.');

    results.push({
      id: 'N3',
      name: 'Email đã tồn tại: giữ lại dữ liệu form và báo lỗi email',
      status: testN3_pass ? 'PASS' : 'FAIL',
      note: 'Email trùng: giữ nguyên tất cả input, hiển thị lỗi "Email này đã tồn tại."'
    });

    // -------------------------------------------------------------
    // Test N4: Nhập ngày sinh chưa đủ 18 tuổi: từ chối lưu, giữ form, thông báo lỗi tại ngày sinh
    // -------------------------------------------------------------
    console.log('Chạy Test N4...');
    const postDataN4 = new URLSearchParams({
      name: 'Học sinh 15 tuổi',
      email: 'hs15@example.com',
      dateOfBirth: '2011-05-10', // 15 tuổi vào 2026
      className: 'SE1'
    }).toString();

    const resN4 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataN4)
      }
    }, postDataN4);

    const testN4_pass = resN4.statusCode === 200 &&
                        resN4.body.includes('value="Học sinh 15 tuổi"') &&
                        resN4.body.includes('value="hs15@example.com"') &&
                        resN4.body.includes('value="2011-05-10"') &&
                        resN4.body.includes('Sinh viên phải đủ 18 tuổi trở lên.');

    results.push({
      id: 'N4',
      name: 'Chưa đủ 18 tuổi: từ chối, giữ form, báo lỗi tại ngày sinh',
      status: testN4_pass ? 'PASS' : 'FAIL',
      note: 'Sinh 2011 (15 tuổi): từ chối, báo lỗi "Sinh viên phải đủ 18 tuổi trở lên.", giữ nguyên toàn bộ form'
    });

    // -------------------------------------------------------------
    // Test N5: Nhập ngày sinh hợp lệ và đủ 18 tuổi: cho phép tạo sinh viên
    // -------------------------------------------------------------
    console.log('Chạy Test N5...');
    const postDataN5 = new URLSearchParams({
      name: 'Đoàn Văn Vượng',
      email: 'vuong.doan@example.com',
      dateOfBirth: '2005-02-14', // 21 tuổi vào 2026
      className: 'SE1'
    }).toString();

    const resN5 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataN5)
      }
    }, postDataN5);

    const testN5_pass = (resN5.statusCode === 303 || resN5.statusCode === 302) &&
                        resN5.headers.location === '/students?success=created';

    results.push({
      id: 'N5',
      name: 'Đủ 18 tuổi hợp lệ: cho phép tạo sinh viên (PRG 303)',
      status: testN5_pass ? 'PASS' : 'FAIL',
      note: 'Sinh 2005 (21 tuổi): hợp lệ, lưu JSON thành công và redirect 303 sang /students?success=created'
    });

    // -------------------------------------------------------------
    // Test N6: Sinh viên vừa đủ 18 tuổi vào HÔM NAY (2026-10-09 - 18 năm = 2008-10-09)
    // -------------------------------------------------------------
    console.log('Chạy Test N6...');
    const today = new Date();
    const exact18BirthYear = today.getFullYear() - 18;
    const exact18BirthMonth = String(today.getMonth() + 1).padStart(2, '0');
    const exact18BirthDay = String(today.getDate()).padStart(2, '0');
    const exact18DateStr = `${exact18BirthYear}-${exact18BirthMonth}-${exact18BirthDay}`;

    const postDataN6 = new URLSearchParams({
      name: 'Vừa Đúng 18 Tuổi Hôm Nay',
      email: 'exact18@example.com',
      dateOfBirth: exact18DateStr,
      className: 'IT1'
    }).toString();

    const resN6 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataN6)
      }
    }, postDataN6);

    const testN6_pass = (resN6.statusCode === 303 || resN6.statusCode === 302) &&
                        resN6.headers.location === '/students?success=created';

    results.push({
      id: 'N6',
      name: 'Vừa tròn đúng 18 tuổi hôm nay: ĐƯỢC CHẤP NHẬN',
      status: testN6_pass ? 'PASS' : 'FAIL',
      note: `Sinh ngày ${exact18DateStr} (tròn 18 tuổi hôm nay): được chấp nhận thành công và redirect 303`
    });

    // -------------------------------------------------------------
    // Test N7: Sinh viên còn thiếu đúng 1 ngày mới đủ 18 tuổi (ví dụ ngày mai mới tới sinh nhật: 2008-10-10)
    // -------------------------------------------------------------
    console.log('Chạy Test N7...');
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const minus1DayBirthYear = tomorrowDate.getFullYear() - 18;
    const minus1DayBirthMonth = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
    const minus1DayBirthDay = String(tomorrowDate.getDate()).padStart(2, '0');
    const minus1DayDateStr = `${minus1DayBirthYear}-${minus1DayBirthMonth}-${minus1DayBirthDay}`;

    const postDataN7 = new URLSearchParams({
      name: 'Thiếu 1 Ngày 18 Tuổi',
      email: 'missing1day@example.com',
      dateOfBirth: minus1DayDateStr,
      className: 'IT1'
    }).toString();

    const resN7 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataN7)
      }
    }, postDataN7);

    const testN7_pass = resN7.statusCode === 200 &&
                        resN7.body.includes('Sinh viên phải đủ 18 tuổi trở lên.') &&
                        resN7.body.includes(`value="${minus1DayDateStr}"`);

    results.push({
      id: 'N7',
      name: 'Thiếu đúng 1 ngày mới đủ 18 tuổi: BỊ TỪ CHỐI',
      status: testN7_pass ? 'PASS' : 'FAIL',
      note: `Sinh ngày ${minus1DayDateStr} (mai mới tới sinh nhật 18): bị từ chối với lỗi "Sinh viên phải đủ 18 tuổi trở lên."`
    });

    // -------------------------------------------------------------
    // Test N8: Ngày sinh trong tương lai và ngày không tồn tại (2025-02-30) bị từ chối
    // -------------------------------------------------------------
    console.log('Chạy Test N8...');
    // Case tương lai
    const futureDateStr = `${today.getFullYear() + 1}-01-01`;
    const postDataN8a = new URLSearchParams({
      name: 'Tương Lai',
      email: 'future@example.com',
      dateOfBirth: futureDateStr,
      className: 'IT1'
    }).toString();
    const resN8a = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataN8a)
      }
    }, postDataN8a);

    // Case không tồn tại: 2024-02-30
    const postDataN8b = new URLSearchParams({
      name: 'Ngày Không Tồn Tại',
      email: 'invalidday@example.com',
      dateOfBirth: '2024-02-30',
      className: 'IT1'
    }).toString();
    const resN8b = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataN8b)
      }
    }, postDataN8b);

    const testN8_pass = resN8a.statusCode === 200 && resN8a.body.includes('Ngày sinh không hợp lệ.') &&
                        resN8b.statusCode === 200 && resN8b.body.includes('Ngày sinh không hợp lệ.');

    results.push({
      id: 'N8',
      name: 'Ngày tương lai và ngày không tồn tại (2024-02-30): Bị từ chối',
      status: testN8_pass ? 'PASS' : 'FAIL',
      note: 'Từ chối cả ngày tương lai và ngày sai lịch với thông báo "Ngày sinh không hợp lệ."'
    });

    // -------------------------------------------------------------
    // Test N9: Khi bất kỳ validation nào thất bại, JSON không thay đổi
    // -------------------------------------------------------------
    console.log('Chạy Test N9...');
    const jsonBeforeN9 = fs.readFileSync(DATA_FILE, 'utf-8');
    // Gửi loạt request lỗi
    await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postDataN4) }
    }, postDataN4);
    await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postDataN7) }
    }, postDataN7);
    const jsonAfterN9 = fs.readFileSync(DATA_FILE, 'utf-8');
    const testN9_pass = (jsonBeforeN9 === jsonAfterN9);

    results.push({
      id: 'N9',
      name: 'Validation thất bại: JSON tuyệt đối không thay đổi',
      status: testN9_pass ? 'PASS' : 'FAIL',
      note: 'Các request lỗi validation không làm thay đổi hay ghi thêm dữ liệu vào students.json'
    });

    // -------------------------------------------------------------
    // Test N10: Sửa tất cả trường sai và gửi lại thành công: chỉ tạo đúng 1 sinh viên & PRG
    // -------------------------------------------------------------
    console.log('Chạy Test N10...');
    const countBeforeN10 = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')).length;
    const postDataN10 = new URLSearchParams({
      name: 'Nguyễn Thành Đạt',
      email: 'dat.nguyen@example.com',
      dateOfBirth: '2004-03-25',
      className: 'SE3'
    }).toString();

    const resN10 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postDataN10)
      }
    }, postDataN10);

    const countAfterN10 = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')).length;
    const testN10_pass = (resN10.statusCode === 303 || resN10.statusCode === 302) &&
                         resN10.headers.location === '/students?success=created' &&
                         (countAfterN10 === countBeforeN10 + 1);

    results.push({
      id: 'N10',
      name: 'Sửa các trường sai và gửi lại: tạo đúng 1 sinh viên và PRG',
      status: testN10_pass ? 'PASS' : 'FAIL',
      note: 'Sau khi sửa hợp lệ và gửi lại, tạo đúng 1 bản ghi mới và redirect 303 về /students?success=created'
    });

    server.close();
    console.log('\n--- KẾT QUẢ TỔNG HỢP KIỂM THỬ BỔ SUNG ---');
    console.table(results);
  } catch (err) {
    console.error('Lỗi kiểm thử:', err);
    if (server) server.close();
  }
}

runNewTests();
