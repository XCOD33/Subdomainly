#!/bin/bash

# Cek apakah file .env sudah ada, jika belum, buat
if [ ! -f .env ]; then
    echo ".env file tidak ditemukan, membuat .env file..."
    touch .env
    echo "Isi file .env sesuai kebutuhan Anda"
fi

# Cek apakah prisma sudah pernah di-generate
if [ ! -d "node_modules/.prisma" ]; then
    echo "Prisma belum di-generate, menjalankan npx prisma generate..."
    npx prisma generate
fi

# Cek apakah ada migrasi prisma yang belum diterapkan
# Cara termudah adalah cek adanya folder migrations
if [ ! -d "prisma/migrations" ]; then
    echo "Belum ada migrasi, menjalankan npx prisma migrate dev..."
    npx prisma migrate dev
else
    echo "Migrasi sudah ada, tidak perlu migrate."
fi

# Jalankan aplikasi
echo "Memulai aplikasi dengan npm run start..."
npm run start
