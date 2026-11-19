export type Level = "Beginner" | "Intermediate" | "Advanced";
export type AcademyId = "stocks" | "mutual-funds" | "trading" | "investments";

export type QuizQ = { q: string; options: string[]; answer: number; why: string };

export type Lesson = {
  id: string;
  academy: AcademyId;
  level: Level;
  title: string;
  minutes: number;
  summary: string;
  body: string[];
  example: string;
  points: string[];
  quiz: QuizQ[];
  /** YouTube search phrase used to find a matching educational video. */
  video: string;
  /** Optional link to a tool on the academy page (calculator, chart, simulator). */
  tool?: "sip" | "lumpsum" | "compound" | "inflation" | "emergency" | "retirement" | "candles" | "simulator" | "riskreward" | "wealth3d";
};

export type Academy = {
  id: AcademyId;
  name: string;
  tagline: string;
  accent: string;
  lessons: Lesson[];
};

export const q = (question: string, options: string[], answer: number, why: string): QuizQ => ({ q: question, options, answer, why });
