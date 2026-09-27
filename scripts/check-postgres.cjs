// Run only against a migrated test database. The transaction always rolls back.
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const prisma = new PrismaClient();
const rollback = new Error('test rollback');
async function main() {
  await prisma.$transaction(async tx => {
    const user = await tx.user.create({ data: { name: 'Migration test', email: `${randomUUID()}@example.test`, password: 'not-a-login-hash' } });
    const profile = await tx.profile.create({ data: { userId: user.id } });
    const resume = await tx.resume.create({ data: { profileId: profile.id, title: 'Test version' } });
    const result = { overall: 0, missingSkills: ['TypeScript'], components: [], unavailable: null };
    await tx.careerAnalysis.create({ data: { userId: user.id, resumeId: resume.id, resumeTitle: resume.title, resumeHash: 'test-hash', kind: 'match', provider: 'test', model: 'test', rubric: 'career-v1', result } });
    const saved = await tx.careerAnalysis.findFirst({ where: { userId: user.id } });
    assert.deepEqual(saved.result, result);
    assert.equal(await tx.resume.count({ where: { id: resume.id, profile: { userId: 'another-user' } } }), 0);
    assert(saved.createdAt instanceof Date);
    throw rollback;
  }).catch(error => { if (error !== rollback) throw error; });
  console.log('PostgreSQL relations, JSON, timestamps, and owner filtering verified; fixture rolled back.');
}
main().catch(error => { console.error(error.name); process.exitCode = 1; }).finally(() => prisma.$disconnect());
