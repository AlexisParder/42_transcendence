#!/bin/sh
set -e

echo "Applying database migrations..."
n=0
until pnpm prisma migrate deploy; do
	n=$((n + 1))
	if ["$n" -ge 10]; then
		echo "Could not reach the database after 10 attempts, giving up."
		exit 1
	fi
	echo "Database not ready yet (attempt $n/10), retrying in 2s..."
	sleep 2
done

echo "Seeding database..."
node dist/seed.js

echo "Migrations applied. Starting server..."
exec node dist/index.js