// Full replacement: adds payments handling and finance APIs
window.UMSApp = (function(){
  const KEY = 'ums_data_v3';
  const CUR = 'ums_curr_v3';

  function initial(){
    return {
      users:[
        {username:'student', password:'studentpass', role:'student'},
        {username:'instructor', password:'instructorpass', role:'instructor'},
        {username:'admin', password:'adminpass', role:'admin'},
        {username:'finance', password:'financepass', role:'finance'}
      ],
      courses:[
        {code:'CSE101', title:'Intro to CS', seats:5, credits:3},
        {code:'MTH100', title:'Calculus I', seats:2, credits:4}
      ],
      registrations:[], // {regId, student, course, status, paymentMethod}
      grades:[],
      payments:[] // {paymentId, regId, student, course, method, status:'pending'|'verified'|'rejected'}
    };
  }

  function load(){ return JSON.parse(localStorage.getItem(KEY) || JSON.stringify(initial())); }
  function save(d){ localStorage.setItem(KEY, JSON.stringify(d)); }
  function setCurr(u){ localStorage.setItem(CUR, JSON.stringify(u)); }
  function getCurr(){ return JSON.parse(localStorage.getItem(CUR) || 'null'); }
  function clearCurr(){ localStorage.removeItem(CUR); }

  function findCourseBy(code){
    if(!code) return null;
    const d = load();
    return d.courses.find(c=>c.code.toLowerCase()===String(code).toLowerCase());
  }
  function studentRegs(student){ const d=load(); return d.registrations.filter(r=>r.student===student); }
  function countStudentCourses(student){ return studentRegs(student).length; }

  function simulatePayment(method){
    if(method==='Cash') return true;
    if(method==='Visa') return Math.random() < 0.75;
    return confirm(`Simulate payment (${method}) success? OK = success, Cancel = fail`);
  }

  return {
    // data & auth
    data(){ return load(); },
    currentUser(){ return getCurr(); },
    requireAuth(){ if(!getCurr()){ window.location='login.html'; } },
    login(username,password){
      const d = load();
      const u = d.users.find(x=>x.username===username && x.password===password);
      if(u){ setCurr({username:u.username, role:u.role}); return {success:true}; }
      return {success:false, message:'Invalid username or password'};
    },
    logout(){ clearCurr(); window.location='login.html'; },

    // user management
    changePassword(username, oldPassword, newPassword){
      const d = load();
      const u = d.users.find(x=>x.username===username);
      if(!u) throw new Error('user_not_found');
      if(u.password !== oldPassword) throw new Error('wrong_password');
      u.password = newPassword;
      save(d);
      return true;
    },

    // courses
    findCourse(code){ return findCourseBy(code); },
    saveCourse(course){
      const d=load();
      const codeLower = (course.code||'').toLowerCase();
      if(!codeLower) throw new Error('invalid_code');
      const existing = d.courses.find(c=> c.code.toLowerCase()===codeLower );
      if(existing){
        existing.title = course.title;
        existing.seats = Number(course.seats);
        existing.credits = Number(course.credits||existing.credits||3);
      } else {
        d.courses.push({code:course.code, title:course.title, seats:Number(course.seats), credits:Number(course.credits||3)});
      }
      save(d);
    },
    deleteCourse(code){
      const d=load();
      d.courses = d.courses.filter(c=>c.code.toLowerCase()!==String(code).toLowerCase());
      d.registrations = d.registrations.filter(r=>r.course.toLowerCase()!==String(code).toLowerCase());
      d.payments = d.payments.filter(p=>p.course.toLowerCase()!==String(code).toLowerCase());
      save(d);
    },
    searchCourses(q, filter){
      const d=load();
      if(!q && !filter) return d.courses;
      q = (q||'').toLowerCase();
      let res = d.courses.filter(c=> c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) );
      if(filter && filter.by==='credits' && filter.value!=null){
        res = res.filter(c=> Number(c.credits) === Number(filter.value));
      }
      return res;
    },

    // registration & payments
    registerCourse(student, code, paymentMethod){
      const d = load();
      const c = d.courses.find(x=>x.code.toLowerCase()===String(code).toLowerCase());
      if(!c) throw new Error('Course not found');
      const already = d.registrations.some(r=> r.student===student && r.course.toLowerCase()===String(code).toLowerCase());
      if(already) throw new Error('already_registered');
      const currentCount = d.registrations.filter(r=>r.student===student).length;
      if(currentCount >= 7) throw new Error('max_reached');
      // Payment handling:
      const paymentSuccess = simulatePayment(paymentMethod || 'Visa');
      const regId = Date.now() + Math.floor(Math.random()*999);
      if(paymentSuccess){
        // immediate verification -> commit registration and decrement seats if available
        if(c.seats <= 0) throw new Error('full');
        c.seats -= 1;
        d.registrations.push({regId, student, course:c.code, status:'confirmed', paymentMethod:paymentMethod||'Visa'});
        d.payments.push({paymentId:Date.now()+1, regId, student, course:c.code, method:paymentMethod||'Visa', status:'verified'});
        save(d);
        return {status:'confirmed'};
      } else {
        // create pending payment and pending registration (no seat reserved)
        d.registrations.push({regId, student, course:c.code, status:'pending', paymentMethod:paymentMethod||'Visa'});
        d.payments.push({paymentId:Date.now()+1, regId, student, course:c.code, method:paymentMethod||'Visa', status:'pending'});
        save(d);
        return {status:'pending'};
      }
    },

    // finance APIs
    getPendingPayments(){ const d=load(); return d.payments.filter(p=>p.status==='pending'); },
    getAllPayments(){ return load().payments; },

    verifyPayment(paymentId, action){
      // action: 'approve' or 'reject'
      const d = load();
      const pay = d.payments.find(p=>p.paymentId===Number(paymentId));
      if(!pay) throw new Error('payment_not_found');
      const reg = d.registrations.find(r=>r.regId===pay.regId && r.student===pay.student && r.course.toLowerCase()===pay.course.toLowerCase());
      if(action==='approve'){
        const course = d.courses.find(c=>c.code.toLowerCase()===pay.course.toLowerCase());
        if(!course) { pay.status='rejected'; if(reg) reg.status='payment_rejected'; save(d); throw new Error('course_missing'); }
        if(course.seats <= 0){ pay.status='rejected'; if(reg) reg.status='rejected_full'; save(d); throw new Error('no_seats'); }
        course.seats -= 1;
        pay.status='verified';
        if(reg) reg.status='confirmed';
        save(d);
        return true;
      } else {
        pay.status='rejected';
        if(reg) reg.status='payment_rejected';
        save(d);
        return true;
      }
    },

    // drop/exchange (note: exchange now interacts with payments lightly)
    dropCourse(student, code){
      const d = load();
      const idx = d.registrations.findIndex(r=>r.student===student && r.course.toLowerCase()===String(code).toLowerCase());
      if(idx===-1) throw new Error('not_registered');
      const removed = d.registrations.splice(idx,1)[0];
      const c = d.courses.find(x=>x.code.toLowerCase()===String(code).toLowerCase());
      if(c && removed.status==='confirmed') c.seats += 1;
      // mark related payments rejected if pending
      d.payments.forEach(p=>{ if(p.regId===removed.regId && p.status==='pending') p.status='rejected'; });
      save(d);
      return removed;
    },

    exchangeCourse(student, oldCode, newCode, paymentMethod){
      const d = load();
      const oldReg = d.registrations.find(r=>r.student===student && r.course.toLowerCase()===String(oldCode).toLowerCase());
      if(!oldReg) throw new Error('old_not_registered');
      const newCourse = d.courses.find(c=>c.code.toLowerCase()===String(newCode).toLowerCase());
      if(!newCourse) throw new Error('new_not_found');
      if(newCourse.seats<=0) throw new Error('new_full');
      if(d.registrations.some(r=>r.student===student && r.course.toLowerCase()===String(newCode).toLowerCase())) throw new Error('already_registered_new');

      // attempt payment simulation for the new course
      const paymentOk = simulatePayment(paymentMethod || oldReg.paymentMethod || 'Visa');
      const regIdNew = Date.now() + Math.floor(Math.random()*999);
      if(!paymentOk){
        // create pending registration for new course, leave old unchanged
        d.registrations.push({regId:regIdNew, student, course:newCourse.code, status:'pending', paymentMethod:paymentMethod||'Visa'});
        d.payments.push({paymentId:Date.now()+2, regId:regIdNew, student, course:newCourse.code, method:paymentMethod||'Visa', status:'pending'});
        save(d);
        return {status:'pending'};
      }
      // payment ok: perform atomic swap
      // drop old (refund seat) if old was confirmed
      const oldCourse = d.courses.find(c=>c.code.toLowerCase()===String(oldCode).toLowerCase());
      if(oldCourse && oldReg.status==='confirmed') oldCourse.seats += 1;
      // occupy new
      if(newCourse.seats <= 0) throw new Error('new_full');
      newCourse.seats -= 1;
      // remove old registration
      d.registrations = d.registrations.filter(r=> !(r.student===student && r.course.toLowerCase()===String(oldCode).toLowerCase()) );
      // push new reg + payment record
      d.registrations.push({regId:regIdNew, student, course:newCourse.code, status:'confirmed', paymentMethod:paymentMethod||'Visa'});
      d.payments.push({paymentId:Date.now()+2, regId:regIdNew, student, course:newCourse.code, method:paymentMethod||'Visa', status:'verified'});
      save(d);
      return {status:'confirmed'};
    },

    // grades & admin helpers
    saveGrade(g){ const d=load(); d.grades.push({id:Date.now(), student:g.student, course:g.course, grade:g.grade}); save(d); },
    enrollmentSummary(){
      const d=load();
      return d.courses.map(c=> {
        const enrolled = d.registrations.filter(r=>r.course.toLowerCase()===c.code.toLowerCase() && r.status==='confirmed').length;
        return `${c.code}: title=${c.title}, seatsRemaining=${c.seats}, enrolled=${enrolled}`;
      }).join('\n');
    },
    studentRegistrations(student){ return studentRegs(student); },
    countStudentCourses(student){ return countStudentCourses(student); },
    // new: return payments for a student
    getPaymentsForStudent(student){ const d = load(); return d.payments.filter(p=>p.student===student); }
  };
})();

