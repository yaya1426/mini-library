FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN DATABASE_URL="postgresql://x:x@localhost:5432/x" SESSION_SECRET="build-only-secret-build-only-secret" \
    sh -c "npx prisma generate && npm run build"
RUN mkdir -p /app/logs
ENV NODE_ENV=production
EXPOSE 3000
CMD sh -c "npx prisma migrate deploy && npx prisma db seed && npm start 2>&1 | tee -a /app/logs/app.log"
