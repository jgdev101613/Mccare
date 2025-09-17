# Time2Care – User Stories & Development Roadmap

## 📌 User Stories

### 🔹 As a Student
- I want to **create an account with profile info** (year level, section, group, profile picture) so that I am properly organized in the system.  
- I want to **receive my own QR code** that I can save and present for attendance.  
- I want to **view my schedule** so I can track when and where I am assigned.  
- I want to **get notifications** (email, website, or app alert) before my schedule or if it changes, so I don’t miss duty.  
- I want to **see my attendance history** so I can verify my logs.  
- I want to **see motivational quotes** on login/homepage for encouragement.  
- I want to **see a calendar view** with icons (dot/heart/star) showing my scheduled duties so I can plan easily.  

---

### 🔹 As a Teacher (CI)
- I want to **scan student QR codes** so I can record their attendance quickly.  
- I want to **view attendance tables** with names and timestamps, so monitoring is easy.  
- I want to **download/export attendance reports** (Excel/CSV) so I can keep records.  
- I want to **access my group’s schedules and attendance** in one place without hassle.  

---

### 🔹 As an Admin
- I want to **create accounts for students and teachers** or approve self-registrations.  
- I want to **easily create and manage schedules** per group, so workload is reduced.  
- I want the system to **detect conflicts automatically** (highlight in red if a student already has a duty on that date/time) so no overlaps happen.  
- I want to **assign schedules per group** so that I don’t need to manually select every student.  
- I want to **notify students automatically** (email, SMS, or Messenger) before their duty, so they don’t miss schedules.  
- I want to **view all attendance logs in a table** (columns: student name, date, scan time) so monitoring is organized.  
- I want the **system dashboard to show schedules visually (calendar view)** with highlighted duty days per group, so it’s easy to manage.  

---

## 📌 To-Do List (MERN Development Roadmap)

### 1. Account System
- [ ] User registration (Student/Teacher/Admin) with profile fields (Year, Section, Group, Profile Image).  
- [ ] Profile picture upload (store in cloud/local).  
- [ ] Generate unique QR code for each student upon registration.  

### 2. QR Code Attendance
- [ ] QR code generator (per student).  
- [ ] QR scanner (for teachers via webcam/phone cam).  
- [ ] Attendance logging (student_id, date, time).  

### 3. Scheduling
- [ ] Admin panel to create schedules (by group).  
- [ ] Conflict detection (highlight red if overlap).  
- [ ] Group-based scheduling (assign whole group at once).  
- [ ] Calendar UI (with icons on duty days).  

### 4. Attendance Monitoring
- [ ] Attendance table (Name | Day 1 | Day 2 | … with scan time).  
- [ ] Export to Excel/CSV option.  
- [ ] Teacher access to attendance dashboard.  

### 5. Notifications
- [ ] Email notification service (Nodemailer).  
- [ ] Optional SMS/Messenger integration.  
- [ ] Auto-notify students before duty or when schedule changes.  

### 6. UI Enhancements
- [ ] Motivational quotes on login/homepage (random display).  
- [ ] Calendar with schedule markers.  
- [ ] Dashboard with quick summary (Upcoming duty, Attendance %, etc.).  

### 7. Admin & Teacher Tools
- [ ] Admin: User management (approve/reject accounts).  
- [ ] Admin: Schedule management dashboard.  
- [ ] Teacher: Attendance scanner + monitoring page.  
