# Revision-aware detail explanations

Overview now displays framework tags and includes a recommendation explanation only for a current successful submitted search, matching framework revision, and capability IDs present in the returned details. Unsubmitted draft edits do not change the explanation context. Newer detail metadata announces that framework information was updated while omitting the older explanation. Browse-origin details and review following a failed replacement search do not invent or reuse an explanation.

ATDD on 2026-09-10: four acceptance scenarios initially failed on absent explanations, tags, and revision notices. All four now pass; closing details preserves the draft, submitted query, and original result cards. The complete browser suite passes 57 tests and both workspace builds pass.
