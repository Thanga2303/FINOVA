import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { allLessons, lessonPath } from "../data";
import { finishChallenge, today, useStore } from "../lib/store";
import { Icon } from "./ui";

/** One quiz question a day, picked deterministically from the date. +30 XP for a correct answer. */
export function todaysChallenge() {
  const d = today();
  let h = 0;
  for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const lesson = allLessons[h % allLessons.length];
  return { lesson, q: lesson.quiz[h % lesson.quiz.length] };
}

export default function DailyChallenge() {
  const { lesson, q } = useMemo(todaysChallenge, []);
  const done = useStore((s) => s.challengesDone.includes(today()));
  const [pick, setPick] = useState<number | null>(null);
  const answered = pick !== null;

  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold"><Icon name="flame" className="w-5 h-5 text-amber" /> Daily challenge</div>
        <span className="chip !text-amber">+30 XP</span>
      </div>
      {done && !answered ? (
        <p className="text-sm text-muted mt-3">Done for today. Come back tomorrow to keep your streak going.</p>
      ) : (
        <>
          <p className="mt-3 font-medium">{q.q}</p>
          <div className="mt-3 grid gap-2">
            {q.options.map((o, i) => (
              <button
                key={i}
                disabled={answered}
                onClick={() => { setPick(i); if (i === q.answer) finishChallenge(); }}
                className={`text-left text-sm rounded-xl border px-3 py-2 ${answered && i === q.answer ? "border-emerald bg-emerald/10" : answered && i === pick ? "border-rose bg-rose/10" : "border-line hover:bg-card-strong"}`}
              >
                {o}
              </button>
            ))}
          </div>
          {answered && (
            <p className={`text-sm mt-3 ${pick === q.answer ? "text-emerald" : "text-muted"}`}>
              {pick === q.answer ? "Correct! +30 XP. " : "Not quite. "}
              {q.why}{" "}
              <Link to={lessonPath(lesson)} className="text-cyan underline">Review the lesson</Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
