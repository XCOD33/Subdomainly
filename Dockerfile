# tahap pertama: build
FROM node:18-alpine

# direktori kerja
WORKDIR /app

# copy package.json dan instal dependensi
COPY package*.json ./
# COPY prisma ./prisma/
# COPY /prisma/schema.prisma ./prisma/schema.prisma
RUN npm install

# copy semua file aplikasi
COPY . .

# # generate prisma client
RUN npx prisma generate
RUN npx prisma migrate dev

# # tahap kedua: setup aplikasi
# FROM node:18

# # direktori kerja
# WORKDIR /usr/src/app

# # copy file dari tahap pertama
# COPY --from=build /usr/src/app .

# port aplikasi
EXPOSE 3000

# jalankan aplikasi
CMD ["npm", "run", "start"]