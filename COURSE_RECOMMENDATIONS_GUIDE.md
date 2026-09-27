# Course recommendations

Existing skill extraction and course recommendation screens remain available. The Next.js authenticated `/api/ml/*` routes call the internal Python service. It uses spaCy, a skill vocabulary, and all-MiniLM-L6-v2 embeddings over the bundled Coursera dataset.

Ratings and course details come from that dataset; they are not independently verified or live catalog data. Similarity is a retrieval score, not an accuracy benchmark or completion probability. Course availability may change.

The new Career Intelligence page ranks learning priorities using missing evidence across analyzed saved jobs. Existing job skill-gap/course screens let you explore related courses.

See [ML service setup](ml-service/README.md) and [scoring methodology](docs/SCORING.md).
