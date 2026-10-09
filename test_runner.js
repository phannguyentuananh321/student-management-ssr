const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./app');

const PORT = 3001; // Dùng port riêng để test
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

async function runTests() {
  resetToInitialData();
  const server = app.listen(PORT);
  console.log('--- BẮT ĐẦU CHẠY 12 BÀI KIỂM THỬ ---');

  const results = [];

  try {
    // -------------------------------------------------------------
    // TEST 1: Tạo sinh viên hợp lệ
    // -------------------------------------------------------------
    console.log('\nChạy Test 1...');
    const postData1 = new URLSearchParams({
      name: 'Phạm Đức Dũng',
      email: 'dung.pham@example.com',
      dateOfBirth: '2003-01-20',
      className: 'SE1'
    }).toString();

    const res1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData1)
      }
    }, postData1);

    const test1_PRG = (res1.statusCode === 303 || res1.statusCode === 302) && (res1.headers.location === '/students?success=created');
    
    // Follow redirect
    const res1_get = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students?success=created',
      method: 'GET'
    });

    const studentsAfter1 = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const test1_json = studentsAfter1.some(s => s.email === 'dung.pham@example.com' && s.id && s.name && s.dateOfBirth && s.className);
    const test1_html = res1_get.body.includes('Phạm Đức Dũng') && res1_get.body.includes('Thành công!');

    if (test1_PRG && test1_json && test1_html) {
      results.push({ id: 1, name: 'Tạo sinh viên hợp lệ', status: 'PASS', note: 'Status 303 Redirect đúng, JSON có sinh viên mới đủ 5 trường, HTML hiển thị sinh viên & thông báo thành công' });
    } else {
      results.push({ id: 1, name: 'Tạo sinh viên hợp lệ', status: 'FAIL', note: `PRG: ${test1_PRG}, JSON: ${test1_json}, HTML: ${test1_html}` });
    }

    // -------------------------------------------------------------
    // TEST 2: Name hoặc Email để trống
    // -------------------------------------------------------------
    console.log('Chạy Test 2...');
    const jsonBefore2 = fs.readFileSync(DATA_FILE, 'utf-8');

    // Case 2a: Name trống
    const postData2a = new URLSearchParams({
      name: '   ',
      email: 'valid@example.com',
      dateOfBirth: '2003-01-20',
      className: 'SE1'
    }).toString();

    const res2a = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData2a)
      }
    }, postData2a);

    // Case 2b: Email trống
    const postData2b = new URLSearchParams({
      name: 'Đặng Tuấn',
      email: '   ',
      dateOfBirth: '2003-01-20',
      className: 'SE1'
    }).toString();

    const res2b = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData2b)
      }
    }, postData2b);

    const jsonAfter2 = fs.readFileSync(DATA_FILE, 'utf-8');
    const test2_pass = (res2a.statusCode === 200 && (res2a.body.includes('Vui lòng nhập họ và tên.') || res2a.body.includes('Vui lòng nhập họ và tên sinh viên.'))) &&
                       (res2b.statusCode === 200 && (res2b.body.includes('Vui lòng nhập email.') || res2b.body.includes('Vui lòng nhập email sinh viên.'))) &&
                       (jsonBefore2 === jsonAfter2);

    results.push({
      id: 2,
      name: 'Name hoặc Email để trống',
      status: test2_pass ? 'PASS' : 'FAIL',
      note: 'Server từ chối 200 OK (render lỗi), thông báo lỗi rõ ràng, file JSON không bị thay đổi'
    });

    // -------------------------------------------------------------
    // TEST 3: Email sai định dạng
    // -------------------------------------------------------------
    console.log('Chạy Test 3...');
    const jsonBefore3 = fs.readFileSync(DATA_FILE, 'utf-8');
    const postData3 = new URLSearchParams({
      name: 'Ngô Văn Nam',
      email: 'student@',
      dateOfBirth: '2003-01-20',
      className: 'SE1'
    }).toString();

    const res3 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData3)
      }
    }, postData3);

    const jsonAfter3 = fs.readFileSync(DATA_FILE, 'utf-8');
    const test3_pass = (res3.statusCode === 200 && res3.body.includes('Email không đúng định dạng.')) &&
                       (jsonBefore3 === jsonAfter3);

    results.push({
      id: 3,
      name: 'Email sai định dạng',
      status: test3_pass ? 'PASS' : 'FAIL',
      note: 'Từ chối email "student@", hiển thị lỗi "Email không đúng định dạng.", JSON không đổi'
    });

    // -------------------------------------------------------------
    // TEST 4: Email trùng lặp (kể cả chữ hoa/thường)
    // -------------------------------------------------------------
    console.log('Chạy Test 4...');
    const jsonBefore4 = fs.readFileSync(DATA_FILE, 'utf-8');
    // Trùng lowercase
    const postData4a = new URLSearchParams({
      name: 'Trùng Email 1',
      email: 'an.nguyen@example.com',
      dateOfBirth: '2003-01-20',
      className: 'SE1'
    }).toString();

    const res4a = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData4a)
      }
    }, postData4a);

    // Trùng Uppercase
    const postData4b = new URLSearchParams({
      name: 'Trùng Email 2',
      email: 'AN.NGUYEN@EXAMPLE.COM',
      dateOfBirth: '2003-01-20',
      className: 'SE1'
    }).toString();

    const res4b = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData4b)
      }
    }, postData4b);

    const jsonAfter4 = fs.readFileSync(DATA_FILE, 'utf-8');
    const test4_pass = (res4a.statusCode === 200 && res4a.body.includes('Email này đã tồn tại.')) &&
                       (res4b.statusCode === 200 && res4b.body.includes('Email này đã tồn tại.')) &&
                       (jsonBefore4 === jsonAfter4);

    results.push({
      id: 4,
      name: 'Email trùng lặp (hoa/thường)',
      status: test4_pass ? 'PASS' : 'FAIL',
      note: 'Từ chối cả hai trường hợp email trùng thường và HOA, thông báo lỗi "Email này đã tồn tại.", JSON không đổi'
    });

    // -------------------------------------------------------------
    // TEST 5: Refresh sau khi tạo thành công (PRG bảo vệ)
    // -------------------------------------------------------------
    console.log('Chạy Test 5...');
    const countBefore5 = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')).length;
    // Client refresh lại trang GET /students?success=created
    const res5 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students?success=created',
      method: 'GET'
    });
    const countAfter5 = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')).length;
    const test5_pass = (res5.statusCode === 200) && (countBefore5 === countAfter5);

    results.push({
      id: 5,
      name: 'Refresh sau khi tạo thành công',
      status: test5_pass ? 'PASS' : 'FAIL',
      note: `F5 trang GET không gửi lại POST, số lượng sinh viên giữ nguyên (${countAfter5})`
    });

    // -------------------------------------------------------------
    // TEST 6: Dữ liệu còn sau khi restart
    // -------------------------------------------------------------
    console.log('Chạy Test 6...');
    const studentsSaved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    // Mô phỏng server restart: đóng server, khởi tạo lại app và đọc lại
    server.close();
    
    // Khởi động lại
    const newServer = app.listen(PORT);
    const res6 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'GET'
    });
    const studentsAfterRestart = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const test6_pass = (res6.statusCode === 200) && 
                       (studentsSaved.length === studentsAfterRestart.length) &&
                       (res6.body.includes('dung.pham@example.com'));

    results.push({
      id: 6,
      name: 'Dữ liệu còn sau khi restart',
      status: test6_pass ? 'PASS' : 'FAIL',
      note: 'Sau khi restart server, file JSON giữ nguyên sinh viên đã tạo, không bị ghi đè về mẫu ban đầu'
    });

    // -------------------------------------------------------------
    // TEST 7: Lọc lớp có sinh viên
    // -------------------------------------------------------------
    console.log('Chạy Test 7...');
    const res7 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students?className=IT2',
      method: 'GET'
    });
    const test7_pass = res7.body.includes('bich.tran@example.com') && 
                       !res7.body.includes('an.nguyen@example.com') &&
                       res7.body.includes('value="IT2" selected');

    results.push({
      id: 7,
      name: 'Lọc lớp có sinh viên',
      status: test7_pass ? 'PASS' : 'FAIL',
      note: 'Lọc className=IT2 chỉ trả về sinh viên lớp IT2, giữ selected trên dropdown'
    });

    // -------------------------------------------------------------
    // TEST 8: Hiển thị tất cả sinh viên
    // -------------------------------------------------------------
    console.log('Chạy Test 8...');
    const res8 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'GET'
    });
    const currentStudents = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const test8_pass = res8.body.includes(`Đang hiển thị ${currentStudents.length} sinh viên.`) &&
                       currentStudents.every(s => res8.body.includes(s.email));

    results.push({
      id: 8,
      name: 'Hiển thị tất cả sinh viên',
      status: test8_pass ? 'PASS' : 'FAIL',
      note: `GET /students hiển thị đủ toàn bộ ${currentStudents.length} sinh viên và text badge đếm số lượng chính xác`
    });

    // -------------------------------------------------------------
    // TEST 9: Lớp không tồn tại
    // -------------------------------------------------------------
    console.log('Chạy Test 9...');
    const res9 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students?className=NON_EXISTENT_CLASS',
      method: 'GET'
    });
    const test9_pass = res9.statusCode === 200 &&
                       res9.body.includes('Không tìm thấy lớp phù hợp.') &&
                       !res9.body.includes('an.nguyen@example.com') &&
                       !res9.body.includes('bich.tran@example.com');

    results.push({
      id: 9,
      name: 'Lớp không tồn tại',
      status: test9_pass ? 'PASS' : 'FAIL',
      note: 'GET lớp không tồn tại trả về 200 OK, thông báo "Không tìm thấy lớp phù hợp.", không render sinh viên lớp khác'
    });

    // -------------------------------------------------------------
    // TEST 10: Dropdown không có lớp trùng
    // -------------------------------------------------------------
    console.log('Chạy Test 10...');
    const res10 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'GET'
    });
    // Check dropdown options
    const optionMatches = res10.body.match(/<option value="([^"]+)"/g) || [];
    const values = optionMatches.map(m => m.replace('<option value="', '').replace('"', '').toLowerCase());
    const hasDuplicates = new Set(values).size !== values.length;
    const test10_pass = !hasDuplicates && values.includes('se1') && values.includes('it2');

    results.push({
      id: 10,
      name: 'Dropdown không có lớp trùng',
      status: test10_pass ? 'PASS' : 'FAIL',
      note: 'Các lớp trong dropdown trích xuất từ JSON thực tế, duy nhất không trùng lặp (SE1, IT2)'
    });

    // -------------------------------------------------------------
    // TEST 11: Lọc không thay đổi JSON
    // -------------------------------------------------------------
    console.log('Chạy Test 11...');
    const jsonBefore11 = fs.readFileSync(DATA_FILE, 'utf-8');
    await request({ hostname: 'localhost', port: PORT, path: '/students?className=SE1', method: 'GET' });
    await request({ hostname: 'localhost', port: PORT, path: '/students?className=IT2', method: 'GET' });
    await request({ hostname: 'localhost', port: PORT, path: '/students?className=UNKNOWN', method: 'GET' });
    const jsonAfter11 = fs.readFileSync(DATA_FILE, 'utf-8');
    const test11_pass = (jsonBefore11 === jsonAfter11);

    results.push({
      id: 11,
      name: 'Lọc không thay đổi JSON',
      status: test11_pass ? 'PASS' : 'FAIL',
      note: 'Thao tác lọc qua các lớp không hề ghi đè hay thay đổi bất kỳ byte nào trong data/students.json'
    });

    // -------------------------------------------------------------
    // TEST 12: Tạo sinh viên sau khi lọc
    // -------------------------------------------------------------
    console.log('Chạy Test 12...');
    // Đang lọc SE1, giờ tạo sinh viên lớp mới 'NET3'
    const postData12 = new URLSearchParams({
      name: 'Vũ Minh Tuấn',
      email: 'tuan.vu@example.com',
      dateOfBirth: '2003-12-05',
      className: 'NET3'
    }).toString();

    const res12_post = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData12)
      }
    }, postData12);

    const test12_prg = (res12_post.statusCode === 303 || res12_post.statusCode === 302) && (res12_post.headers.location === '/students?success=created');

    const res12_get = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/students?success=created',
      method: 'GET'
    });

    const test12_pass = test12_prg && 
                        res12_get.body.includes('Vũ Minh Tuấn') && 
                        res12_get.body.includes('NET3') &&
                        res12_get.body.includes('<option value="NET3"');

    results.push({
      id: 12,
      name: 'Tạo sinh viên sau khi lọc',
      status: test12_pass ? 'PASS' : 'FAIL',
      note: 'Tạo sinh viên thành công chuyển hướng về toàn bộ danh sách, hiển thị sinh viên mới và dropdown tự cập nhật lớp NET3'
    });

    newServer.close();

    console.log('\n--- KẾT QUẢ TỔNG HỢP KIỂM THỬ ---');
    console.table(results);
    fs.writeFileSync(path.join(__dirname, 'test_results.json'), JSON.stringify(results, null, 2), 'utf-8');

  } catch (err) {
    console.error('Lỗi khi chạy bài test:', err);
    if (server) server.close();
  }
}

runTests();
