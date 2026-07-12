import {
  db, auth, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, setDoc, onAuthStateChanged, signOut
} from "/assets/js/firebase-config.js";
import { escapeHtml, GRADE_LABELS } from "/assets/js/main.js";

/* ============== حراسة الدخول: لازم يكون المعلم مسجّل دخول ============== */
onAuthStateChanged(auth, (user) => {
  if (!user) location.href = "/admin/login.html";
});
document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));

/* ============== التبويبات ============== */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach(p => { p.classList.add("hidden"); p.classList.remove("flex"); });
    const panel = document.getElementById("tab-" + btn.dataset.tab);
    panel.classList.remove("hidden");
    panel.classList.add("flex");
  });
});

/* =====================================================================
   الدروس
   ===================================================================== */
const lessonForm = document.getElementById("lessonForm");
const lessonsAdminList = document.getElementById("lessonsAdminList");

async function loadLessonsAdmin() {
  lessonsAdminList.innerHTML = `<div class="item-card skeleton h-14"></div>`;
  const snap = await getDocs(collection(db, "lessons"));
  if (snap.empty) { lessonsAdminList.innerHTML = `<p class="text-sm opacity-60">لا توجد دروس بعد.</p>`; return; }
  lessonsAdminList.innerHTML = "";
  snap.forEach(docu => {
    const d = docu.data();
    lessonsAdminList.insertAdjacentHTML("beforeend", `
      <div class="item-card">
        <div class="flex-1">
          <div class="font-bold">${escapeHtml(d.title)}</div>
          <div class="text-xs opacity-60">${GRADE_LABELS[d.grade] || d.grade} · ${d.type}</div>
        </div>
        <button class="btn btn-outline btn-sm" data-edit="${docu.id}">تعديل</button>
        <button class="btn btn-danger btn-sm" data-del="${docu.id}">حذف</button>
      </div>`);
  });
  lessonsAdminList.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editLesson(b.dataset.edit)));
  lessonsAdminList.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => delLesson(b.dataset.del)));
}

async function editLesson(id) {
  const snap = await getDoc(doc(db, "lessons", id));
  if (!snap.exists()) return;
  const d = snap.data();
  document.getElementById("lesson_id").value = id;
  document.getElementById("lesson_title").value = d.title || "";
  document.getElementById("lesson_grade").value = d.grade || "1";
  document.getElementById("lesson_type").value = d.type || "text";
  document.getElementById("lesson_content").value = d.content || "";
  document.getElementById("lesson_order").value = d.order || 1;
  document.getElementById("lessonCancelEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function delLesson(id) {
  if (!confirm("هل تريد حذف هذا الدرس نهائياً؟")) return;
  await deleteDoc(doc(db, "lessons", id));
  loadLessonsAdmin();
}

document.getElementById("lessonCancelEdit").addEventListener("click", () => {
  lessonForm.reset();
  document.getElementById("lesson_id").value = "";
  document.getElementById("lessonCancelEdit").classList.add("hidden");
});

lessonForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("lesson_id").value;
  const payload = {
    title: document.getElementById("lesson_title").value.trim(),
    grade: document.getElementById("lesson_grade").value,
    type: document.getElementById("lesson_type").value,
    content: document.getElementById("lesson_content").value.trim(),
    order: Number(document.getElementById("lesson_order").value) || 1,
    updatedAt: Date.now()
  };
  if (id) {
    await updateDoc(doc(db, "lessons", id), payload);
  } else {
    payload.createdAt = Date.now();
    await addDoc(collection(db, "lessons"), payload);
  }
  lessonForm.reset();
  document.getElementById("lesson_id").value = "";
  document.getElementById("lessonCancelEdit").classList.add("hidden");
  loadLessonsAdmin();
});

/* =====================================================================
   الامتحانات
   ===================================================================== */
const examForm = document.getElementById("examForm");
const examsAdminList = document.getElementById("examsAdminList");
const questionsBuilder = document.getElementById("questionsBuilder");
let qCounter = 0;

