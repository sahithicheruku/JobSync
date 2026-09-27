// Integration test: temporary PostgreSQL schema and SQLite fixture; no user data.
const { PrismaClient } = require('@prisma/client');
const { execFileSync, spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, dirname } = require('node:path');
const prismaCli = join(dirname(require.resolve('prisma/package.json')), 'build', 'index.js');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a disposable PostgreSQL database.');
const schema = 'import_test_' + randomUUID().replaceAll('-', '');
const url = new URL(process.env.TEST_DATABASE_URL);
url.searchParams.set('schema', schema);
const env = { ...process.env, DATABASE_URL: url.toString() };
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
const dir = mkdtempSync(join(tmpdir(), 'jobsync-import-'));
const exported = join(dir, 'fixture.json');
function runImport(file) {
  return spawnSync(process.execPath, ['scripts/import-sqlite.cjs', file], { env, encoding: 'utf8' });
}
async function main() {
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], { env, stdio: 'pipe' });
  const sql = execFileSync(process.execPath, [prismaCli, 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.sqlite.prisma', '--script'], { env: { ...process.env, DATABASE_URL: `file:${join(dir, 'source.db')}` }, encoding: 'utf8' });
  writeFileSync(join(dir, 'schema.sql'), sql);
  execFileSync('python3', ['-c', `
import sqlite3,sys
from pathlib import Path
root=Path(sys.argv[1]); c=sqlite3.connect(root/'source.db')
c.executescript((root/'schema.sql').read_text())
c.execute('INSERT INTO "User" (id,name,email,password,createdAt) VALUES (?,?,?,?,?)',('owner','Fixture','fixture@example.test','unchanged-hash',1704067200000))
c.execute('INSERT INTO "Profile" (id,userId) VALUES (?,?)',('profile','owner'))
c.execute('INSERT INTO "Resume" (id,profileId,title,createdAt,updatedAt) VALUES (?,?,?,?,?)',('resume','profile','Résumé version 1',1704067200000,1704067200000))
c.execute('INSERT INTO "JobTitle" (id,label,value,createdBy) VALUES (?,?,?,?)',('title','Engineer','engineer','owner'))
c.execute('INSERT INTO "Company" (id,label,value,createdBy) VALUES (?,?,?,?)',('company','Example','example','owner'))
c.execute('INSERT INTO "JobStatus" (id,label,value) VALUES (?,?,?)',('status','Applied','applied'))
c.execute('INSERT INTO "Job" (id,userId,description,jobType,createdAt,applied,appliedDate,statusId,jobTitleId,companyId,resumeId) VALUES (?,?,?,?,?,?,?,?,?,?,?)',('job','owner','TypeScript role','FT',1704067200000,1,1704067200000,'status','title','company','resume'))
c.commit(); c.close()
`, dir]);
  const json = execFileSync('python3', ['scripts/export-sqlite.py', join(dir, 'source.db')], { encoding: 'utf8' });
  writeFileSync(exported, json, { mode: 0o600 });
  const invalid = JSON.parse(json);
  invalid.Job[0].resumeId = 'nonexistent-resume';
  const invalidPath = join(dir, 'invalid.json');
  writeFileSync(invalidPath, JSON.stringify(invalid), { mode: 0o600 });
  assert.notEqual(runImport(invalidPath).status, 0, 'Broken FK must reject the import');
  assert.equal(await db.user.count(), 0, 'Earlier inserts must roll back');
  assert.equal(await db.resume.count(), 0, 'Resume inserts must roll back');
  const success = runImport(exported);
  assert.equal(success.status, 0, success.stderr);
  const user = await db.user.findUniqueOrThrow({ where: { id: 'owner' } });
  assert.equal(user.password, 'unchanged-hash');
  assert.equal(user.createdAt.toISOString(), '2024-01-01T00:00:00.000Z');
  const job = await db.job.findUniqueOrThrow({ where: { id: 'job' }, include: { Resume: { include: { profile: true } } } });
  assert.equal(job.applied, true);
  assert.equal(job.appliedDate.toISOString(), '2024-01-01T00:00:00.000Z');
  assert.equal(job.locationId, null);
  assert.equal(job.Resume.title, 'Résumé version 1');
  assert.equal(job.Resume.profile.userId, user.id);
  assert.notEqual(runImport(exported).status, 0, 'Nonempty destination must be refused');
  assert.equal(await db.user.count(), 1);
  assert.equal(await db.job.count(), 1);
  console.log('PASS: SQLite export → PostgreSQL import preserves IDs, relations, Unicode, dates, booleans, nulls, password hashes and row counts.');
  console.log('PASS: Foreign-key failure rolls back all inserts; repeat import refuses a nonempty destination.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  // Name is generated locally, never taken from input.
  await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await db.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});
