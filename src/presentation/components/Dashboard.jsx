import { BookOpen, FlaskConical, Gauge, Clock } from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { isCompletedStatus } from "../../models/LabWork";

const StatCard = ({ icon: Icon, title, value, description }) => (
  <div className="card flex flex-col gap-2">
    <div className="flex items-center gap-3 text-slate-600">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-blue-500">
        <Icon className="w-5 h-5" />
      </span>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="stat-number leading-tight">{value}</p>
      </div>
    </div>
    {description && <p className="text-sm text-slate-500">{description}</p>}
  </div>
);

export default function Dashboard({ activeSemesterNumber, activeSemester, subjects, labsBySubject }) {
  const subjectsCount = subjects.length;
  const allLabs = subjects.flatMap((s) => labsBySubject[s.id] || []);
  const completedCount = allLabs.filter((l) => isCompletedStatus(l.status)).length;
  const totalCount = allLabs.length;
  const percentCompleted = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const subjectScoreEntries = subjects
    .map((subject) => {
      const labs = labsBySubject[subject.id] || [];
      const modules = Array.isArray(subject.modules) ? subject.modules : [];

      const labTotals = labs.reduce(
        (acc, lab) => {
          const obtained = typeof lab.obtainedScore === "number" && !Number.isNaN(lab.obtainedScore) ? Number(lab.obtainedScore) : 0;
          const maxScore = typeof lab.maxScore === "number" && !Number.isNaN(lab.maxScore) ? Number(lab.maxScore) : 0;
          return { obtained: acc.obtained + obtained, maxScore: acc.maxScore + maxScore };
        },
        { obtained: 0, maxScore: 0 }
      );

      const moduleTotals = modules.reduce(
        (acc, mod) => {
          const obtained = typeof mod.obtained === "number" && !Number.isNaN(mod.obtained) ? Number(mod.obtained) : 0;
          const maxScore = typeof mod.max === "number" && !Number.isNaN(mod.max) ? Number(mod.max) : 0;
          return { obtained: acc.obtained + obtained, maxScore: acc.maxScore + maxScore };
        },
        { obtained: 0, maxScore: 0 }
      );

      return {
        obtained: labTotals.obtained + moduleTotals.obtained,
        maxScore: labTotals.maxScore + moduleTotals.maxScore,
      };
    })
    .filter(({ maxScore }) => maxScore > 0);
  const avgSubjectPoints =
    subjectScoreEntries.length > 0 ? subjectScoreEntries.reduce((sum, { obtained }) => sum + obtained, 0) / subjectScoreEntries.length : 0;
  const avgDisplay = subjectScoreEntries.length ? Number(avgSubjectPoints.toFixed(1)) : 0;

  const daysLeft = activeSemester?.endDate ? Math.max(0, dayjs(activeSemester.endDate).diff(dayjs(), "day")) : 0;

  const byMonth = {};
  allLabs.forEach((lab) => {
    if (isCompletedStatus(lab.status)) {
      const monthKey = dayjs(lab.createdAt || 0).format("YYYY.MM");
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    }
  });
  const monthEntries = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonthValue = monthEntries.length ? Math.max(...monthEntries.map(([, v]) => v)) : 0;

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Активний семестр</p>
          <h2 className="text-3xl font-semibold text-slate-900">
            {activeSemesterNumber ? `Семестр ${activeSemesterNumber}` : "Не обрано активний семестр"}
          </h2>
          {activeSemester?.title && <p className="text-slate-500 mt-1">{activeSemester.title}</p>}
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
          <div className="badge badge-accent">
            Початок: {activeSemester?.startDate ? dayjs(activeSemester.startDate).format("DD.MM.YYYY") : "—"}
          </div>
          <div className="badge badge-accent">
            Кінець: {activeSemester?.endDate ? dayjs(activeSemester.endDate).format("DD.MM.YYYY") : "—"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} title="Кількість предметів" value={subjectsCount} description="Усі дисципліни поточного семестру" />
        <StatCard
          icon={FlaskConical}
          title="Виконані лабораторні"
          value={`${completedCount}/${totalCount || 0}`}
          description={`Виконано ${percentCompleted}% від загальної кількості`}
        />
        <StatCard icon={Gauge} title="Середній бал" value={avgDisplay} description="За сумарними балами предметів" />
        <StatCard icon={Clock} title="Днів до сесії" value={daysLeft} description="Розрахунок від сьогодні до дедлайну" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Динаміка виконання</p>
              <h3 className="text-xl font-semibold text-slate-900">Виконані роботи за місяцями</h3>
            </div>
            <span className="text-sm text-slate-400">Максимум: {maxMonthValue || 0}</span>
          </div>
          {monthEntries.length === 0 ? (
            <p className="text-sm text-slate-500">Ще немає виконаних робіт.</p>
          ) : (
            <div className="space-y-3">
              {monthEntries.map(([month, value]) => (
                <div key={month} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-slate-500">{month}</div>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.round((value / maxMonthValue) * 100)}%`,
                        background: "linear-gradient(90deg, #2e3192 0%, #005b97 100%)",
                      }}
                    />
                  </div>
                  <div className="w-8 text-right text-sm text-slate-700">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div>
            <p className="text-sm text-slate-500">Нагадування для предметів</p>
            <h3 className="text-xl font-semibold text-slate-900">Ще в роботі</h3>
          </div>
          {subjects.map((subject) => {
            const labs = (labsBySubject[subject.id] || []).filter((lab) => !isCompletedStatus(lab.status));
            if (!labs.length) return null;
            return (
              <div key={subject.id} className="rounded-2xl border border-slate-100 px-4 py-3 space-y-1">
                <p className="font-medium text-slate-900">{subject.title}</p>
                <p className="text-sm text-slate-500">{labs.length} робіт очікують на виконання</p>
              </div>
            );
          })}
          {subjects.every((subject) => (labsBySubject[subject.id] || []).every((lab) => isCompletedStatus(lab.status))) && (
            <p className="text-sm text-slate-500">Ще немає виконаних робіт.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500">Загальний прогрес</p>
            <h3 className="text-xl font-semibold text-slate-900">Предмети семестру</h3>
          </div>
          <span className="text-sm text-slate-500">Усього: {subjects.length}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject, index) => {
            const labs = labsBySubject[subject.id] || [];
            const completed = labs.filter((lab) => isCompletedStatus(lab.status));
            const progress = labs.length ? Math.round((completed.length / labs.length) * 100) : 0;

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-3xl border border-slate-100 p-4 space-y-3 bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="subject-icon">
                    {subject.iconUrl ? <img src={subject.iconUrl} alt="icon" /> : <div className="w-full h-full rounded-full bg-slate-200" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{subject.title}</p>
                    {subject.teacher && <p className="text-sm text-slate-500">{subject.teacher}</p>}
                  </div>
                </div>
                <div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${progress}%`, background: "linear-gradient(90deg, #2e3192 0%, #005b97 100%)" }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Виконано {completed.length} / {labs.length || 0} робіт
                  </p>
                </div>
              </motion.div>
            );
          })}
          {subjects.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
              Додайте перший предмет, щоб побачити семестрову картку.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
















