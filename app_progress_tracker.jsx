import React, { useState, useEffect } from "react";
import { Home, Settings, Dumbbell, Calendar, BarChart3, ListChecks, StickyNote, Plus, Trash2, Check, ExternalLink, RotateCcw, Flame, Sparkles, X, Edit3 } from "lucide-react";

const SCREENS = [
  { id: "home", label: "Home Page", icon: Home, emoji: "🏠" },
  { id: "settings", label: "Settings", icon: Settings, emoji: "⚙️" },
  { id: "log", label: "Log Workout", icon: Dumbbell, emoji: "💪" },
  { id: "calendar", label: "Calendar", icon: Calendar, emoji: "📅" },
  { id: "history", label: "History / Data", icon: BarChart3, emoji: "📊" },
];

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", bg: "#FEF3C7", fg: "#92400E", dot: "#F59E0B" },
  { value: "in-progress", label: "In Progress", bg: "#DBEAFE", fg: "#1E40AF", dot: "#3B82F6" },
  { value: "done", label: "Done", bg: "#D1FAE5", fg: "#065F46", dot: "#10B981" },
  { value: "blocked", label: "Blocked", bg: "#FEE2E2", fg: "#991B1B", dot: "#EF4444" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "#94A3B8" },
  { value: "medium", label: "Medium", color: "#F59E0B" },
  { value: "high", label: "High", color: "#EF4444" },
];

const DATA_KEY = "tracker-data-v1";

const DEFAULT_DATA = {
  screens: Object.fromEntries(
    SCREENS.map((s) => [s.id, { problems: [], notes: "", excalidrawUrl: "" }])
  ),
  checklist: [],
  globalNotes: "",
};

