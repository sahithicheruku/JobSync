# Scoring and evidence

Rubric `career-v1` uses skills 40%, experience 25%, education 10%, semantic similarity 25%. These are product design weights, not empirically calibrated hiring predictors.

The model extracts explicit requirements and cites verbatim job evidence. Positive assessments require verbatim resume evidence. The server rejects citations absent from the input and duplicate requirements within a category. This checks quotation provenance, not whether the model interpreted the quote correctly.

Each requirement is met (1), partial (0.5), missing (0), or unknown (excluded). A category score is the mean of assessed requirements × 100. An absent/unassessable category has no score. The weighted overall score divides by the sum of available weights; every component exposes its effective weight, assessed/total count, and score. No available components means null, not zero. Zero remains a valid score.

Semantic similarity uses token-sized chunks, averages normalized all-MiniLM-L6-v2 embeddings, and computes cosine similarity. Negative cosine values are clamped to zero; the display is × 100. This is similarity, not calibrated suitability. Service failure excludes that component and is disclosed.

ATS text readiness awards 20 points each for observable contact email, experience heading/evidence, education heading/evidence, skills/projects wording, and year dates. It cannot assess PDF layout or guarantee parsing in an external ATS. Keywords and weak bullets include source evidence; suggestions must not invent experience or numerical achievements.

Insights use the latest saved match for each existing job, not every rerun. Missing skills mean no evidence found in the analyzed resume. Learning priorities sort gaps by number of distinct jobs. Best-fit roles average complete-weight scores for saved role titles and expose sample counts. Saved results may become stale after edits; rerun analysis to refresh them. They do not represent all roles in the labor market.

Applications include an applied flag/date or current applied/interview/offer status. Interview conversion counts those applications with Interview records or current interview/offer status. Rejected jobs without interview history cannot reveal whether an interview happened. Zero applications yields an unavailable conversion, never a made-up rate.

Comparisons require the same analysis type, rubric, and unchanged job context. Match score deltas require identical effective weights. Content hashes distinguish unchanged resumes from actual edits; model variation means changes in AI judgments are not proof of improvement. Snapshots store results and hashes, not complete input documents.
