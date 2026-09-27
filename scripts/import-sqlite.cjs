// Run against an EMPTY migrated PostgreSQL database. All inserts are atomic.
const { PrismaClient, Prisma } = require('@prisma/client');
const { readFileSync } = require('node:fs');
const prisma = new PrismaClient();
async function main() {
  const input = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const models = Prisma.dmmf.datamodel.models;
  const known = new Set(models.map(m => m.name));
  for (const name of Object.keys(input)) if (!known.has(name)) throw new Error(`Unknown source table: ${name}`);
  const remaining = models.filter(m => input[m.name]?.length);
  const ordered = [];
  while (remaining.length) {
    const index = remaining.findIndex(m => !m.fields.some(f => f.relationFromFields?.length && remaining.some(other => other.name === f.type)));
    if (index < 0) throw new Error('Cyclic source relationships; import stopped without changes.');
    ordered.push(remaining.splice(index, 1)[0]);
  }
  await prisma.$transaction(async tx => {
    for (const m of models) {
      if (await tx[m.name[0].toLowerCase() + m.name.slice(1)].count()) throw new Error('Destination must be empty; no data was changed.');
    }
    for (const m of ordered) {
      const rows = input[m.name].map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => {
        const field = m.fields.find(f => f.name === key && f.kind !== 'object');
        if (!field) throw new Error(`Unknown field ${m.name}.${key}`);
        if (value !== null && field.type === 'DateTime') value = new Date(typeof value === 'number' ? value : value);
        if (value !== null && field.type === 'Boolean') value = Boolean(value);
        return [key, value];
      })));
      const delegate = tx[m.name[0].toLowerCase() + m.name.slice(1)];
      await delegate.createMany({ data: rows });
      if (await delegate.count() !== rows.length) throw new Error(`Count mismatch: ${m.name}`);
      console.log(`${m.name}: ${rows.length} rows verified`);
    }
  }, { timeout: 120000 });
}
main().catch(() => { console.error('Import failed and rolled back. Check source schema, dates, and destination connection.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
