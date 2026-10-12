/**
 * 1909 라이더–웨이트–스미스(퍼블릭 도메인) 카드 78장을 Wikimedia Commons에서 받아
 * 600px 폭 webp로 변환해 public/cards/ 에 저장한다.
 *
 * 실행: node scripts/fetch-images.mts [--force]
 * 출처: https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const UA = "taro-dev/0.1 (local tarot app; image fetch script)";
const OUT = path.join(import.meta.dirname, "..", "public", "cards");
const WIDTH = 600;
const force = process.argv.includes("--force");

const MAJORS = [
  "Fool", "Magician", "High Priestess", "Empress", "Emperor", "Hierophant", "Lovers", "Chariot",
  "Strength", "Hermit", "Wheel of Fortune", "Justice", "Hanged Man", "Death", "Temperance", "Devil",
  "Tower", "Star", "Moon", "Sun", "Judgement", "World",
];
const SUITS = { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pentacles" } as const;

const pad = (n: number) => String(n).padStart(2, "0");

const jobs: { commons: string; out: string }[] = [
  ...MAJORS.map((name, i) => ({ commons: `RWS1909 - ${pad(i)} ${name}.jpeg`, out: `major/${pad(i)}.webp` })),
  ...Object.entries(SUITS).flatMap(([dir, name]) =>
    Array.from({ length: 14 }, (_, i) => ({ commons: `RWS1909 - ${name} ${pad(i + 1)}.jpeg`, out: `${dir}/${pad(i + 1)}.webp` })),
  ),
];

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 429(요청 과다) 시 점점 길게 기다리며 재시도 */
async function politeFetch(url: string | URL): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res;
    if (attempt >= 6 || (res.status !== 429 && res.status < 500)) {
      throw new Error(`HTTP ${res.status} ${url}`);
    }
    await sleep(2000 * attempt);
  }
}

/** 파일명 → 썸네일 URL (API는 한 번에 50개까지 묶어서 조회) */
async function thumbUrls(files: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < files.length; i += 50) {
    const api = new URL("https://commons.wikimedia.org/w/api.php");
    api.search = new URLSearchParams({
      action: "query",
      titles: files.slice(i, i + 50).map((f) => `File:${f}`).join("|"),
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: String(WIDTH * 2),
      format: "json",
    }).toString();
    const json = (await (await politeFetch(api)).json()) as {
      query: {
        normalized?: { from: string; to: string }[];
        pages: Record<string, { title: string; imageinfo?: { thumburl?: string; url: string }[] }>;
      };
    };
    const toOriginal = new Map((json.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const page of Object.values(json.query.pages)) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const title = toOriginal.get(page.title) ?? page.title;
      out.set(title.replace(/^File:/, ""), info.thumburl ?? info.url);
    }
    await sleep(500);
  }
  return out;
}

async function run(job: (typeof jobs)[number], url: string | undefined) {
  const dest = path.join(OUT, job.out);
  if (!force && (await exists(dest))) return "skip";
  if (!url) throw new Error(`Commons에 파일 없음: ${job.commons}`);
  const buf = Buffer.from(await (await politeFetch(url)).arrayBuffer());
  const webp = await sharp(buf).resize({ width: WIDTH }).webp({ quality: 82 }).toBuffer();
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, webp);
  await sleep(400);
  return "ok";
}

const pending: typeof jobs = [];
for (const job of jobs) {
  if (force || !(await exists(path.join(OUT, job.out)))) pending.push(job);
}
console.log(`받을 카드 ${pending.length}장 (이미 있음 ${jobs.length - pending.length}장)`);

const urls = await thumbUrls(pending.map((j) => j.commons));
const failed: string[] = [];
let done = 0;
for (const job of pending) {
  try {
    await run(job, urls.get(job.commons));
    console.log(`[${++done}/${pending.length}] ${job.out}`);
  } catch (e) {
    failed.push(job.out);
    console.error(`FAIL ${job.out}: ${(e as Error).message}`);
  }
}

if (failed.length) {
  console.error(`\n실패 ${failed.length}건: ${failed.join(", ")}`);
  process.exit(1);
}
console.log(`\n완료: ${jobs.length}장`);
