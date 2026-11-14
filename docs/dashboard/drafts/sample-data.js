// Shared SAMPLE data for the three dashboard drafts (guidelines.md section 6, plus Direction B's extra fields).
// Every number here is SAMPLE unless a draft labels it LIVE (only the clock is live). Sums are kept: 4+3+2+38+3 = 50 tasks,
// milestone totals 9+8+7+6+9+5+6 = 50, by-role counts = 50.
// Read with a plain <script src>; no fetch, no modules, so it works from file://.
const DATA = {
  deadline: "2026-11-15T18:00:00+02:00",
  buildStart: "2026-11-14T12:00:00+02:00",
  freeze:   "2026-11-15T13:00:00+02:00",
  submitBy: "2026-11-15T17:00:00+02:00",
  milestones: [ // done/total are SAMPLE counts; real build reads Linear
    { id:"M1", name:"Setup and dashboard pick",   start:"Sat 15:00", end:"Sat 18:00", done:4, total:9, gate:"Both roles can log in as patient and doctor" },
    { id:"M2", name:"Digitize and identity",      start:"Sat 18:00", end:"Sat 22:00", done:0, total:8, gate:"A1 at 90% on 5 docs, else cut to English and 2 exam types" },
    { id:"M3", name:"Diary and handshake",        start:"Sat 22:00", end:"Sun 02:00", done:0, total:7, gate:"Demo steps 1, 2, 4 run end to end" },
    { id:"M4", name:"Doctor's assistant",         start:"Sun 02:00", end:"Sun 08:00", done:0, total:6, gate:"Demo steps 5 and 6 run" },
    { id:"M5", name:"P1 if P0 is green",          start:"Sun 08:00", end:"Sun 13:00", done:0, total:9, gate:"All 8 steps run" },
    { id:"M6", name:"Freeze, 3 clean runs",       start:"Sun 13:00", end:"Sun 15:30", done:0, total:5, gate:"3 clean runs in a row" },
    { id:"M7", name:"Submission and pitch prep",  start:"Sun 15:30", end:"Sun 18:00", done:0, total:6, gate:"Submitted by 17:00" }
  ],                                   // totals: 50 issues, 4 done = 8%
  current: "M1",
  tasks: { done:4, inProgress:3, inReview:2, open:38, blocked:3, total:50,   // 4+3+2+38+3 = 50
           byRole:{ Product:9, Design:6, Frontend:11, Backend:10, Marketing:4, Sales:2, CTO:3, E2E:3, Release:2 } },   // sums to 50
  tokens: { // weighted tokens (in x1, cache write x2, cache read x0.1, out x5), SAMPLE
    agentCaps:{ soft:300000, hard:400000 }, chatCaps:{ soft:350000, hard:400000 },
    perAgent:[ {n:"Back",v:210000},{n:"Anna",v:140000},{n:"Pix",v:180000},{n:"Ren",v:95000},{n:"Cron",v:60000},
               {n:"CTO",v:85000},{n:"Spast",v:70000},{n:"Release",v:30000},{n:"CEO",v:25000},{n:"E2E",v:10000} ],
    perChat:[ {n:"Coordinator (main)",v:338000},{n:"Design chat",v:152000},{n:"Frontend chat",v:97000},{n:"Backend chat",v:61000} ],
    series:[ /* 12 cumulative points, one per 15 min, Sat 12:30 to 15:15 */ 40,95,150,240,330,420,520,640,760,880,1010,1130 ].map(k=>k*1000)
  },
  money: { // SAMPLE, no live source. EUR estimate = tokens by model x rate card; credits entered by hand
    estimateEUR: 41.8, estimateSeries:[0.9,2.1,4.0,6.2,9.0,12.4,16.5,20.9,26.0,31.2,36.4,41.8],
    credits:[ {n:"Google AI (Gemini)",granted:300,used:38}, {n:"fal",granted:50,used:0}, {n:"Firecrawl",granted:100,used:12}, {n:"treg",granted:50,used:0} ] // amounts to be confirmed at kickoff (PRD Q13)
  },
  agents:[ // who works on what, SAMPLE (live: Linear issue + session file time)
    {n:"Pix",role:"Design",state:"active",issue:"MIN-4446",title:"Dashboard guidelines + 3 directions",last:"1m"},
    {n:"Back",role:"Product",state:"active",issue:"MIN-4445",title:"Real-time dashboard: goal and metrics",last:"3m"},
    {n:"Anna",role:"Marketing",state:"active",issue:"MIN-4429",title:"Short pitch deck copy",last:"6m"},
    {n:"Ren",role:"Frontend",state:"idle",issue:"MIN-4447",title:"3 clickable drafts (waits on Design)",last:"12m"},
    {n:"Cron",role:"Backend",state:"idle",issue:"-",title:"Waiting on PRD sign-off",last:"41m"},
    {n:"CTO",role:"CTO",state:"idle",issue:"-",title:"Reviewing Gemini endpoint terms",last:"18m"},
    {n:"Release",role:"Release",state:"idle",issue:"-",title:"-",last:"2h"}
  ],
  flags:[ // derived (risk rules from MIN-4445 item 7), SAMPLE. The drafts re-derive the same rules from the live sample state;
          // these two are the starting values. `until` (draft addition) hides a flag once its moment has passed.
    {level:"warn", text:"Coordinator chat at 338k of 350k soft cap"},
    {level:"warn", text:"M1 gate: 2 setup issues open, 2.5 h left in the block", until:"2026-11-14T18:00:00+02:00",
     plain:"Milestone 1 may slip: 2 setup issues are open and 2.5 hours remain.", act:"Finish both log-ins before 18:00."}
  ],
  demo:{ // SAMPLE, set by hand by CTO or Release after each run
    build:{state:"pass", label:"Build #14 passed", at:"15:12"}, deploy:{state:"warn", label:"Staging: deploying"}, url:"https://demo.example.app (sample)",
    cleanRuns:0, cleanTarget:3,
    steps:[ {n:1,t:"Photograph a blood test, record appears",s:"pass"},{n:2,t:"Refuses a document with the wrong name and ID",s:"pass"},
            {n:3,t:"Symptom diary records without interpreting",s:"warn"},{n:4,t:"DNA-shaped QR handshake, countdown starts",s:"warn"},
            {n:5,t:"Doctor asks, answer cites the source exam",s:"fail"},{n:6,t:"Possible causes, for the doctor only",s:"idle"},
            {n:7,t:"Possible matches, opt-in",s:"idle"},{n:8,t:"Access ends, log shows who looked",s:"idle"} ],
    notes:{ 1:"Sample run 15:02. Record appeared in 4 s.", 2:"Sample run 15:02. Wrong name refused.", 3:"Sample run 15:02. Records, but one line reads like advice.", 4:"Sample run 15:02. QR scans, countdown starts late.",
            5:"Sample run 15:02. Answer cites 2 of 3 exams.", 6:"Not run yet.", 7:"Not run yet.", 8:"Not run yet." }
  },
  exercises:[ // the 7 lean pages in docs/lean/ (read-only source); full text is in shared/content.js
    {n:"00",t:"Summary",f:"00-summary.md"},{n:"01",t:"Personas",f:"01-personas.md"},{n:"02",t:"Empathy maps",f:"02-empathy-maps.md"},
    {n:"03",t:"Competitor analysis",f:"03-competitor-analysis.md"},{n:"04",t:"Value proposition",f:"04-value-proposition.md"},
    {n:"05",t:"Business model canvas",f:"05-business-model-canvas.md"},{n:"06",t:"Market fit scorecard",f:"06-market-fit-scorecard.md"}
  ],
  decks:[ {id:"full",t:"Pitch deck, 13 slides",f:"deck-draft.html",slides:13}, {id:"short",t:"Short pitch, 6 slides, about 90 seconds",f:"deck-short.html",slides:6} ]
};

