import { useEffect, useState } from "react";
import { SemesterService } from "../../business/services/SemesterService";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

export default function SemesterManagerUI({ uid, semesters, setSemesters, activeSemester, setActiveSemester }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ number: "", title: "", startDate: "", endDate: "" });
  const [edit, setEdit] = useState({ open: false, id: null, form: { number: "", title: "", startDate: "", endDate: "" } });

  useEffect(() => {
    const unsub = SemesterService.listen(uid, setSemesters);
    return () => unsub && unsub();
  }, [uid, setSemesters]);

  useEffect(() => {
    setActiveSemester(SemesterService.getActive(semesters));
  }, [semesters, setActiveSemester]);

  const create = async () => {
    if (!form.number.trim()) return alert("Вкажіть номер семестру.");
    await SemesterService.add(uid, {
      number: form.number,
      title: form.title,
      startDate: form.startDate,
      endDate: form.endDate,
    });
    setForm({ number: "", title: "", startDate: "", endDate: "" });
    setOpen(false);
  };

  const makeActive = async (id) => {
    await SemesterService.setActive(uid, semesters, id);
  };

  const remove = async (id) => {
    if (confirm("Видалити семестр назавжди?")) {
      await SemesterService.remove(uid, id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Хронологія навчання</p>
          <h3 className="text-2xl font-semibold text-slate-900">Менеджер семестрів</h3>
          <p className="text-sm text-slate-500">Керуйте датами, статусом та назвами семестрів</p>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          + Створити семестр
        </Button>
      </div>

      <div className="space-y-3">
        {semesters.map((s) => {
          const isActive = s.active;
          return (
            <div
              key={s.id}
              className={`card flex flex-wrap items-center justify-between gap-4 ${isActive ? "border-blue-200 bg-blue-50/40" : ""}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-slate-900">Семестр {s.number}</p>
                  {s.title && <span className="badge">{s.title}</span>}
                  {isActive && <span className="badge badge-accent">Активний</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {s.startDate ? new Date(s.startDate).toLocaleDateString() : "—"} — {s.endDate ? new Date(s.endDate).toLocaleDateString() : "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!isActive && (
                  <Button onClick={() => makeActive(s.id)} variant="ghost">
                    Зробити активним
                  </Button>
                )}
                <Button onClick={() => setEdit({ open: true, id: s.id, form: { number: s.number || "", title: s.title || "", startDate: s.startDate || "", endDate: s.endDate || "" } })}>
                  Редагувати
                </Button>
                <Button variant="danger" onClick={() => remove(s.id)}>
                  Видалити
                </Button>
              </div>
            </div>
          );
        })}

        {semesters.length === 0 && <div className="card text-center text-slate-500 py-10">Ще не створено жодного семестру.</div>}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Новий семестр"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button variant="primary" onClick={create}>
              Створити
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <input className="input" placeholder="Номер (наприклад, 5)" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          <input className="input" placeholder="Назва (Осінь 2025...)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input" type="date" placeholder="Початок" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <input className="input" type="date" placeholder="Кінець" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={edit.open}
        onClose={() => setEdit({ open: false, id: null, form: { number: "", title: "", startDate: "", endDate: "" } })}
        title="Редагування семестру"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit({ open: false, id: null, form: { number: "", title: "", startDate: "", endDate: "" } })}>
              Скасувати
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                await SemesterService.patch(uid, edit.id, edit.form);
                setEdit({ open: false, id: null, form: { number: "", title: "", startDate: "", endDate: "" } });
              }}
            >
              Зберегти
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <input className="input" placeholder="Номер" value={edit.form.number} onChange={(e) => setEdit({ ...edit, form: { ...edit.form, number: e.target.value } })} />
          <input className="input" placeholder="Назва" value={edit.form.title} onChange={(e) => setEdit({ ...edit, form: { ...edit.form, title: e.target.value } })} />
          <input className="input" type="date" placeholder="Початок" value={edit.form.startDate} onChange={(e) => setEdit({ ...edit, form: { ...edit.form, startDate: e.target.value } })} />
          <input className="input" type="date" placeholder="Кінець" value={edit.form.endDate} onChange={(e) => setEdit({ ...edit, form: { ...edit.form, endDate: e.target.value } })} />
        </div>
      </Modal>
    </div>
  );
}
