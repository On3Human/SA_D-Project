// UMSApp: improved localStorage-backed prototype logic with course credits,
// registration limits, exchange flow and payment options.
window.UMSApp = (function(){
  const KEY = 'ums_data_v2';
  const CUR = 'ums_curr_v2';

  function initial(){
    return {
      users:[
        {username:'student', password:'studentpass', role:'student'},
        {username:'instructor', password:'instructorpass', role:'instructor'},
        {username:'admin', password:'adminpass', role:'admin'}
      ],
      courses:[
        {code:'CSE101', title:'Intro to CS', seats:5, credits:3},
        {code:'MTH100', title:'Calculus I', seats:2, credits:4}
      ],
      registrations:[], // {regId, student, course, status, paymentMethod}
      grades:[]
    };
  }
  function load(){ return JSON.parse(localStorage.getItem(KEY) || JSON.stringify(initial())); }
  function save(d){ localStorage.setItem(KEY, JSON.stringify(d)); }
  function setCurr(u){ localStorage.setItem(CUR, JSON.stringify(u)); }
  function getCurr(){ return JSON.parse(localStorage.getItem(CUR) || 'null'); }
  function clearCurr(){ localStorage.removeItem(CUR); }

  // helpers
  function findCourseBy(code){ const d=load(); return d.courses.find(c=>c.code===code); }
  function studentRegs(student){ const d=load(); return d.registrations.filter(r=>r.student===student); }
  function countStudentCourses(student){ return studentRegs(student).length; }

  // payment simulation: returns true/false; supports retry optionally
  function simulatePayment(method){
    // simple prompt-based stub: Visa has a 75% success chance, Cash always succeeds (simulated)
    if(method==='Cash') return true;
    if(method==='Visa'){
      // random success to allow retry behavior
      return Math.random() < 0.75;
    }
    // other methods default to simulated success
    return confirm(`Simulate payment (${method}) success? OK = success, Cancel = fail`);
  }

  // public API
  return {
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
    findCourse(code){ return findCourseBy(code); },
    saveCourse(course){
      const d=load();
      const existing = d.courses.find(c=>c.code===course.code);
      if(existing){ existing.title=course.title; existing.seats=course.seats; existing.credits = Number(course.credits||existing.credits||3); }
      else d.courses.push({code:course.code, title:course.title, seats:course.seats, credits:Number(course.credits||3)});
      save(d);
    },
    deleteCourse(code){
      const d=load(); d.courses = d.courses.filter(c=>c.code!==code);
      // remove registrations for that course
      d.registrations = d.registrations.filter(r=>r.course!==code);
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
    registerCourse(student, code, paymentMethod){
      const d = load();
      const c = d.courses.find(x=>x.code===code);
      if(!c) throw new Error('Course not found');
      // max 7 courses enforcement
      const currentCount = d.registrations.filter(r=>r.student===student).length;
      if(currentCount >= 7) throw new Error('max_reached');
      if(c.seats<=0) throw new Error('full');
      // simulate payment
      const ok = simulatePayment(paymentMethod || 'Visa');
      if(!ok) throw new Error('payment_failed');
      // commit
      c.seats -= 1;
      d.registrations.push({regId:Date.now(), student, course:code, status:'confirmed', paymentMethod:paymentMethod||'Visa'});
      save(d);
      return true;
    },
    dropCourse(student, code){
      const d = load();
      const idx = d.registrations.findIndex(r=>r.student===student && r.course===code);
      if(idx===-1) throw new Error('not_registered');
      d.registrations.splice(idx,1);
      const c = d.courses.find(x=>x.code===code);
      if(c) c.seats += 1;
      save(d);
    },
    exchangeCourse(student, oldCode, newCode, paymentMethod){
      // attempt to atomically drop old and add new; if new fails restore old
      const d = load();
      const oldReg = d.registrations.find(r=>r.student===student && r.course===oldCode);
      if(!oldReg) throw new Error('old_not_registered');
      const newCourse = d.courses.find(c=>c.code===newCode);
      if(!newCourse) throw new Error('new_not_found');
      if(newCourse.seats<=0) throw new Error('new_full');
      // simulate payment for new course if needed
      const ok = simulatePayment(paymentMethod || oldReg.paymentMethod || 'Visa');
      if(!ok) throw new Error('payment_failed');
      // perform exchange: drop old, free seat, occupy new seat, update registration
      // remove old registration
      d.registrations = d.registrations.filter(r=> !(r.student===student && r.course===oldCode) );
      const oldCourse = d.courses.find(c=>c.code===oldCode);
      if(oldCourse) oldCourse.seats += 1;
      newCourse.seats -= 1;
      d.registrations.push({regId:Date.now(), student, course:newCode, status:'confirmed', paymentMethod:paymentMethod||'Visa'});
      save(d);
      return true;
    },
    saveGrade(g){ const d=load(); d.grades.push({id:Date.now(), student:g.student, course:g.course, grade:g.grade}); save(d); },
    enrollmentSummary(){
      const d=load();
      return d.courses.map(c=> {
        const enrolled = d.registrations.filter(r=>r.course===c.code).length;
        return `${c.code}: title=${c.title}, seatsRemaining=${c.seats}, enrolled=${enrolled}`;
      }).join('\n');
    },
    studentRegistrations(student){ return studentRegs(student); },
    countStudentCourses(student){ return countStudentCourses(student); }
  };
})();