// ---- Direction B extras (agent work periods on the shared time axis) ----
DATA.lanes = [ // SAMPLE (real build: Linear issue + session file times). "now" means the clock.
  { agent:"Pix",  bars:[ {issue:"MIN-4441", from:"2026-11-14T12:30", to:"2026-11-14T14:05", state:"done"},
                         {issue:"MIN-4446", from:"2026-11-14T15:05", to:"now", state:"active"} ] },
  { agent:"Back", bars:[ {issue:"MIN-4435", from:"2026-11-14T12:10", to:"2026-11-14T13:40", state:"done"},
                         {issue:"MIN-4445", from:"2026-11-14T14:50", to:"now", state:"active"} ] },
  { agent:"Anna", bars:[ {issue:"MIN-4429", from:"2026-11-14T13:00", to:"now", state:"active"} ] },
  { agent:"Ren",  bars:[ {issue:"MIN-4447", from:"2026-11-14T15:30", to:"2026-11-14T18:00", state:"planned"} ], waitsOn:"MIN-4446" },
  { agent:"Cron", bars:[] },
  { agent:"CTO",  bars:[ {issue:"-", from:"2026-11-14T13:20", to:"2026-11-14T14:00", state:"done"} ] },
  { agent:"Release", bars:[] }
];
DATA.flagsTimed = [ {at:"2026-11-14T15:12", level:"warn", text:"Coordinator chat 338k of 350k"},
                    {at:"2026-11-14T18:00", level:"warn", forecast:true, text:"M1 gate 18:00 at risk"} ];
DATA.tokens.projection = { at:"2026-11-15T18:00", v:4100000 };      // straight line from the last point
DATA.money.projection  = { at:"2026-11-15T18:00", v:190 };
