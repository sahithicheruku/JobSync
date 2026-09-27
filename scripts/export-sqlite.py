"""Read-only SQLite export. Treat output as private: it includes password hashes."""
import json
import sqlite3
import sys
from pathlib import Path

source = Path(sys.argv[1]).resolve(strict=True)
connection = sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)
connection.row_factory = sqlite3.Row
tables = [r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'")]
print(json.dumps({table: [dict(row) for row in connection.execute('SELECT * FROM "' + table.replace('"', '""') + '"')] for table in tables}))