function addQuestionRow(qData = null) {
  const idx = qCounter++;
  const type = qData?.type || "mcq";
  const wrap = document.createElement("div");
  wrap.className = "p-4 rounded-xl";
  wrap.style.background = "var(--paper-2)";
  wrap.dataset.qid = idx;
  wrap.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <span class="font-bold text-sm">سؤال</span>
      <button type="button" class="btn btn-danger btn-sm" data-remove-q>حذف السؤال</button>
    </div>
    <input class="field mb-2 q-text" placeholder="نص السؤال" value="${qData ? escapeHtml(qData.text) : ""}">
    <select class="field mb-2 q-type">
      <option value="mcq" ${type === "mcq" ? "selected" : ""}>اختيار من متعدد</option>
      <option value="tf" ${type === "tf" ? "selected" : ""}>صح / خطأ</option>
    </select>
    <div class="q-options-wrap"></div>
  `;
  questionsBuilder.appendChild(wrap);

  const optWrap = wrap.querySelector(".q-options-wrap");
  function renderOptions() {
    const t = wrap.querySelector(".q-type").value;
    if (t === "tf") {
      const correct = qData?.type === "tf" ? qData.correctIndex : 0;
      optWrap.innerHTML = `
        <div class="text-xs opacity-60 mb-1">اختر الإجابة الصحيحة</div>
        <label class="flex items-center gap-2 mb-1"><input type="radio" name="tfcorrect${idx}" value="0" ${correct === 0 ? "checked" : ""}> صح</label>
        <label class="flex items-center gap-2"><input type="radio" name="tfcorrect${idx}" value="1" ${correct === 1 ? "checked" : ""}> خطأ</label>`;
    } else {
      const opts = qData?.type === "mcq" ? qData.options : ["", "", "", ""];
      const correct = qData?.type === "mcq" ? qData.correctIndex : 0;
      optWrap.innerHTML = `
        <div class="text-xs opacity-60 mb-1">اكتب الاختيارات وحدد الإجابة الصحيحة</div>
        ${opts.map((o, oi) => `
          <div class="flex items-center gap-2 mb-1">
            <input type="radio" name="mcqcorrect${idx}" value="${oi}" ${correct === oi ? "checked" : ""}>
            <input class="field q-option" data-oi="${oi}" placeholder="اختيار ${oi + 1}" value="${escapeHtml(o || "")}">
          </div>`).join("")}`;
    }
  }
  renderOptions();
  wrap.querySelector(".q-type").addEventListener("change", renderOptions);
  wrap.querySelector("[data-remove-q]").addEventListener("click", () => wrap.remove());
}

document.getElementById("addQuestionBtn").addEventListener("click", () => addQuestionRow());

function collectQuestions() {
  const questions = [];
  questionsBuilder.querySelectorAll("[data-qid]").forEach(wrap => {
    const text = wrap.querySelector(".q-text").value.trim();
    const type = wrap.querySelector(".q-type").value;
    if (type === "tf") {
      const checked = wrap.querySelector(`input[name^="tfcorrect"]:checked`);
      questions.push({ text, type: "tf", correctIndex: checked ? Number(checked.value) : 0 });
    } else {
      const options = [...wrap.querySelectorAll(".q-option")].map(i => i.value.trim());
      const checked = wrap.querySelector(`input[name^="mcqcorrect"]:checked`);
      questions.push({ text, type: "mcq", options, correctIndex: checked ? Number(checked.value) : 0 });
    }
  });
  return questions;
}

async function loadExamsAdmin() {
  examsAdminList.innerHTML = `<div class="item-card skeleton h-14"></div>`;
  const snap = await getDocs(collection(db, "exams"));
  if (snap.empty) { examsAdminList.innerHTML = `<p class="text-sm opacity-60">لا توجد امتحانات بعد.</p>`; return; }
  examsAdminList.innerHTML = "";
  snap.forEach(docu => {
    const d = docu.data();
    examsAdminList.insertAdjacentHTML("beforeend", `
      <div class="item-card">
        <div class="flex-1">
          <div class="font-bold">${escapeHtml(d.title)}</div>
          <div class="text-xs opacity-60">${GRADE_LABELS[d.grade] || d.grade} · ${(d.questions || []).length} سؤال</div>
        </div>
        <button class="btn btn-outline btn-sm" data-edit="${docu.id}">تعديل</button>
        <button class="btn btn-danger btn-sm" data-del="${docu.id}">حذف</button>
      </div>`);
  });
  examsAdminList.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editExam(b.dataset.edit)));
  examsAdminList.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => delExam(b.dataset.del)));
}

async function editExam(id) {
  const snap = await getDoc(doc(db, "exams", id));
  if (!snap.exists()) return;
  const d = snap.data();
  document.getElementById("exam_id").value = id;
  document.getElementById("exam_title").value = d.title || "";
  document.getElementById("exam_grade").value = d.grade || "1";
  questionsBuilder.innerHTML = "";
  (d.questions || []).forEach(q => addQuestionRow(q));
  document.getElementById("examCancelEdit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function delExam(id) {
  if (!confirm("هل تريد حذف هذا الامتحان نهائياً؟")) return;
  await deleteDoc(doc(db, "exams", id));
  loadExamsAdmin();
}

document.getElementById("examCancelEdit").addEventListener("click", () => {
  examForm.reset();
  document.getElementById("exam_id").value = "";
  questionsBuilder.innerHTML = "";
  document.getElementById("examCancelEdit").classList.add("hidden");
});

examForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("exam_id").value;
  const payload = {
    title: document.getElementById("exam_title").value.trim(),
    grade: document.getElementById("exam_grade").value,
    questions: collectQuestions(),
    updatedAt: Date.now()
  };
  if (id) {
    await updateDoc(doc(db, "exams", id), payload);
  } else {
    payload.createdAt = Date.now();
    await addDoc(collection(db, "exams"), payload);
  }
  examForm.reset();
  document.getElementById("exam_id").value = "";
  questionsBuilder.innerHTML = "";
  document.getElementById("examCancelEdit").classList.add("hidden");
  loadExamsAdmin();
});

/* =====================================================================
   الطلاب
   ===================================================================== */
const studentForm = document.getElementById("studentForm");
const studentsAdminList = document.getElementById("studentsAdminList");

async function loadStudentsAdmin() {
  studentsAdminList.insertAdjacentHTML("beforeend", `
      <div class="item-card">
        <div class="flex-1">
          <div class="font-bold">${escapeHtml(d.name)}</div>
          <div class="text-xs opacity-60">${GRADE_LABELS[d.grade] || d.grade} · الكود: <span class="font-bold" style="color:var(--gold)">${escapeHtml(String(d.code || "—"))}</span></div>
        </div>
        <button class="btn btn-danger btn-sm" data-del="${docu.id}">حذف</button>
      </div>`);
  });
  studentsAdminList.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("حذف هذا الطالب؟")) return;
    await deleteDoc(doc(db, "students", b.dataset.del));
    loadStudentsAdmin();
  }));
}

studentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = String(Math.floor(1000 + Math.random() * 9000));
  await addDoc(collection(db, "students"), {
    name: document.getElementById("student_name").value.trim(),
    grade: document.getElementById("student_grade").value,
    code,
    createdAt: Date.now()
  });
  studentForm.reset();
  loadStudentsAdmin();
  alert(`تم إضافة الطالب بنجاح. الكود السري الخاص به: ${code}\nاكتبه وسلّمه للطالب.`);
});

/* =====================================================================
   الحضور والغياب
   ===================================================================== */
const attGradeSel = document.getElementById("att_grade");
const attDateInput = document.getElementById("att_date");
const attendanceStudentList = document.getElementById("attendanceStudentList");
attDateInput.value = new Date().toISOString().slice(0, 10);

async function loadAttendanceRoster() {
  attendanceStudentList.innerHTML = `<div class="item-card skeleton h-12"></div>`;
  const q = query(collection(db, "students"), where("grade", "==", attGradeSel.value));
  const snap = await getDocs(q);
  if (snap.empty) {
    attendanceStudentList.innerHTML = `<p class="text-sm opacity-60">لا يوجد طلاب في هذه المرحلة، أضفهم من تبويب الطلاب.</p>`;
    return;
  }
  attendanceStudentList.innerHTML = "";
  snap.forEach(docu => {
    const d = docu.data();
    attendanceStudentList.insertAdjacentHTML("beforeend", `
      <label class="option-row">
        <input type="checkbox" class="att-check" value="${docu.id}">
        <span>${escapeHtml(d.name)}</span>
        <span class="text-xs opacity-50">(علّم عند الغياب)</span>
      </label>`);
  });
}

attGradeSel.addEventListener("change", loadAttendanceRoster);

document.getElementById("saveAttendanceBtn").addEventListener("click", async () => {
  const absentIds = [...document.querySelectorAll(".att-check:checked")].map(c => c.value);
  const key = `${attGradeSel.value}_${attDateInput.value}`;
  await setDoc(doc(db, "attendance", key), {
    grade: attGradeSel.value,
    date: attDateInput.value,
    absentStudentIds: absentIds,
    updatedAt: Date.now()
  });
  document.getElementById("attendanceSavedMsg").classList.remove("hidden");
  setTimeout(() => document.getElementById("attendanceSavedMsg").classList.add("hidden"), 2500);
  loadAttendanceHistory();
});

async function loadAttendanceHistory() {
  const box = document.getElementById("attendanceHistory");
  box.innerHTML = `<div class="item-card skeleton h-12"></div>`;
  const snap = await getDocs(collection(db, "attendance"));
  if (snap.empty) { box.innerHTML = `<p class="text-sm opacity-60">لا يوجد سجل غياب بعد.</p>`; return; }
  const rows = [];
  snap.forEach(docu => rows.push(docu.data()));
  rows.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  box.innerHTML = "";
  rows.slice(0, 20).forEach(d => {
    box.insertAdjacentHTML("beforeend", `
      <div class="item-card">
        <div class="flex-1">
          <div class="font-bold">${d.date} — ${GRADE_LABELS[d.grade] || d.grade}</div>
          <div class="text-xs opacity-60">عدد الغائبين: ${(d.absentStudentIds || []).length}</div>
        </div>
      </div>`);
  });
}

/* ============== تشغيل أولي ============== */
loadLessonsAdmin();
loadExamsAdmin();
loadStudentsAdmin();
loadAttendanceRoster();
loadAttendanceHistory();
