// FINOVA accounts: email + password, scrypt hashing, opaque session tokens in HttpOnly cookies.
import crypto from "node:crypto";
import { read, write } from "./db.js";

const COOKIE = "finova_session";
const SESSION_DAYS = 30;
const scrypt = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k))));
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
export const newId = (p) => `${p}_${crypto.randomBytes(12).toString("hex")}`;

export function publicUser(u) {
  return u ? { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt } : null;
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((p) => p.trim().split("=")).filter(([k, v]) => k && v).map(([k, v]) => [k, decodeURIComponent(v)]));
}

function setCookie(res, value, maxAgeSec, req) {
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure ? "; Secure" : ""}`);
}

// --- simple in-memory rate limiter for auth endpoints ---
const hits = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length <= max;
}

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

export async function register({ email, password, name }) {
  email = String(email ?? "").trim().toLowerCase();
  name = String(name ?? "").trim().slice(0, 60);
  password = String(password ?? "");
  if (!EMAIL.test(email)) throw httpError(400, "Enter a valid email address.");
  if (password.length < 8 || password.length > 128) throw httpError(400, "Password must be 8 to 128 characters.");
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) throw httpError(400, "Use at least one letter and one number in your password.");
  if (read().emails[email]) throw httpError(409, "An account with this email already exists. Try signing in.");
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt)).toString("hex");
  const user = { id: newId("usr"), email, name: name || email.split("@")[0], salt, hash, createdAt: Date.now() };
  await write((d) => { d.users[user.id] = user; d.emails[email] = user.id; });
  return user;
}

export async function verifyPassword(email, password) {
  email = String(email ?? "").trim().toLowerCase();
  const id = read().emails[email];
  const user = id ? read().users[id] : null;
  // Always run scrypt to keep timing similar whether or not the account exists.
  const salt = user?.salt ?? "0".repeat(32);
  const key = await scrypt(String(password ?? ""), salt);
  if (!user) return null;
  const ok = crypto.timingSafeEqual(key, Buffer.from(user.hash, "hex"));
  return ok ? user : null;
}

export async function startSession(res, req, user) {
  const token = crypto.randomBytes(32).toString("base64url");
  const s = { id: sha256(token), userId: user.id, createdAt: Date.now(), expiresAt: Date.now() + SESSION_DAYS * 864e5, ua: String(req.headers["user-agent"] ?? "").slice(0, 160) };
  await write((d) => { d.sessions[s.id] = s; });
  setCookie(res, token, SESSION_DAYS * 86400, req);
}

export async function endSession(req, res) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (token) await write((d) => { delete d.sessions[sha256(token)]; });
  setCookie(res, "", 0, req);
}

/** Express middleware: attaches req.user when a valid session cookie is present. */
export function sessionMiddleware(req, _res, next) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (token) {
    const s = read().sessions[sha256(token)];
    if (s && s.expiresAt > Date.now()) req.user = read().users[s.userId] ?? null;
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Please sign in to continue." });
  next();
}

/** Blocks cross-site state-changing requests (defence in depth on top of SameSite cookies). */
export function sameOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next(); // non-browser clients (webhooks are mounted separately)
  try {
    const o = new URL(origin);
    const host = req.headers.host;
    if (o.host === host || /^(localhost|127\.0\.0\.1)$/.test(o.hostname)) return next();
  } catch { /* fall through */ }
  res.status(403).json({ error: "Request blocked: cross-site origin." });
}

export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