export default function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(DATA_KEY);
        if (result?.value) {
          const parsed = JSON.parse(result.value);
          setData({
            screens: { ...DEFAULT_DATA.screens, ...(parsed.screens || {}) },
            checklist: parsed.checklist || [],
            globalNotes: parsed.globalNotes || "",
          });
        }
      } catch (e) {
        // first load, nothing saved yet
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (next) => {
    setData(next);
    try {
      await window.storage.set(DATA_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("save failed", e);
    }
  };

  const updateScreen = (screenId, patch) => {
    persist({
      ...data,
      screens: { ...data.screens, [screenId]: { ...data.screens[screenId], ...patch } },
    });
  };

  const addProblem = (screenId, text) => {
    if (!text.trim()) return;
    const screen = data.screens[screenId];
    const newProblem = {
      id: Date.now().toString(),
      text: text.trim(),
      status: "todo",
      priority: "medium",
      createdAt: Date.now(),
    };
    updateScreen(screenId, { problems: [newProblem, ...screen.problems] });
  };

  const updateProblem = (screenId, problemId, patch) => {
    const screen = data.screens[screenId];
    updateScreen(screenId, {
      problems: screen.problems.map((p) => (p.id === problemId ? { ...p, ...patch } : p)),
    });
  };

  const deleteProblem = (screenId, problemId) => {
    const screen = data.screens[screenId];
    updateScreen(screenId, { problems: screen.problems.filter((p) => p.id !== problemId) });
  };

  const addChecklistItem = (text) => {
    if (!text.trim()) return;
    persist({
      ...data,
      checklist: [...data.checklist, { id: Date.now().toString(), text: text.trim(), done: false }],
    });
  };

  const toggleChecklistItem = (id) => {
    persist({
      ...data,
      checklist: data.checklist.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    });
  };

  const deleteChecklistItem = (id) => {
    persist({ ...data, checklist: data.checklist.filter((i) => i.id !== id) });
  };

  const resetChecklist = () => {
    persist({ ...data, checklist: data.checklist.map((i) => ({ ...i, done: false })) });
  };

  const updateGlobalNotes = (text) => {
    persist({ ...data, globalNotes: text });
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingInner}>
          <Flame size={32} color="#E85D4E" />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: "#2A2A2A" }}>
            waking up...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{globalCss}</style>

      <aside style={styles.sidebar}>
        <div style={styles.logoWrap}>
          <div style={styles.logoBadge}>
            <Sparkles size={18} color="#FFF8EF" />
          </div>
          <div>
            <div style={styles.logoTitle}>control room</div>
            <div style={styles.logoSub}>app progress tracker</div>
          </div>
        </div>

        <NavSection title="overview">
          <NavItem
            active={view === "dashboard"}
            onClick={() => setView("dashboard")}
            icon={<Home size={16} />}
            label="Dashboard"
          />
        </NavSection>

        <NavSection title="screens">
          {SCREENS.map((s) => {
            const openCount = data.screens[s.id].problems.filter(
              (p) => p.status !== "done"
            ).length;
            return (
              <NavItem
                key={s.id}
                active={view === s.id}
                onClick={() => setView(s.id)}
                icon={<span style={{ fontSize: 14 }}>{s.emoji}</span>}
                label={s.label}
                badge={openCount > 0 ? openCount : null}
              />
            );
          })}
        </NavSection>

        <NavSection title="tools">
          <NavItem
            active={view === "checklist"}
            onClick={() => setView("checklist")}
            icon={<ListChecks size={16} />}
            label="Expo Checklist"
          />
          <NavItem
            active={view === "notes"}
            onClick={() => setView("notes")}
            icon={<StickyNote size={16} />}
            label="Global Notes"
          />
        </NavSection>

        <div style={styles.sidebarFooter}>
          <div style={styles.sidebarFooterInner}>
            saved locally<br />
            <span style={{ opacity: 0.6 }}>persists across sessions</span>
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        {view === "dashboard" && <Dashboard data={data} setView={setView} />}
        {SCREENS.find((s) => s.id === view) && (
          <ScreenView
            screen={SCREENS.find((s) => s.id === view)}
            screenData={data.screens[view]}
            onAddProblem={(text) => addProblem(view, text)}
            onUpdateProblem={(pid, patch) => updateProblem(view, pid, patch)}
            onDeleteProblem={(pid) => deleteProblem(view, pid)}
            onUpdateNotes={(text) => updateScreen(view, { notes: text })}
            onUpdateExcalidraw={(url) => updateScreen(view, { excalidrawUrl: url })}
            filter={filter}
            setFilter={setFilter}
          />
        )}
        {view === "checklist" && (
          <ChecklistView
            items={data.checklist}
            onAdd={addChecklistItem}
            onToggle={toggleChecklistItem}
            onDelete={deleteChecklistItem}
            onReset={resetChecklist}
          />
        )}
        {view === "notes" && <NotesView notes={data.globalNotes} onChange={updateGlobalNotes} />}
      </main>
    </div>
  );
}

