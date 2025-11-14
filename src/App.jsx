import { useEffect, useMemo, useState } from "react";
import "./index.css";

import Dashboard from "./presentation/components/Dashboard";
import Grades from "./presentation/components/Grades";
import SemesterManagerUI from "./presentation/components/SemesterManagerUI";
import SubjectList from "./presentation/components/SubjectList";
import SubjectDetail from "./presentation/components/SubjectDetail";
import Button from "./presentation/components/ui/Button";

import { UserManager } from "./business/managers/UserManager";
import { SemesterService } from "./business/services/SemesterService";
import { SubjectService } from "./business/services/SubjectService";
import { LabService } from "./business/services/LabService";

export default function App() {
  const [user, setUser] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [labsBySubject, setLabsBySubject] = useState({});
  const [openSubject, setOpenSubject] = useState(null);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    const unsub = UserManager.onAuth((currentUser) => setUser(currentUser));
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = SemesterService.listen(user.uid, setSemesters);
    return () => unsub && unsub();
  }, [user]);

  useEffect(() => {
    setActiveSemester(SemesterService.getActive(semesters));
  }, [semesters]);

  useEffect(() => {
    if (!user || !activeSemester) return;
    const unsub = SubjectService.listen(user.uid, activeSemester.id, setSubjects);
    return () => unsub && unsub();
  }, [user, activeSemester]);

  useEffect(() => {
    if (!user || !activeSemester) return;
    const unsubs = subjects.map((subject) =>
      LabService.listen(user.uid, activeSemester.id, subject.id, (labs) => {
        setLabsBySubject((prev) => ({ ...prev, [subject.id]: labs }));
      })
    );
    return () => unsubs.forEach((fn) => fn && fn());
  }, [user, activeSemester, subjects]);

  const navItems = useMemo(
    () => [
      { id: "dashboard", label: "Аналітика" },
      { id: "subjects", label: "Предмети" },
      { id: "grades", label: "Оцінки" },
      { id: "semesters", label: "Семестри" },
    ],
    []
  );

  const goTo = (next) => {
    setTab(next);
    setOpenSubject(null);
  };

  if (!user) {
    return (
      <div className="app-shell flex items-center justify-center px-4 py-10">
        <div className="max-w-xl w-full card text-center space-y-6">
          <img src="/logo.svg" alt="StudyTrack" className="mx-auto h-20" />
          <h1 className="text-3xl font-semibold text-slate-900">StudyTrack</h1>
          <p className="text-slate-600">
            Ведіть семестри, предмети та лабораторні в охайному кабінеті. Прогрес, дедлайни й оцінки завжди під рукою.
          </p>
          <Button variant="primary" className="px-6 py-3 text-base" onClick={UserManager.login}>
            Увійти через Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="max-w-[1200px] mx-auto px-4 py-4 inner">
          <div className="brand">
            <img src="/logo.svg" alt="StudyTrack" />
            <h1 className="brand-title">StudyTrack</h1>
          </div>

          <nav className="app-nav">
            {navItems.map((item) => (
              <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => goTo(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="user-meta flex items-center gap-3 justify-end">
            <div className="text-right">
              <p className="text-sm text-slate-500">{user.displayName || "Користувач"}</p>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
            <Button variant="ghost" onClick={UserManager.logout}>
              Вийти
            </Button>
          </div>
        </div>
      </header>

      <main className="app-content space-y-6">
        {tab === "dashboard" && (
          <Dashboard activeSemesterNumber={activeSemester?.number} activeSemester={activeSemester} subjects={subjects} labsBySubject={labsBySubject} />
        )}

        {tab === "subjects" && !openSubject && <SubjectList uid={user.uid} activeSemester={activeSemester} onOpenSubject={setOpenSubject} />}

        {tab === "subjects" && openSubject && activeSemester && (
          <SubjectDetail uid={user.uid} semesterId={activeSemester.id} subject={openSubject} onBack={() => setOpenSubject(null)} />
        )}

        {tab === "grades" && <Grades uid={user.uid} activeSemester={activeSemester} subjects={subjects} labsBySubject={labsBySubject} />}

        {tab === "semesters" && (
          <SemesterManagerUI
            uid={user.uid}
            semesters={semesters}
            setSemesters={setSemesters}
            activeSemester={activeSemester}
            setActiveSemester={setActiveSemester}
          />
        )}
      </main>
    </div>
  );
}
