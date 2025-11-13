import dayjs from "dayjs";
import { isCompletedStatus } from "../../models/LabWork";

export default function DashboardExtra({ activeSemester, subjects, labsBySubject }) {
  const allLabs = subjects.flatMap((subject) => labsBySubject[subject.id] || []);
  const remainingCount = allLabs.filter((lab) => !isCompletedStatus(lab.status)).length;
  const daysLeft = activeSemester?.endDate ? Math.max(0, dayjs(activeSemester.endDate).diff(dayjs(), "day")) : "—";

  const byMonth = {};
  allLabs.forEach((lab) => {
    if (isCompletedStatus(lab.status)) {
      const monthKey = dayjs(lab.createdAt || 0).format("YYYY-MM");
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    }
  });
  const entries = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
  const maxVal = entries.length ? Math.max(...entries.map(([, value]) => value)) : 0;

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="text-sm text-slate-500">Додатковий моніторинг</p>
        <h2 className="text-2xl font-semibold text-slate-900">Статус робіт семестру {activeSemester?.number ?? "—"}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="text-sm text-slate-500 mb-1">Ще не виконано</div>
          <div className="text-4xl font-semibold text-slate-900">{remainingCount}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500 mb-1">Днів до завершення</div>
          <div className="text-4xl font-semibold text-slate-900">{daysLeft}</div>
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-3 text-slate-900">Виконані лабораторні за місяцями</div>
        {entries.length === 0 ? (
          <div className="text-sm text-slate-500">Ще немає виконаних робіт.</div>
        ) : (
          <div className="space-y-2">
            {entries.map(([month, value]) => (
              <div key={month} className="flex items-center gap-3">
                <div className="w-24 text-sm text-slate-500">{month}</div>
                <div className="flex-1 bg-slate-100 h-2 rounded-full">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${Math.round((value / maxVal) * 100)}%`, background: "linear-gradient(90deg, #2e3192 0%, #005b97 100%)" }}
                  />
                </div>
                <div className="w-8 text-right text-sm text-slate-700">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