function NavSection({ title, children }) {
  return (
    <div style={styles.navSection}>
      <div style={styles.navSectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function NavItem({ active, onClick, icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "#F5ECDE";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={styles.navItemIcon}>{icon}</span>
      <span style={styles.navItemLabel}>{label}</span>
      {badge != null && <span style={styles.navBadge}>{badge}</span>}
    </button>
  );
}

function Dashboard({ data, setView }) {
  const totalOpen = SCREENS.reduce(
    (sum, s) => sum + data.screens[s.id].problems.filter((p) => p.status !== "done").length,
    0
  );
  const totalDone = SCREENS.reduce(
    (sum, s) => sum + data.screens[s.id].problems.filter((p) => p.status === "done").length,
    0
  );
  const totalBlocked = SCREENS.reduce(
    (sum, s) => sum + data.screens[s.id].problems.filter((p) => p.status === "blocked").length,
    0
  );

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <div style={styles.eyebrow}>overview</div>
          <h1 style={styles.pageTitle}>
            let's ship this thing<span style={styles.titleAccent}>.</span>
          </h1>
          <p style={styles.pageSub}>
            A snapshot of where you are. Click any card to dive in.
          </p>
        </div>
        <div style={styles.headerSticker}>
          <Flame size={20} color="#E85D4E" />
          <span>in progress</span>
        </div>
      </div>

      <div style={styles.statGrid}>
        <StatCard label="Open" value={totalOpen} color="#F59E0B" />
        <StatCard label="Done" value={totalDone} color="#10B981" />
        <StatCard label="Blocked" value={totalBlocked} color="#EF4444" />
      </div>

      <h2 style={styles.sectionHeader}>Screens</h2>
      <div style={styles.screenGrid}>
        {SCREENS.map((s) => {
          const sd = data.screens[s.id];
          const open = sd.problems.filter((p) => p.status !== "done").length;
          const done = sd.problems.filter((p) => p.status === "done").length;
          const blocked = sd.problems.filter((p) => p.status === "blocked").length;
          const total = sd.problems.length;
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);
          return (
            <button
              key={s.id}
              onClick={() => setView(s.id)}
              style={styles.screenCard}
              className="screen-card"
            >
              <div style={styles.screenCardTop}>
                <span style={{ fontSize: 28 }}>{s.emoji}</span>
                {blocked > 0 && <span style={styles.blockedChip}>{blocked} blocked</span>}
              </div>
              <div style={styles.screenCardTitle}>{s.label}</div>
              <div style={styles.screenCardMeta}>
                {open} open · {done} done
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${pct}%`,
                  }}
                />
              </div>
              <div style={styles.screenCardPct}>{pct}%</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statDot, background: color }} />
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function ScreenView({
  screen,
  screenData,
  onAddProblem,
  onUpdateProblem,
  onDeleteProblem,
  onUpdateNotes,
  onUpdateExcalidraw,
  filter,
  setFilter,
}) {
  const [newProblem, setNewProblem] = useState("");
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(screenData.excalidrawUrl || "");

  useEffect(() => {
    setUrlDraft(screenData.excalidrawUrl || "");
    setEditingUrl(false);
  }, [screen.id]);

  const handleAdd = () => {
    onAddProblem(newProblem);
    setNewProblem("");
  };

  const filtered = screenData.problems.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const counts = {
    all: screenData.problems.length,
    todo: screenData.problems.filter((p) => p.status === "todo").length,
    "in-progress": screenData.problems.filter((p) => p.status === "in-progress").length,
    done: screenData.problems.filter((p) => p.status === "done").length,
    blocked: screenData.problems.filter((p) => p.status === "blocked").length,
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <div style={styles.eyebrow}>screen</div>
          <h1 style={styles.pageTitle}>
            {screen.emoji} {screen.label}
          </h1>
        </div>
      </div>

      <div style={styles.excalidrawCard}>
        <div style={styles.excalidrawLabel}>moodboard / inspiration</div>
        {editingUrl || !screenData.excalidrawUrl ? (
          <div style={styles.excalidrawEditRow}>
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="paste your excalidraw link..."
              style={styles.textInput}
            />
            <button
              style={styles.primaryBtn}
              onClick={() => {
                onUpdateExcalidraw(urlDraft.trim());
                setEditingUrl(false);
              }}
            >
              save
            </button>
            {screenData.excalidrawUrl && (
              <button style={styles.ghostBtn} onClick={() => setEditingUrl(false)}>
                cancel
              </button>
            )}
          </div>
        ) : (
          <div style={styles.excalidrawViewRow}>
            <a
              href={screenData.excalidrawUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.excalidrawLink}
            >
              <ExternalLink size={14} />
              open moodboard
            </a>
            <span style={styles.excalidrawUrl}>{screenData.excalidrawUrl}</span>
            <button
              style={styles.ghostBtn}
              onClick={() => {
                setUrlDraft(screenData.excalidrawUrl);
                setEditingUrl(true);
              }}
            >
              <Edit3 size={12} /> edit
            </button>
          </div>
        )}
      </div>

      <h2 style={styles.sectionHeader}>Problems & to-dos</h2>

      <div style={styles.addRow}>
        <input
          value={newProblem}
          onChange={(e) => setNewProblem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="what needs fixing?"
          style={{ ...styles.textInput, flex: 1 }}
        />
        <button style={styles.primaryBtn} onClick={handleAdd}>
          <Plus size={16} /> add
        </button>
      </div>

      <div style={styles.filterRow}>
        {[
          { v: "all", label: "all" },
          { v: "todo", label: "to do" },
          { v: "in-progress", label: "in progress" },
          { v: "done", label: "done" },
          { v: "blocked", label: "blocked" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            style={{
              ...styles.filterChip,
              ...(filter === f.v ? styles.filterChipActive : {}),
            }}
          >
            {f.label} <span style={styles.filterCount}>{counts[f.v]}</span>
          </button>
        ))}
      </div>

      <div style={styles.problemList}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: "#2A2A2A" }}>
              {screenData.problems.length === 0 ? "nothing here yet" : "nothing matches that filter"}
            </div>
            <div style={{ color: "#7A6E5A", marginTop: 4 }}>
              {screenData.problems.length === 0
                ? "add your first problem above"
                : "try a different filter"}
            </div>
          </div>
        ) : (
          filtered.map((p) => (
            <ProblemRow
              key={p.id}
              problem={p}
              onUpdate={(patch) => onUpdateProblem(p.id, patch)}
              onDelete={() => onDeleteProblem(p.id)}
            />
          ))
        )}
      </div>

      <h2 style={styles.sectionHeader}>Notes & direction</h2>
      <textarea
        value={screenData.notes}
        onChange={(e) => onUpdateNotes(e.target.value)}
        placeholder="decisions, ideas, things you're thinking about for this screen..."
        style={styles.textarea}
      />
    </div>
  );
}

function ProblemRow({ problem, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(problem.text);
  const status = STATUS_OPTIONS.find((s) => s.value === problem.status);
  const priority = PRIORITY_OPTIONS.find((p) => p.value === problem.priority);
  const isDone = problem.status === "done";

  return (
    <div
      style={{
        ...styles.problemRow,
        opacity: isDone ? 0.6 : 1,
      }}
    >
      <div
        style={{ ...styles.priorityBar, background: priority.color }}
        title={`priority: ${priority.label}`}
      />
      <div style={styles.problemContent}>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft.trim()) onUpdate({ text: draft.trim() });
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (draft.trim()) onUpdate({ text: draft.trim() });
                setEditing(false);
              }
              if (e.key === "Escape") {
                setDraft(problem.text);
                setEditing(false);
              }
            }}
            style={{ ...styles.textInput, width: "100%" }}
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            style={{
              ...styles.problemText,
              textDecoration: isDone ? "line-through" : "none",
            }}
          >
            {problem.text}
          </div>
        )}
        <div style={styles.problemControls}>
          <select
            value={problem.status}
            onChange={(e) => onUpdate({ status: e.target.value })}
            style={{
              ...styles.statusSelect,
              background: status.bg,
              color: status.fg,
              borderColor: status.dot,
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={problem.priority}
            onChange={(e) => onUpdate({ priority: e.target.value })}
            style={styles.prioritySelect}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} priority
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={onDelete}
        style={styles.deleteBtn}
        title="delete"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#FEE2E2";
          e.currentTarget.style.color = "#991B1B";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#94A3B8";
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function ChecklistView({ items, onAdd, onToggle, onDelete, onReset }) {
  const [newItem, setNewItem] = useState("");
  const doneCount = items.filter((i) => i.done).length;

  const handleAdd = () => {
    onAdd(newItem);
    setNewItem("");
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <div style={styles.eyebrow}>ritual</div>
          <h1 style={styles.pageTitle}>Expo checklist</h1>
          <p style={styles.pageSub}>
            Your steps for spinning things up each session. Add your own, check them off, reset when you're done.
          </p>
        </div>
        {items.length > 0 && (
          <button style={styles.resetBtn} onClick={onReset}>
            <RotateCcw size={14} /> reset all
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div style={styles.progressCard}>
          <div style={styles.progressCardTop}>
            <span style={styles.progressCardLabel}>progress</span>
            <span style={styles.progressCardCount}>
              {doneCount} / {items.length}
            </span>
          </div>
          <div style={styles.progressBarLarge}>
            <div
              style={{
                ...styles.progressFillLarge,
                width: `${items.length === 0 ? 0 : (doneCount / items.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <div style={styles.addRow}>
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="add a step (e.g. cd into the project folder)"
          style={{ ...styles.textInput, flex: 1 }}
        />
        <button style={styles.primaryBtn} onClick={handleAdd}>
          <Plus size={16} /> add step
        </button>
      </div>

      <div style={styles.checklistList}>
        {items.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: "#2A2A2A" }}>
              empty checklist
            </div>
            <div style={{ color: "#7A6E5A", marginTop: 4 }}>
              add your first step above
            </div>
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={item.id} style={styles.checklistItem}>
              <span style={styles.checklistNumber}>{idx + 1}</span>
              <button
                onClick={() => onToggle(item.id)}
                style={{
                  ...styles.checkbox,
                  ...(item.done ? styles.checkboxDone : {}),
                }}
              >
                {item.done && <Check size={14} color="#FFF8EF" strokeWidth={3} />}
              </button>
              <span
                style={{
                  ...styles.checklistText,
                  textDecoration: item.done ? "line-through" : "none",
                  opacity: item.done ? 0.5 : 1,
                }}
              >
                {item.text}
              </span>
              <button
                onClick={() => onDelete(item.id)}
                style={styles.deleteBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FEE2E2";
                  e.currentTarget.style.color = "#991B1B";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#94A3B8";
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NotesView({ notes, onChange }) {
  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <div style={styles.eyebrow}>scratch pad</div>
          <h1 style={styles.pageTitle}>Global notes</h1>
          <p style={styles.pageSub}>
            Big-picture stuff. Things that don't fit under a single screen.
          </p>
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        placeholder="overall architecture thoughts, naming decisions, feature ideas for later, whatever..."
        style={{ ...styles.textarea, minHeight: 500 }}
      />
    </div>
  );
}

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;0,9..144,900;1,9..144,600&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  input, textarea, button, select { font-family: 'DM Sans', system-ui, sans-serif; }
  input:focus, textarea:focus, select:focus { outline: 2px solid #E85D4E; outline-offset: 2px; }
  .screen-card:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #2A2A2A !important; }
  .screen-card:active { transform: translate(1px, 1px); box-shadow: 2px 2px 0 #2A2A2A !important; }
  select { cursor: pointer; }
  textarea { resize: vertical; }
`;

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    background: "#FAF3E3",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: "#2A2A2A",
    backgroundImage:
      "radial-gradient(circle at 20% 20%, rgba(232, 93, 78, 0.06) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(247, 183, 49, 0.08) 0%, transparent 40%)",
  },
  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FAF3E3",
  },
  loadingInner: { display: "flex", gap: 12, alignItems: "center" },
  sidebar: {
    width: 260,
    background: "#FFF8EF",
    borderRight: "2px solid #2A2A2A",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    position: "sticky",
    top: 0,
    height: "100vh",
    flexShrink: 0,
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 8px 16px 8px",
    borderBottom: "1px dashed #D4C4A8",
  },
  logoBadge: {
    width: 36,
    height: 36,
    background: "#E85D4E",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transform: "rotate(-6deg)",
    boxShadow: "2px 2px 0 #2A2A2A",
  },
  logoTitle: {
    fontFamily: "Fraunces, serif",
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "-0.02em",
    color: "#2A2A2A",
  },
  logoSub: { fontSize: 10, color: "#7A6E5A", textTransform: "uppercase", letterSpacing: "0.08em" },
  navSection: { display: "flex", flexDirection: "column", gap: 2 },
  navSectionTitle: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#7A6E5A",
    padding: "0 12px 6px 12px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 8,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#2A2A2A",
    fontSize: 14,
    fontWeight: 500,
    textAlign: "left",
    width: "100%",
    transition: "background 0.15s",
  },
  navItemActive: {
    background: "#2A2A2A",
    color: "#FFF8EF",
  },
  navItemIcon: { display: "flex", alignItems: "center", justifyContent: "center", width: 18 },
  navItemLabel: { flex: 1 },
  navBadge: {
    background: "#E85D4E",
    color: "#FFF8EF",
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 10,
    fontFamily: "'JetBrains Mono', monospace",
  },
  sidebarFooter: {
    marginTop: "auto",
    padding: "12px",
    borderTop: "1px dashed #D4C4A8",
  },
  sidebarFooterInner: {
    fontSize: 10,
    color: "#7A6E5A",
    lineHeight: 1.5,
    fontFamily: "'JetBrains Mono', monospace",
  },
  main: {
    flex: 1,
    padding: "40px 48px 80px 48px",
    maxWidth: 1000,
  },
  page: { display: "flex", flexDirection: "column", gap: 24 },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: "#E85D4E",
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: 8,
  },
  pageTitle: {
    fontFamily: "Fraunces, serif",
    fontSize: 44,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    margin: 0,
    lineHeight: 1.05,
    color: "#2A2A2A",
  },
  titleAccent: { color: "#E85D4E" },
  pageSub: { color: "#7A6E5A", marginTop: 8, fontSize: 15, maxWidth: 520 },
  headerSticker: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "#FFF8EF",
    border: "2px solid #2A2A2A",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    transform: "rotate(2deg)",
    boxShadow: "2px 2px 0 #2A2A2A",
    fontFamily: "'JetBrains Mono', monospace",
  },
  sectionHeader: {
    fontFamily: "Fraunces, serif",
    fontSize: 22,
    fontWeight: 700,
    margin: "16px 0 0 0",
    letterSpacing: "-0.02em",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
  },
  statCard: {
    background: "#FFF8EF",
    border: "2px solid #2A2A2A",
    borderRadius: 14,
    padding: "18px 20px",
    position: "relative",
    boxShadow: "3px 3px 0 #2A2A2A",
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: "absolute",
    top: 18,
    right: 18,
  },
  statValue: {
    fontFamily: "Fraunces, serif",
    fontSize: 42,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: "-0.03em",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#7A6E5A",
    marginTop: 6,
    fontFamily: "'JetBrains Mono', monospace",
  },
  screenGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 14,
  },
  screenCard: {
    background: "#FFF8EF",
    border: "2px solid #2A2A2A",
    borderRadius: 14,
    padding: 18,
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "3px 3px 0 #2A2A2A",
    transition: "transform 0.15s, box-shadow 0.15s",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontFamily: "'DM Sans', sans-serif",
    color: "#2A2A2A",
  },
  screenCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  blockedChip: {
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 8px",
    background: "#FEE2E2",
    color: "#991B1B",
    borderRadius: 10,
    fontFamily: "'JetBrains Mono', monospace",
  },
  screenCardTitle: {
    fontFamily: "Fraunces, serif",
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: "-0.02em",
  },
  screenCardMeta: { fontSize: 12, color: "#7A6E5A", fontFamily: "'JetBrains Mono', monospace" },
  progressBar: {
    width: "100%",
    height: 6,
    background: "#F0E4CC",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 6,
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #E85D4E, #F7B731)",
    transition: "width 0.3s",
  },
  screenCardPct: {
    fontSize: 11,
    fontWeight: 600,
    color: "#7A6E5A",
    fontFamily: "'JetBrains Mono', monospace",
    alignSelf: "flex-end",
  },
  excalidrawCard: {
    background: "#FFF8EF",
    border: "2px solid #2A2A2A",
    borderRadius: 14,
    padding: "16px 18px",
    boxShadow: "3px 3px 0 #2A2A2A",
  },
  excalidrawLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#7A6E5A",
    marginBottom: 10,
    fontFamily: "'JetBrains Mono', monospace",
  },
  excalidrawEditRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  excalidrawViewRow: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  excalidrawLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "#2A2A2A",
    color: "#FFF8EF",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  },
  excalidrawUrl: {
    flex: 1,
    fontSize: 12,
    color: "#7A6E5A",
    fontFamily: "'JetBrains Mono', monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  addRow: { display: "flex", gap: 8 },
  textInput: {
    padding: "10px 14px",
    border: "2px solid #2A2A2A",
    borderRadius: 8,
    fontSize: 14,
    background: "#FFF8EF",
    color: "#2A2A2A",
    fontFamily: "'DM Sans', sans-serif",
  },
  primaryBtn: {
    padding: "10px 16px",
    background: "#E85D4E",
    color: "#FFF8EF",
    border: "2px solid #2A2A2A",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    boxShadow: "2px 2px 0 #2A2A2A",
  },
  ghostBtn: {
    padding: "8px 12px",
    background: "transparent",
    color: "#2A2A2A",
    border: "2px solid #2A2A2A",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  resetBtn: {
    padding: "8px 14px",
    background: "#FFF8EF",
    color: "#2A2A2A",
    border: "2px solid #2A2A2A",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    boxShadow: "2px 2px 0 #2A2A2A",
  },
  filterRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterChip: {
    padding: "6px 12px",
    borderRadius: 20,
    border: "2px solid #2A2A2A",
    background: "#FFF8EF",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#2A2A2A",
  },
  filterChipActive: {
    background: "#2A2A2A",
    color: "#FFF8EF",
  },
  filterCount: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    opacity: 0.7,
  },
  problemList: { display: "flex", flexDirection: "column", gap: 10 },
  problemRow: {
    display: "flex",
    background: "#FFF8EF",
    border: "2px solid #2A2A2A",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "2px 2px 0 #2A2A2A",
  },
  priorityBar: { width: 6, flexShrink: 0 },
  problemContent: { flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 },
  problemText: { fontSize: 15, lineHeight: 1.4, cursor: "text", wordBreak: "break-word" },
  problemControls: { display: "flex", gap: 8, flexWrap: "wrap" },
  statusSelect: {
    padding: "4px 10px",
    borderRadius: 14,
    border: "1.5px solid",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    appearance: "none",
    backgroundImage: "none",
  },
  prioritySelect: {
    padding: "4px 10px",
    borderRadius: 14,
    border: "1.5px solid #D4C4A8",
    background: "#FAF3E3",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    color: "#2A2A2A",
  },
  deleteBtn: {
    padding: 10,
    background: "transparent",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    alignSelf: "flex-start",
    display: "flex",
    alignItems: "center",
    borderRadius: 6,
    transition: "background 0.15s, color 0.15s",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 20px",
    background: "#FFF8EF",
    border: "2px dashed #D4C4A8",
    borderRadius: 12,
  },
  textarea: {
    width: "100%",
    minHeight: 180,
    padding: 16,
    border: "2px solid #2A2A2A",
    borderRadius: 12,
    background: "#FFF8EF",
    fontSize: 15,
    lineHeight: 1.6,
    fontFamily: "'DM Sans', sans-serif",
    color: "#2A2A2A",
    boxShadow: "2px 2px 0 #2A2A2A",
  },
  checklistList: { display: "flex", flexDirection: "column", gap: 8 },
  checklistItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    background: "#FFF8EF",
    border: "2px solid #2A2A2A",
    borderRadius: 10,
    boxShadow: "2px 2px 0 #2A2A2A",
  },
  checklistNumber: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    color: "#7A6E5A",
    width: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    border: "2px solid #2A2A2A",
    borderRadius: 6,
    background: "#FAF3E3",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxDone: {
    background: "#E85D4E",
  },
  checklistText: { flex: 1, fontSize: 15, lineHeight: 1.4 },
  progressCard: {
    background: "#FFF8EF",
    border: "2px solid #2A2A2A",
    borderRadius: 12,
    padding: "14px 18px",
    boxShadow: "2px 2px 0 #2A2A2A",
  },
  progressCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressCardLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#7A6E5A",
    fontFamily: "'JetBrains Mono', monospace",
  },
  progressCardCount: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    fontWeight: 700,
  },
  progressBarLarge: {
    width: "100%",
    height: 10,
    background: "#F0E4CC",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFillLarge: {
    height: "100%",
    background: "linear-gradient(90deg, #E85D4E, #F7B731)",
    transition: "width 0.3s",
  },
};
