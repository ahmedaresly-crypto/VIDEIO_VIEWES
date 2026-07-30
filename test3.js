const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client/sqlite3');

const libsql = createClient({ url: 'file:./dev.db' });
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

prisma.settings.findFirst().then(console.log).catch(e => console.log(e.stack));
