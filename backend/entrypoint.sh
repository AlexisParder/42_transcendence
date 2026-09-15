#!/bin/sh
set -e

export CI=true

echo "Generating Prisma client..."
pnpm prisma generate

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
pnpm prisma db seed

echo "Migrations applied. Starting server..."
exec pnpm dev