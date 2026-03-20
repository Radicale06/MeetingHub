#!/bin/sh

# Run migration
echo "Starting DB migration deployment........................................................."
npm run db:migrate:deploy

# Check if migration was successful
if [ $? -eq 0 ]; then
  echo "===========> Database migration successful."
else
  echo "-----> Database migration failed. Exiting."
  exit 1
fi

# Sleep for a few seconds
sleep 3

npx prisma generate

# Sleep for a few seconds
sleep 3

# Seed Supabase users
echo "Seeding Supabase users........................................................."
npm run db:seed

# Sleep for a few seconds
sleep 3

echo "Starting Production........................................................."
npm run start:prod
