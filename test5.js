const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client/sqlite3');

const url = 'file:./dev.db';
const libsql = createClient({ url });
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter, datasources: { db: { url } } });

prisma.settings.findFirst().then(console.log).catch(console.error);
