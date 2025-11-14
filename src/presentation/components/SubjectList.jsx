import { useEffect, useState } from "react";
import { SubjectService } from "../../business/services/SubjectService";
import Button from "./ui/Button";
import Modal from "./ui/Modal";

export default function SubjectList({ uid, activeSemester, onOpenSubject }) {
  const [subjects, setSubjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", teacher: "", controlType: "", iconUrl: "" });
  const [file, setFile] = useState(null);
  const [edit, setEdit] = useState({ open: false, id: null, form: { title: "", teacher: "", controlType: "", iconUrl: "" }, file: null });
  const [saving, setSaving] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const canUpload = (f) => {
    if (!f) return false;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(f.type)) {
      alert("Дозволені лише PNG, JPG/JPEG або WEBP (до 5 МБ).");
      return false;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert("Файл завеликий. Обмеження — 5 МБ.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!activeSemester) return;
    const unsub = SubjectService.listen(uid, activeSemester.id, setSubjects);
    return () => unsub && unsub();
  }, [uid, activeSemester]);

  const resetForm = () => setForm({ title: "", teacher: "", controlType: "", iconUrl: "" });

  const add = async () => {
    if (!form.title.trim()) return alert("Додайте назву предмета.");
    setSaving(true);
    try {
      const docRef = await SubjectService.add(uid, activeSemester.id, form);
      if (file && docRef?.id && canUpload(file)) {
        try {
          const { storage } = await import("../../firebase");
          const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
          const path = `users/${uid}/subjects/${docRef.id}/icon`;
          const sref = ref(storage, path);
          const snap = await uploadBytes(sref, file, { contentType: file.type || undefined });
          const url = await getDownloadURL(snap.ref);
          await SubjectService.patch(uid, activeSemester.id, docRef.id, { iconUrl: url });
          setSubjects((prev) => prev.map((s) => (s.id === docRef.id ? { ...s, iconUrl: url } : s)));
        } catch (e) {
          console.error("Upload icon failed", e);
          alert(`Не вдалося завантажити іконку: ${e?.message || e?.code || "невідома помилка"}`);
        }
      }
      resetForm();
      setFile(null);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (confirm("Видалити предмет?")) {
      await SubjectService.remove(uid, activeSemester.id, id);
    }
  };

  if (!activeSemester) {
    return <div className="card text-slate-600">Спершу активуйте семестр, щоб працювати зі списком предметів.</div>;
  }

  const openEditModal = (subject) => {
    setEdit({
      open: true,
      id: subject.id,
      form: {
        title: subject.title || "",
        teacher: subject.teacher || "",
        controlType: subject.controlType || "",
        iconUrl: subject.iconUrl || "",
      },
      file: null,
    });
  };

  const onEditSave = async () => {
    if (!edit.id) return;
    setSavingEdit(true);
    try {
      await SubjectService.patch(uid, activeSemester.id, edit.id, edit.form);
      if (edit.file && canUpload(edit.file)) {
        const { storage } = await import("../../firebase");
        const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
        const path = `users/${uid}/subjects/${edit.id}/icon`;
        const sref = ref(storage, path);
        const snap = await uploadBytes(sref, edit.file, { contentType: edit.file.type || undefined });
        const url = await getDownloadURL(snap.ref);
        await SubjectService.patch(uid, activeSemester.id, edit.id, { iconUrl: url });
        setSubjects((prev) => prev.map((s) => (s.id === edit.id ? { ...s, iconUrl: url } : s)));
      }
      setEdit({ open: false, id: null, form: { title: "", teacher: "", controlType: "", iconUrl: "" }, file: null });
    } catch (e) {
      alert(`Не вдалося зберегти: ${e?.message || e?.code || "невідомо"}`);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Активний семестр {activeSemester.number}</p>
          <h3 className="text-2xl font-semibold text-slate-900">Список предметів</h3>
          <p className="text-sm text-slate-500">Додавайте іконки, викладача та тип контролю.</p>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          + Додати предмет
        </Button>
      </div>

      {subjects.length === 0 ? (
        <div className="card text-center text-slate-500 py-12">У цьому семестрі ще немає предметів.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {subjects.map((s) => (
            <div key={s.id} className="card flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="subject-icon">
                  {s.iconUrl ? <img src={s.iconUrl} alt="icon" /> : <div className="w-full h-full rounded-full bg-slate-200" />}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-slate-900 truncate">{s.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-sm">
                    {s.controlType && <span className="badge badge-accent">{s.controlType}</span>}
                    {s.teacher && <span className="badge">{s.teacher}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onOpenSubject(s)}>Переглянути</Button>
                <Button onClick={() => openEditModal(s)}>Редагувати</Button>
                <Button variant="danger" onClick={() => remove(s.id)}>
                  Видалити
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Новий предмет"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Скасувати
            </Button>
            <Button variant="primary" onClick={add} disabled={saving}>
              {saving ? "Зберігаємо…" : "Додати"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <input className="input" placeholder="Назва предмета" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input" placeholder="Викладач / куратор" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
          <input className="input" placeholder="Форма контролю (іспит, залік…)" value={form.controlType} onChange={(e) => setForm({ ...form, controlType: e.target.value })} />
          <input className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file && (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100">
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
              </div>
              <span>Попередній перегляд іконки</span>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={edit.open}
        onClose={() => setEdit({ open: false, id: null, form: edit.form, file: null })}
        title="Редагування предмета"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setEdit({ open: false, id: null, form: { title: "", teacher: "", controlType: "", iconUrl: "" }, file: null })}
              disabled={savingEdit}
            >
              Скасувати
            </Button>
            <Button variant="primary" onClick={onEditSave} disabled={savingEdit}>
              {savingEdit ? "Оновлюємо…" : "Зберегти"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <input className="input" placeholder="Назва предмета" value={edit.form.title} onChange={(e) => setEdit({ ...edit, form: { ...edit.form, title: e.target.value } })} />
          <input className="input" placeholder="Викладач" value={edit.form.teacher} onChange={(e) => setEdit({ ...edit, form: { ...edit.form, teacher: e.target.value } })} />
          <input className="input" placeholder="Форма контролю" value={edit.form.controlType} onChange={(e) => setEdit({ ...edit, form: { ...edit.form, controlType: e.target.value } })} />
          <input className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setEdit({ ...edit, file: e.target.files?.[0] || null })} />
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100">
              {edit.file ? (
                <img src={URL.createObjectURL(edit.file)} alt="preview" className="w-full h-full object-cover" />
              ) : edit.form.iconUrl ? (
                <img src={edit.form.iconUrl} alt="icon" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200" />
              )}
            </div>
            <span>Поточна іконка предмета</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

