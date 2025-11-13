import { useEffect, useState } from "react";
import { LabService } from "../../business/services/LabService";
import { GradeCalculator } from "../../business/services/GradeCalculator";
import { STATUS, normalizeStatus } from "../../models/LabWork";
import LabModal from "./LabModal";
import Button from "./ui/Button";
import Modal from "./ui/Modal";

export default function SubjectDetail({ uid, semesterId, subject, onBack }) {
  const [labs, setLabs] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ topic: "", maxScore: "" });
  const [modal, setModal] = useState({ open: false, lab: null });
  const [edit, setEdit] = useState({ open: false, lab: null, form: { topic: "", maxScore: "" } });

  useEffect(() => {
    const unsub = LabService.listen(uid, semesterId, subject.id, setLabs);
    return () => unsub && unsub();
  }, [uid, semesterId, subject.id]);

  const add = async () => {
    if (!createForm.maxScore) return alert("Вкажіть максимальний бал.");
    await LabService.add(uid, semesterId, subject.id, labs, { topic: createForm.topic, maxScore: Number(createForm.maxScore) });
    setCreateForm({ topic: "", maxScore: "" });
    setOpenCreate(false);
  };

  const changeStatus = async (lab, status) => {
    if (status === STATUS.DEFENDED) {
      setModal({ open: true, lab });
    } else {
      await LabService.patch(uid, semesterId, subject.id, lab.id, { status });
    }
  };

  const remove = async (labId) => {
    if (confirm("Видалити лабораторну?")) await LabService.remove(uid, semesterId, subject.id, labId);
  };

  const totals = GradeCalculator.subjectTotals(labs);

  const STATUS_LABELS = {
    [STATUS.NOT_STARTED]: "Не розпочато",
    [STATUS.IN_PROGRESS]: "У процесі",
    [STATUS.DONE]: "Виконано",
    [STATUS.DEFENDED]: "Захищено",
  };

  const statusDot = (st) => {
    const normalized = normalizeStatus(st);
    const color =
      normalized === STATUS.NOT_STARTED
        ? "#cbd5f5"
        : normalized === STATUS.IN_PROGRESS
          ? "#fbbf24"
          : normalized === STATUS.DONE
            ? "#34d399"
            : "#2b5eff";
    return <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Назад до списку
        </Button>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="badge badge-accent">
            Прогрес: {totals.obtained}/{totals.maxTotal} ({totals.percent}%)
          </div>
          <Button variant="primary" onClick={() => setOpenCreate(true)}>
            + Додати лабораторну
          </Button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-2xl font-semibold text-slate-900">{subject.title}</h3>
        {subject.teacher && <p className="text-sm text-slate-500 mt-1">{subject.teacher}</p>}
      </div>

      <div className="space-y-3">
        {labs.map((l) => (
          <div key={l.id} className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 min-w-0 md:flex-1">
              {statusDot(l.status)}
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-slate-900 flex items-center gap-2 min-w-0">
                  <span className="whitespace-nowrap">Лабораторна №{l.number}</span>
                  {l.topic && (
                    <span className="text-slate-500 font-normal truncate inline-block max-w-full" title={l.topic}>
                      • {l.topic}
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  Макс: {l.maxScore} · Отримано: {l.obtainedScore ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap w-full md:w-auto">
              <select className="select max-w-[220px] w-full md:w-auto" value={normalizeStatus(l.status)} onChange={(e) => changeStatus(l, e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Button onClick={() => setEdit({ open: true, lab: l, form: { topic: l.topic || "", maxScore: String(l.maxScore || "") } })}>
                Редагувати
              </Button>
              <Button variant="danger" onClick={() => remove(l.id)}>
                Видалити
              </Button>
            </div>
          </div>
        ))}
        {labs.length === 0 && <div className="card text-center text-slate-500 py-10">Ще немає лабораторних. Додайте першу роботу.</div>}
      </div>

      <LabModal open={modal.open} onClose={() => setModal({ open: false, lab: null })} uid={uid} semesterId={semesterId} subjectId={subject.id} lab={modal.lab} maxScore={modal.lab?.maxScore} />

      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Нова лабораторна"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>
              Скасувати
            </Button>
            <Button variant="primary" onClick={add}>
              Додати
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <input className="input" placeholder="Тема" value={createForm.topic} onChange={(e) => setCreateForm({ ...createForm, topic: e.target.value })} />
          <input className="input" placeholder="Максимальний бал" value={createForm.maxScore} onChange={(e) => setCreateForm({ ...createForm, maxScore: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={edit.open}
        onClose={() => setEdit({ open: false, lab: null, form: edit.form })}
        title="Редагування лабораторної"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit({ open: false, lab: null, form: { topic: "", maxScore: "" } })}>
              Скасувати
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                await LabService.patch(uid, semesterId, subject.id, edit.lab.id, {
                  topic: edit.form.topic,
                  maxScore: Number(edit.form.maxScore) || 0,
                });
                setEdit({ open: false, lab: null, form: { topic: "", maxScore: "" } });
              }}
            >
              Зберегти
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <input className="input" placeholder="Тема" value={edit.form.topic} onChange={(e) => setEdit({ ...edit, form: { ...edit.form, topic: e.target.value } })} />
          <input className="input" placeholder="Максимальний бал" value={edit.form.maxScore} onChange={(e) => setEdit({ ...edit, form: { ...edit.form, maxScore: e.target.value } })} />
        </div>
      </Modal>
    </div>
  );
}
