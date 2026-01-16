#!/bin/sh

echo "🔄 Generating Prisma Client..."
npx prisma generate

echo "🔄 Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "✅ Starting application..."
exec "$@"
