# LOINC notice

`supabase/sql/020_lab_loinc.sql` seeds `healthapp_<env>.lab_loinc` with 95 LOINC terms (MIN-4689, CTO decision on
MIN-4688). Each row carries the LOINC code, its Long Common Name copied verbatim (never edited), the example UCUM
unit, and the LOINC version it was checked against (2.83). The Greek name (`name_el`) and the `analyte_key` are
ours, not LOINC content.

This material contains content from LOINC (http://loinc.org). LOINC is copyright © Regenstrief Institute, Inc. and the Logical Observation Identifiers Names and Codes (LOINC) Committee and is available at no cost under the license at http://loinc.org/license. LOINC® is a registered United States trademark of Regenstrief Institute, Inc.

## Where the rows were copied from

loinc.org answers automated clients with a Cloudflare challenge (HTTP 403, measured 2026-11-15), so the rows were
read from the LOINC 2.83 release as served by HL7's public terminology server
(`https://tx.fhir.org/r4/CodeSystem/$lookup?system=http://loinc.org&code=<code>`: the en-US LONG_COMMON_NAME,
EXAMPLE_UCUM_UNITS and STATUS of each code), and every Long Common Name was compared with the NLM copy
(`clinicaltables.nlm.nih.gov/api/loinc_items/v3`): 95 of 95 identical, every code ACTIVE. Any row can be checked by
hand at `https://loinc.org/<code>/` in a browser.

## Later

The official Greek linguistic variant (`elGR17LinguisticVariant.csv`, KE.TE.K.N.Y.) needs a free LOINC login. When
it is downloaded, a follow-up fills `name_el` from it. Nothing waits on it.
