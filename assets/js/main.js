// عناصر مشتركة بين كل الصفحات: الهيدر، الفوتر، أسماء المراحل
export const GRADE_LABELS = {
  "1": "الأول الإعدادي",
  "2": "الثاني الإعدادي",
  "3": "الثالث الإعدادي",
  "grammar": "النحو والبلاغة"
};

export function renderHeader(activeGrade = "") {
  return `
  <header class="site-header">
    <div class="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
      <a href="/index.html" class="flex items-center gap-3 text-inherit no-underline">
        <span class="brand-mark">أ</span>
        <div>
          <div class="font-bold leading-tight">الأستاذ أحمد</div>
          <div class="text-xs opacity-70 leading-tight">منصة اللغة العربية</div>
        </div>
      </a>
      <nav class="hidden sm:flex items-center gap-1">
        <a href="/grade.html?grade=1" class="nav-link">الأول الإعدادي</a>
        <a href="/grade.html?grade=2" class="nav-link">الثاني الإعدادي</a>
        <a href="/grade.html?grade=3" class="nav-link">الثالث الإعدادي</a>
        <a href="/grade.html?grade=grammar" class="nav-link">النحو والبلاغة</a>
      </nav>
      <button id="menuBtn" class="sm:hidden nav-link" aria-label="القائمة">☰</button>
    </div>
    <nav id="mobileMenu" class="sm:hidden hidden flex-col px-4 pb-3 gap-1">
      <a href="/grade.html?grade=1" class="nav-link block">الأول الإعدادي</a>
      <a href="/grade.html?grade=2" class="nav-link block">الثاني الإعدادي</a>
      <a href="/grade.html?grade=3" class="nav-link block">الثالث الإعدادي</a>
      <a href="/grade.html?grade=grammar" class="nav-link block">النحو والبلاغة</a>
    </nav>
    <div class="ornament-divider"></div>
  </header>`;
}

export function renderFooter() {
  const year = new Date().getFullYear();
  const student = getStudentSession();
  const studentLinks = student
    ? `<div class="text-xs mt-2">
         مرحباً <span class="font-bold">${escapeHtml(student.name)}</span> ·
         <a href="/results.html" class="opacity-70 hover:opacity-100">نتائجي</a> ·
         <a href="#" id="studentLogoutLink" class="opacity-70 hover:opacity-100">خروج</a>
       </div>`
    : `<a href="/student-login.html" class="opacity-40 hover:opacity-80 text-xs">دخول الطالب</a>`;
  return `
  <footer class="mt-16 border-t" style="border-color:var(--line)">
    <div class="max-w-6xl mx-auto px-4 py-8 text-center text-sm" style="color:var(--ink-2)">
      <div class="font-bold mb-1">أ / أحمد أبوالحسن — معلم لغة عربية</div>
      <div class="opacity-70 mb-1">للتواصل: 01029307604</div>
      <div class="opacity-70">جميع الحقوق محفوظة © ${year}</div>
<a href="/admin/login.html" class="opacity-40 hover:opacity-80 text-xs">لوحة التحكم</a>
      <div class="text-xs mt-1">
        <a href="/leaderboard.html" class="opacity-70 hover:opacity-100">🏆 ترتيب الطلاب</a>
      </div>
      ${studentLinks}
    </div>
  </footer>`;
}

/* ============== جلسة تسجيل دخول الطالب (بدون Firebase Auth) ============== */
const STUDENT_SESSION_KEY = "studentSession";

export function getStudentSession() {
  try {
    const raw = localStorage.getItem(STUDENT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStudentSession(data) {
  localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(data));
}

export function clearStudentSession() {
  localStorage.removeItem(STUDENT_SESSION_KEY);
}

export function mountLayout() {
  document.getElementById("app-header").innerHTML = renderHeader();
  document.getElementById("app-footer").innerHTML = renderFooter();
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  if (btn) btn.addEventListener("click", () => menu.classList.toggle("hidden"));
  const logoutLink = document.getElementById("studentLogoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      clearStudentSession();
      location.href = "/index.html";
    });
  }
}

export function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}
