// Renders the synthetic exam set (MIN-4475): ground-truth.json -> HTML -> JPEG (1000x1414, A4-like).
// Every name, ID, lab and value is invented; each page carries a visible "synthetic" line.
//   deno run --allow-read --allow-write --allow-run scripts/synthetic/render.ts
// Needs Google Chrome (headless) and macOS `sips`. The JPEGs are committed; run this only to change the set.
const ROOT = new URL("../../tests/synthetic/", import.meta.url);
const gt = JSON.parse(Deno.readTextFileSync(new URL("ground-truth.json", ROOT)));
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

type Doc = {
  n: number; file: string; kind: string; language: "el" | "en"; issuer: string; exam_date_printed: string;
  printed_name: string | null; printed_id: string | null; render: { title: string; blur: number };
  results: { analyte: string; value: string; unit: string; ref: string; flag: string }[];
  findings: { kind: string; text: string }[];
};

const L = {
  el: { name: "Ονοματεπώνυμο", id: "ΑΔΤ", date: "Ημερομηνία εξέτασης", test: "Εξέταση", value: "Αποτέλεσμα", unit: "Μονάδες",
    ref: "Φυσιολογικές τιμές", mark: "Σήμ.", synth: "ΣΥΝΘΕΤΙΚΟ ΕΓΓΡΑΦΟ · φανταστικά στοιχεία · δεν είναι ιατρική γνωμάτευση",
    findings: "Ευρήματα", conclusion: "Συμπέρασμα", ref_by: "Παραπομπή: Ορθοπεδικό ιατρείο" },
  en: { name: "Patient name", id: "ID", date: "Date of examination", test: "Test", value: "Result", unit: "Units",
    ref: "Reference range", mark: "Flag", synth: "SYNTHETIC DOCUMENT · fictional data · not a medical document",
    findings: "Findings", conclusion: "Conclusion", ref_by: "Referred by: Orthopaedics" },
};
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function page(d: Doc): string {
  const t = L[d.language];
  const patient = d.printed_name
    ? `<div class="box"><div><b>${t.name}:</b> ${esc(d.printed_name)}</div>${d.printed_id ? `<div><b>${t.id}:</b> ${esc(d.printed_id)}</div>` : ""}<div><b>${t.date}:</b> ${esc(d.exam_date_printed)}</div></div>`
    : `<div class="box"><div><b>${t.date}:</b> ${esc(d.exam_date_printed)}</div></div>`;
  let body = "";
  if (d.kind === "blood_test") {
    body = `<table><tr><th>${t.test}</th><th>${t.value}</th><th>${t.unit}</th><th>${t.ref}</th><th>${t.mark}</th></tr>${
      d.results.map((r) => `<tr class="${r.flag === "normal" ? "" : "out"}"><td>${esc(r.analyte)}</td><td class="v">${esc(r.value)}</td><td>${esc(r.unit)}</td><td>${esc(r.ref)}</td><td>${r.flag === "high" ? "↑" : r.flag === "low" ? "↓" : ""}</td></tr>`).join("")
    }</table>`;
  } else if (d.kind === "imaging_report") {
    const note = d.findings.find((f) => f.kind === "note")!, concl = d.findings.find((f) => f.kind === "conclusion")!;
    body = `<p class="meta">${t.ref_by}</p><h3>${t.findings}</h3><p>${esc(note.text)}</p><h3>${t.conclusion}</h3><p class="concl">${esc(concl.text)}</p>`;
  } else {
    const get = (k: string) => d.findings.find((f) => f.kind === k)!.text;
    body = `<p>Dear colleague, I reviewed the patient named above in clinic.</p><h3>Diagnosis</h3><p>${esc(get("written_diagnosis"))}</p>
<h3>History</h3><p>${esc(get("note"))}</p><h3>Plan</h3><p>${esc(get("medication"))}</p><p class="meta">Yours sincerely,<br>${esc(d.issuer.split(",")[0])}</p>`;
  }
  const issuer = d.kind === "doctor_letter" ? esc(d.issuer) : esc(d.issuer);
  return `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;background:#fff}body{width:1000px;height:1414px;font:20px/1.45 Arial,"Helvetica Neue",sans-serif;color:#1b1b1b;position:relative;overflow:hidden}
.wrap{padding:60px 70px;${d.render.blur ? `filter:blur(${d.render.blur}px);` : ""}}
.head{border-bottom:3px solid #2a5d8f;padding-bottom:10px;margin-bottom:26px}.head .lab{font-size:30px;font-weight:700;color:#2a5d8f}
.head .addr{font-size:16px;color:#555}h1{font-size:23px;margin:0 0 22px}h3{margin:22px 0 4px;font-size:20px}
.box{border:1px solid #888;padding:12px 16px;margin-bottom:26px}table{border-collapse:collapse;width:100%}
th,td{border-bottom:1px solid #bbb;padding:8px 10px;text-align:left;font-size:19px}th{background:#eef3f8}.v{font-weight:700}
tr.out .v{color:#9a1c1c}.concl{font-weight:700}.meta{color:#444}
.foot{position:absolute;bottom:28px;left:70px;right:70px;font-size:14px;color:#777;border-top:1px solid #ccc;padding-top:6px}
</style><div class="wrap"><div class="head"><div class="lab">${issuer}</div><div class="addr">Odos Dokimis 12, Athina · Tel. 210 0000000 (fictional)</div></div>
<h1>${esc(d.render.title)}</h1>${patient}${body}</div><div class="foot">${t.synth}</div>`;
}

const tmp = await Deno.makeTempDir();
for (const d of gt.documents as Doc[]) {
  const html = `${tmp}/${d.n}.html`, png = `${tmp}/${d.n}.png`;
  Deno.writeTextFileSync(html, page(d));
  const r = await new Deno.Command(CHROME, {
    args: ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1000,1414",
      `--screenshot=${png}`, `file://${html}`], stdout: "null", stderr: "null",
  }).output();
  if (!r.success) throw new Error(`chrome failed for doc ${d.n}`);
  const out = new URL(`docs/${d.file}`, ROOT).pathname;
  const s = await new Deno.Command("sips", { args: ["-s", "format", "jpeg", "-s", "formatOptions", "85", png, "--out", out], stdout: "null", stderr: "null" }).output();
  if (!s.success) throw new Error(`sips failed for doc ${d.n}`);
  console.log(`doc ${d.n}: ${d.file}`);
}
await Deno.remove(tmp, { recursive: true });
