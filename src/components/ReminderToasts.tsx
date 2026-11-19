import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { dueReminders, type Reminder } from "../lib/reminders";
import { getState, setState, useStore } from "../lib/store";
import { Icon } from "./ui";

/** Shows one due reminder at a time, only when the user has enabled reminders. Optional browser notifications. */
export default function ReminderToasts() {
  const notify = useStore((s) => s.notify);
  const [current, setCurrent] = useState<Reminder | null>(null);
  const shown = useRef(new Set<string>());
  useEffect(() => {
    if (!notify.enabled) { setCurrent(null); return; }
    const check = () => {
      const r = dueReminders(getState()).find((x) => !shown.current.has(x.id + x.period));
      if (!r) return;
      shown.current.add(r.id + r.period);
      setCurrent(r);
      if (notify.browser && "Notification" in window && Notification.permission === "granted" && document.hidden) {
        try { new Notification(`FINOVA: ${r.title}`, { body: r.body, icon: "/favicon.svg" }); } catch { /* ignore */ }
      }
    };
    const first = setTimeout(check, 4000);
    const id = setInterval(check, 5 * 60e3);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [notify.enabled, notify.browser]);
  const dismiss = () => { if (current) setState((s) => ({ dismissed: { ...s.dismissed, [current.id]: current.period } })); setCurrent(null); };
  return (
    <AnimatePresence>
      {current && (
        <motion.div role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="fixed z-[57] bottom-20 xl:bottom-6 right-3 left-3 sm:left-auto sm:w-96 rounded-2xl border border-line bg-bg2 p-4 shadow-2xl flex gap-3">
          <Icon name="flame" className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <Link to={current.to} onClick={() => setCurrent(null)} className="font-semibold hover:text-cyan">{current.title}</Link>
            <p className="text-xs text-muted mt-0.5">{current.body}</p>
          </div>
          <button className="text-muted hover:text-text self-start" onClick={dismiss} aria-label="Dismiss reminder"><Icon name="close" className="w-4 h-4" /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
