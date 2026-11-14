# Pitch script: 3 minutes (MIN-4524)

Semifinal, about Sun 19:00. Judging: usefulness, craft, aura. Run the live demo; if a step fails, switch to the screenshots and narrate, do not retry. Everything on screen is the working demo. Times are cumulative.

## 0:00 to 0:25. The problem

"This is Maria. She has knee pain. At night she asks a search engine what it means. By day she sees two doctors, and each sees only the page she remembered to bring. Her history is a folder of paper. Up to 15 percent of diagnoses are inaccurate, delayed or wrong. We give the doctor the whole history, in seconds."

## 0:25 to 0:55. Scan and check

*Screen: Maria photographs a blood test.*
"Maria photographs an exam. About 17 seconds later it is values, dates, units and ranges, and she checks every one before it is saved. On our synthetic test set all 235 of 235 fields were read correctly."
*Screen: she adds her husband's exam.*
"Her husband's exam: refused. Not her name, not her ID."

## 0:55 to 1:25. The handshake

*Screen: DNA code on her phone, doctor scans, she approves.*
"At the orthopaedist she shows a code shaped like DNA. He scans, she approves. The doctor's view opens in 3.6 seconds, with a timer. In person, with her yes, for a set time. The database refuses anyone outside that grant."

## 1:25 to 2:10. The doctor asks

*Screen: "Has her CRP been raised before?"*
"He asks: has her CRP been raised before? About 15 seconds later: dates and values, five sources, each one a link to the exam it came from. The assistant answers only from her record. If it is not there, it says so."
*Screen: possibilities view.*
"He can ask for possibilities. They are labelled for the doctor to evaluate, with their sources, and never shown to Maria. The patient never gets a diagnosis from us."

## 2:10 to 2:35. It ends

*Screen: time runs out.*
"Time ends. The doctor's screen clears in about 3 seconds. Maria's log shows who looked and until when. The log holds fingerprints and access events, never health data. No insurer ever gets in."

## 2:35 to 3:00. Honest close

"What is real: reading, identity match, time-limited access enforced in the database, the signed log. What is simulated tonight: the key sits on our server, not her phone; the verified-by-source lab is ours; possible matches come from a seeded set. Next: keys on the patient's device, real labs, and the regulatory path. Maria should not have to ask a search engine. Her doctor should already know."

## Likely questions (answers from the record)

- Is it a medical device? Possibly, for the doctor-side possibilities. The regulatory path (EU MDR, GDPR, EHDS) is the closing slide of the deck, and nothing is certified.
- Real patients or pilots? None. Synthetic data, nobody contacted.
- Blockchain? No. A signed, hash-chained log of fingerprints and grants; health data on a chain would conflict with GDPR erasure.
