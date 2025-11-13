import { useEffect, useState } from "react";
import { LabService } from "../../business/services/LabService";
import { STATUS } from "../../models/LabWork";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

export default function LabModal({ open, onClose, uid, semesterId, subjectId, lab, maxScore }) {
  const [score, setScore] = useState(lab?.obtainedScore ?? "");

  useEffect(() => {
    setScore(lab?.obtainedScore ?? "");
  }, [lab]);

  if (!open || !lab) return null;

  const save = async () => {
    const value = Number(score);
    if (Number.isNaN(value) || value < 0 || value > Number(maxScore)) {
      return alert("Введіть коректний бал у дозволеному діапазоні.");
    }
    await LabService.patch(uid, semesterId, subjectId, lab.id, { obtainedScore: value, status: STATUS.DEFENDED });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Підтвердження захисту (макс. ${maxScore})`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Скасувати
          </Button>
          <Button variant="primary" onClick={save}>
            Зберегти
          </Button>
        </>
      }
    >
      <p className="text-sm">
        Укажіть кількість балів, отриманих за роботу. Після збереження статус зміниться на «Захищено».
      </p>
      <input className="input" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Отримано балів" />
    </Modal>
  );
}
