# Student Management Web App

Ứng dụng quản lý sinh viên đơn giản (SSR) dùng **Node.js + Express + EJS**, lưu trữ dữ liệu bằng file JSON (`data/students.json`).

---

## ⚡ Quick Start (Cách chạy nhanh)

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Khởi chạy server
```bash
npm start
```
> Server chạy tại: **`http://localhost:3000/students`** (hoặc `http://localhost:3000`)

---

## 🛠 Tính năng chính

- **Hiển thị danh sách sinh viên:** Đọc từ `data/students.json`.
- **Thêm sinh viên mới:**
  - Tự sinh `id` duy nhất (`std-<timestamp>`).
  - Validation: Email hợp lệ & không trùng; tuổi **từ đủ 17 trở lên**.
  - Form error handling: Khi lỗi sẽ giữ lại dữ liệu đã nhập (`formData`), báo lỗi từng field.
  - Chuẩn **PRG (Post/Redirect/Get)** chống duplicate khi F5.
- **Lọc theo lớp:** Lọc qua query param `GET /students?className=...`. Dropdown lấy động từ dữ liệu thực tế.

---

## 🧪 Chạy Test

- Test toàn bộ 12 kịch bản chính:
  ```bash
  node test_runner.js
  ```
- Test giữ dữ liệu form & độ tuổi 17+:
  ```bash
  node test_runner_new.js
  ```

---

## 📁 Cấu trúc thư mục

```text
├── app.js               # Express server & routes (GET/POST /students)
├── package.json         # Dependencies (express, ejs)
├── data/students.json   # Database file JSON
├── views/students.ejs   # Template EJS
├── public/              # Static files (CSS, GSAP script)
└── .gitignore           # Bỏ qua node_modules, logs
```
