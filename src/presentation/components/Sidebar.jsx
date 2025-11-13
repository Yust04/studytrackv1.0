import { LayoutDashboard, GraduationCap, BadgeCheck, BarChart3, Sparkles } from "lucide-react";
import Button from "./ui/Button";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Аналітика",
    description: "Загальний пульс навчання",
    icon: LayoutDashboard,
  },
  {
    id: "subjects",
    label: "Предмети",
    description: "Лаби, іконки та описи",
    icon: BadgeCheck,
  },
  {
    id: "grades",
    label: "Оцінки",
    description: "Модулі + лабораторні",
    icon: BarChart3,
  },
  {
    id: "semesters",
    label: "Семестри",
    description: "Планування навчального року",
    icon: GraduationCap,
  },
];

export default function Sidebar({ activeTab, onNavigate }) {
  return (
    <aside className="hidden lg:flex flex-col gap-6">
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="w-4 h-4 text-white/70" />
          <span className="uppercase tracking-[0.4em] text-xs">Меню</span>
        </div>
        <div className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item w-full text-left flex items-center gap-3 rounded-2xl px-4 py-3 border transition ${
                  active
                    ? "bg-white/15 border-white/40 shadow-lg shadow-indigo-900/40"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
                onClick={() => onNavigate(item.id)}
              >
                <div
                  className={`p-2 rounded-xl ${
                    active ? "bg-white text-black" : "bg-white/10 text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-xs text-white/60">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-6 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-cyan-400/20 border-white/20">
        <p className="text-sm text-white/70">Екосистема StudyTrack</p>
        <h3 className="text-2xl font-title leading-snug mt-2">Тримайте семестри під контролем</h3>
        <p className="text-sm text-white/60 mt-2">
          Фіксуйте дедлайни, оновлюйте оцінки та додавайте естетичні іконки для кожного предмета.
        </p>
        <Button variant="primary" className="mt-4 w-full" onClick={() => onNavigate("semesters")}>
          Створити семестр
        </Button>
      </div>
    </aside>
  );
}
