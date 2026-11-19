import { motion } from "framer-motion";
import { useState } from "react";
import type { QuizQ } from "../data/types";
import { recordQuiz, useStore } from "../lib/store";
import { Icon } from "./ui";

export default function Quiz({ id, questions, onDone }: { id: string; questions: QuizQ[]; onDone?: (score: number) => void }) {
  const [picked, setPicked] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const best = useStore((s) => s.quiz[id]);
  const score = picked.filter((p, i) => p === questions[i].answer).length;

  const submit = () => {
    setSubmitted(true);
    recordQuiz(id, score, questions.length);
    onDone?.(score);
  };

  return (
    <div className="space-y-5">
      {questions.map((qq, i) => (
        <fieldset key={i} className="rounded-2xl border border-line p-4">
          <legend className="px-1 font-medium">{i + 1}. {qq.q}</legend>
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {qq.options.map((o, j) => {
              const isPicked = picked[i] === j;
              const correct = submitted && j === qq.answer;
              const wrong = submitted && isPicked && j !== qq.answer;
              return (
                <button
                  key={j}
                  type="button"
                  disabled={submitted}
                  onClick={() => setPicked((p) => p.map((x, k) => (k === i ? j : x)))}
                  className={`text-left rounded-xl border px-3 py-2.5 text-sm transition ${
                    correct ? "border-emerald bg-emerald/10" : wrong ? "border-rose bg-rose/10" : isPicked ? "border-cyan bg-cyan/10" : "border-line hover:bg-card-strong"
                  }`}
                  aria-pressed={isPicked}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {submitted && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={`text-sm mt-3 ${picked[i] === qq.answer ? "text-emerald" : "text-muted"}`}>
              {picked[i] === qq.answer ? "Correct. " : `Answer: ${qq.options[qq.answer]}. `}
              {qq.why}
            </motion.p>
          )}
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button className="btn-primary disabled:opacity-50" disabled={picked.some((p) => p === null)} onClick={submit}>Check answers</button>
        ) : (
          <>
            <div className="flex items-center gap-2 font-semibold">
              <Icon name="trophy" className="w-5 h-5 text-amber" /> You scored {score}/{questions.length}
              {score === questions.length && <span className="chip !text-emerald">Perfect!</span>}
            </div>
            <button className="btn-ghost text-sm" onClick={() => { setSubmitted(false); setPicked(questions.map(() => null)); }}>Try again</button>
          </>
        )}
        {best && <span className="text-xs text-muted">Best: {best.score}/{best.total} · +10 XP per new correct answer</span>}
      </div>
    </div>
  );
}
