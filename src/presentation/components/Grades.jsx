import { useEffect, useState } from "react";
import { SubjectService } from "../../business/services/SubjectService";
import Button from "./ui/Button";

export default function Grades({ uid, activeSemester, subjects = [], labsBySubject = {} }) {
  const [local, setLocal] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const map = {};
    (subjects || []).forEach((s) => {
      map[s.id] = { modules: Array.isArray(s.modules) ? s.modules.map((m) => ({ ...m })) : [] };
    });
    setLocal(map);
  }, [subjects]);

  useEffect(() => {
    setExpanded((prev) => {
      const next = {};
      (subjects || []).forEach((s) => {
        next[s.id] = prev[s.id] || false;
      });
      return next;
    });
  }, [subjects]);

  if (!activeSemester) return <div className="card text-slate-600">Активуйте семестр, щоб працювати з оцінками.</div>;

  const setModuleField = (sid, idx, key, value) => {
    setLocal((prev) => {
      const mods = [...(prev[sid]?.modules || [])];
      mods[idx] = { ...(mods[idx] || {}), [key]: value };
      return { ...prev, [sid]: { modules: mods } };
    });
  };

  const addModule = (sid) => {
    setLocal((prev) => {
      const mods = [...(prev[sid]?.modules || [])];
      mods.push({ name: `Модуль ${mods.length + 1}`, max: "", obtained: "" });
      return { ...prev, [sid]: { modules: mods } };
    });
  };

  const removeModule = (sid, idx) => {
    setLocal((prev) => {
      const mods = [...(prev[sid]?.modules || [])];
      mods.splice(idx, 1);
      return { ...prev, [sid]: { modules: mods } };
    });
  };

  const save = async (sid) => {
    const mods = (local[sid]?.modules || []).map((m) => ({
      name: String(m.name || "Модуль"),
      max: Number(m.max || 0) || 0,
      obtained: Number(m.obtained || 0) || 0,
    }));
    await SubjectService.patch(uid, activeSemester.id, sid, { modules: mods });
  };

  const totalsFor = (sid) => {
    const mods = local[sid]?.modules || [];
    const labs = labsBySubject[sid] || [];
    const labsMax = labs.reduce((sum, l) => sum + (Number(l.maxScore) || 0), 0);
    const labsObt = labs.reduce((sum, l) => sum + (Number(l.obtainedScore) || 0), 0);
    const modulesMax = mods.reduce((sum, m) => sum + (Number(m.max) || 0), 0);
    const modulesObt = mods.reduce((sum, m) => sum + (Number(m.obtained) || 0), 0);
    const totalMax = labsMax + modulesMax;
    const totalObt = labsObt + modulesObt;
    const pct = totalMax ? Math.round((totalObt / totalMax) * 100) : 0;
    return { totalMax, totalObt, pct, labs, mods };
  };

  const toggleSubject = (sid) => {
    setExpanded((prev) => ({ ...prev, [sid]: !prev[sid] }));
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <p className="text-sm text-slate-500">Панель успішності</p>
        <h3 className="text-2xl font-semibold text-slate-900">Успішність за предметами</h3>
        <p className="text-sm text-slate-500">Відстежуйте бали за лабораторні роботи та модулі, щоб мати повну картину прогресу.</p>
      </div>

      <div className="space-y-4">
        {subjects.map((s) => {
          const { totalMax, totalObt, pct, labs, mods } = totalsFor(s.id);
          const isOpen = !!expanded[s.id];

          return (
            <div key={s.id} className="card">
              <button type="button" className="w-full flex items-center justify-between text-left" onClick={() => toggleSubject(s.id)}>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{s.title}</p>
                  <p className="text-sm text-slate-500">
                    Набрано балів {totalObt}/{totalMax} ({pct}%)
                  </p>
                </div>
                <span className="text-2xl text-slate-400">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && (
                <div className="mt-4 space-y-5">
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Лабораторні роботи</p>
                    <div className="border border-slate-200 rounded-2xl divide-y responsive-table">
                      <div className="grid grid-cols-[1fr_120px_120px] text-xs uppercase tracking-wide text-slate-500 responsive-table__header">
                        <div className="px-3 py-2">Назва</div>
                        <div className="px-3 py-2 text-right">Отримано</div>
                        <div className="px-3 py-2 text-right">Макс.</div>
                      </div>
                      {labs.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-slate-500">Ще немає лабораторних робіт.</div>
                      ) : (
                        labs.map((l) => (
                          <div key={l.id} className="grid grid-cols-[1fr_120px_120px] text-sm text-slate-600 responsive-table__row">
                            <div className="px-3 py-2 responsive-table__cell">
                              <span className="responsive-table__cell-label">Назва</span>
                              Лабораторна №{l.number}
                              {l.topic ? ` — ${l.topic}` : ""}
                            </div>
                            <div className="px-3 py-2 text-right responsive-table__cell">
                              <span className="responsive-table__cell-label">Отримано</span>
                              {l.obtainedScore ?? "—"}
                            </div>
                            <div className="px-3 py-2 text-right responsive-table__cell">
                              <span className="responsive-table__cell-label">Макс.</span>
                              {l.maxScore}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-slate-500">Модулі</p>
                      <Button onClick={() => addModule(s.id)}>+ Додати модуль</Button>
                    </div>
                    <div className="space-y-3">
                      {mods.map((m, i) => (
                        <div key={i} className="grid grid-cols-[1fr_140px_140px_auto] gap-3 module-row">
                          <input className="input" placeholder="Назва" value={m.name ?? ""} onChange={(e) => setModuleField(s.id, i, "name", e.target.value)} />
                          <input className="input text-right" placeholder="Отримано" value={m.obtained ?? ""} onChange={(e) => setModuleField(s.id, i, "obtained", e.target.value)} />
                          <input className="input text-right" placeholder="Макс." value={m.max ?? ""} onChange={(e) => setModuleField(s.id, i, "max", e.target.value)} />
                          <Button variant="danger" onClick={() => removeModule(s.id, i)}>
                            Видалити
                          </Button>
                        </div>
                      ))}
                      {mods.length === 0 && <div className="text-sm text-slate-500">Модулі ще не додані.</div>}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="primary" onClick={() => save(s.id)}>
                      Зберегти оцінки
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {subjects.length === 0 && <div className="card text-center text-slate-500 py-10">Список оцінок поки що порожній, додайте предмети й поверніться сюди пізніше.</div>}
      </div>
    </div>
  );
}
