# backend/Dockerfile

# 1. Estágio de Build: Instala dependências e compila o TypeScript
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
# Garante que o Prisma Client seja gerado antes do build
RUN npx prisma generate
RUN npm run build

# 2. Estágio de Produção: Instala apenas as dependências de produção e copia os arquivos compilados
FROM node:18-alpine AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /usr/src/app/dist ./dist
# Copia o schema do Prisma para o estágio de produção para que as migrações possam ser executadas
COPY --from=builder /usr/src/app/prisma ./prisma
# Copia o Prisma Client gerado
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# O comando para iniciar sua aplicação
CMD ["node", "dist/server.js"]