// --- global navbar injection (runs on pages that include assets/app.js) ---
document.addEventListener('DOMContentLoaded', function(){
  // avoid duplicate insertion
  if(document.querySelector('.global-nav-injected')) return;

  const user = window.UMSApp && window.UMSApp.currentUser ? window.UMSApp.currentUser() : null;
  const nav = document.createElement('div');
  nav.className = 'navbar global-nav-injected';
  nav.innerHTML = `
    <div class="nav-inner">
      <div class="brand">UMS Prototype</div>
      <div class="nav-links">
        <a href="index.html">Home</a>
        <a href="login.html">Login</a>
        <a href="dashboard.html">Dashboard</a>
        <a href="courses.html">Courses</a>
        <a href="register.html">Register</a>
        <a href="grades.html">Grades</a>
        <a href="admin.html">Admin</a>
        <a href="class-diagram.html">Class Model</a>
        <a href="profile.html">Profile</a>
        <a href="help.html">Help</a>
      </div>
      <div class="nav-actions">
        ${ user ? `<span class="small" style="margin-right:10px;color:#fff">${user.username} (${user.role})</span><button data-logout>Logout</button>` : `<a href="login.html">Sign In</a>` }
      </div>
    </div>
  `;
  document.body.insertBefore(nav, document.body.firstChild);

  const logoutBtn = nav.querySelector('[data-logout]');
  if(logoutBtn){
    logoutBtn.addEventListener('click', function(e){
      e.preventDefault();
      window.UMSApp.logout();
    });
  }
});