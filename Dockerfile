# tahap pertama: build
FROM node:18-alpine

# direktori kerja
WORKDIR /app

# copy package.json dan instal dependensi
COPY package*.json ./
RUN npm install

# copy semua file aplikasi
COPY . .

# Copy file startup.sh ke dalam container dan beri hak eksekusi
COPY startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

# port aplikasi
EXPOSE 3000

# jalankan aplikasi
CMD [".startup.sh"]