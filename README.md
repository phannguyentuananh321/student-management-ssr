# Ứng Dụng Quản Lý Sinh Viên (Student Management Web App)

Một ứng dụng web quản lý sinh viên đơn giản, chuẩn kiến trúc **SSR (Server-Side Rendering)** sử dụng Node.js, Express.js và EJS. Dữ liệu được lưu trữ bền vững bằng file JSON (`data/students.json`).

---

## 📋 Yêu cầu tiên quyết (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Node.js** (Khuyến nghị phiên bản 18+ hoặc mới nhất).
- **npm** (Đi kèm sẵn khi cài Node.js).

Kiểm tra bằng cách mở Terminal và gõ:
```bash
node -v
npm -v
```
*(Nếu hiển thị số phiên bản như `v20.x.x` hoặc `v24.x.x` là máy bạn đã sẵn sàng).*

---

## 🚀 Các bước cài đặt và chạy ứng dụng

Thực hiện theo các bước sau để đưa ứng dụng lên trình duyệt:

### Bước 1: Mở thư mục dự án trong Terminal
Mở VS Code hoặc cửa sổ Terminal (PowerShell / Command Prompt / Git Bash) tại đúng thư mục dự án:
```bash
# Đảm bảo đường dẫn đang ở thư mục CODEBLOCK3 (chứa file app.js và package.json)
```

### Bước 2: Cài đặt các thư viện cần thiết (Dependencies)
Chạy lệnh sau để tải các gói thư viện (`express`, `ejs`):
```bash
npm install
```
> **Lưu ý:** Lệnh này sẽ tự động tạo thư mục `node_modules`. Bạn chỉ cần chạy lệnh này **1 lần duy nhất** khi mới tải hoặc clone dự án về máy.

### Bước 3: Khởi chạy Web Server
Sau khi cài đặt xong, gõ lệnh:
```bash
npm start
```
*(Hoặc lệnh tương đương: `node app.js`)*

Khi server khởi chạy thành công, Terminal sẽ thông báo:
```text
Server đang chạy tại http://localhost:3000/students
```

### Bước 4: Truy cập ứng dụng trên trình duyệt
Mở trình duyệt web (Chrome, Edge, Firefox,...) và truy cập địa chỉ:
👉 **[http://localhost:3000/students](http://localhost:3000/students)**  
*(hoặc truy cập `http://localhost:3000/` hệ thống sẽ tự động chuyển hướng).*

---

## 🛑 Cách dừng và khởi động lại Server

- **Để dừng server:** Quay lại cửa sổ Terminal đang chạy và nhấn tổ hợp phím **`Ctrl + C`** (sau đó gõ `y` nếu terminal hỏi xác nhận).
- **Để khởi động lại:** Gõ lại `npm start`. Dữ liệu sinh viên bạn đã thêm trước đó vẫn được lưu trữ nguyên vẹn trong file `data/students.json`.

---

## 💡 Hướng dẫn sử dụng các tính năng chính

1. **Thêm sinh viên mới:**
   - Điền đầy đủ Họ và tên, Email, Ngày sinh, Lớp.
   - **Quy tắc kiểm tra hợp lệ (Validation):**
     - Email phải đúng định dạng và không được trùng với sinh viên đã có.
     - Sinh viên phải **từ đủ 17 tuổi trở lên** (tính chính xác theo ngày hiện tại).
     - Nếu có lỗi, hệ thống sẽ **giữ nguyên nội dung bạn đã nhập** và hiển thị viền đỏ kèm dòng báo lỗi bên dưới ô cần sửa.
   - Khi thêm thành công, hệ thống áp dụng cơ chế **PRG (Post/Redirect/Get)** giúp bạn bấm F5 (refresh) mà không bị gửi lại form.

2. **Lọc sinh viên theo lớp:**
   - Tại khu vực **"Lọc theo lớp"**, chọn một lớp trong menu thả xuống rồi bấm nút **"Lọc"**.
   - Bấm nút **"Đặt lại"** để quay về hiển thị toàn bộ danh sách.

---

## 🧪 Chạy kiểm thử tự động (Testing)

Dự án có sẵn 2 bộ kiểm thử tự động giả lập request HTTP:
- Chạy kiểm thử 12 kịch bản nghiệp vụ chuẩn:
  ```bash
  node test_runner.js
  ```
- Chạy kiểm thử các tính năng nâng cao (giữ dữ liệu form & độ tuổi):
  ```bash
  node test_runner_new.js
  ```

---

## 📁 Cấu trúc thư mục dự án

```text
├── app.js                 # Server Express: xử lý routes, validation, đọc/ghi JSON
├── package.json           # Khai báo cấu hình dự án và dependencies
├── data/
│   └── students.json      # File lưu trữ dữ liệu sinh viên
├── views/
│   └── students.ejs       # Giao diện server-rendered (EJS)
├── public/
│   ├── style.css          # CSS bổ trợ giao diện
│   └── script.js          # GSAP animation phía trình duyệt
└── .gitignore             # Khai báo bỏ qua node_modules khi đưa lên Git
```
