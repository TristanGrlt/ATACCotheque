import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'
import { rebuildExamsIndex, syncExamsForUpdatedEntities } from './searchIndexSync.js';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const basePrisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
})

const prisma = basePrisma.$extends({
  query: {
    course: {
      async update({ args, query }) {
        const result = await query(args);
        try {
          if (typeof result?.id === 'number') {
            await syncExamsForUpdatedEntities(basePrisma, { courseIds: [result.id] });
          }
        } catch (error) {
          console.error('Meilisearch sync warning after course update:', error);
        }
        return result;
      },
      async upsert({ args, query }) {
        const result = await query(args);
        try {
          if (typeof result?.id === 'number') {
            await syncExamsForUpdatedEntities(basePrisma, { courseIds: [result.id] });
          }
        } catch (error) {
          console.error('Meilisearch sync warning after course upsert:', error);
        }
        return result;
      },
      async updateMany({ args, query }) {
        const result = await query(args);
        try {
          if (result.count > 0) {
            await rebuildExamsIndex(basePrisma);
          }
        } catch (error) {
          console.error('Meilisearch sync warning after course updateMany:', error);
        }
        return result;
      },
    },
    major: {
      async update({ args, query }) {
        const result = await query(args);
        try {
          if (typeof result?.id === 'number') {
            await syncExamsForUpdatedEntities(basePrisma, { majorIds: [result.id] });
          }
        } catch (error) {
          console.error('Meilisearch sync warning after major update:', error);
        }
        return result;
      },
      async upsert({ args, query }) {
        const result = await query(args);
        try {
          if (typeof result?.id === 'number') {
            await syncExamsForUpdatedEntities(basePrisma, { majorIds: [result.id] });
          }
        } catch (error) {
          console.error('Meilisearch sync warning after major upsert:', error);
        }
        return result;
      },
      async updateMany({ args, query }) {
        const result = await query(args);
        try {
          if (result.count > 0) {
            await rebuildExamsIndex(basePrisma);
          }
        } catch (error) {
          console.error('Meilisearch sync warning after major updateMany:', error);
        }
        return result;
      },
    },
    examType: {
      async update({ args, query }) {
        const result = await query(args);
        try {
          if (typeof result?.id === 'number') {
            await syncExamsForUpdatedEntities(basePrisma, { examTypeIds: [result.id] });
          }
        } catch (error) {
          console.error('Meilisearch sync warning after examType update:', error);
        }
        return result;
      },
      async upsert({ args, query }) {
        const result = await query(args);
        try {
          if (typeof result?.id === 'number') {
            await syncExamsForUpdatedEntities(basePrisma, { examTypeIds: [result.id] });
          }
        } catch (error) {
          console.error('Meilisearch sync warning after examType upsert:', error);
        }
        return result;
      },
      async updateMany({ args, query }) {
        const result = await query(args);
        try {
          if (result.count > 0) {
            await rebuildExamsIndex(basePrisma);
          }
        } catch (error) {
          console.error('Meilisearch sync warning after examType updateMany:', error);
        }
        return result;
      },
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma

export default prisma;
