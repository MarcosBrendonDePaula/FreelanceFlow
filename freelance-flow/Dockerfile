FROM node:18-alpine

WORKDIR /app

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

# Copiar package.json e package-lock.json (ou yarn.lock)
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código-fonte
COPY . .

# Gerar o Prisma client
RUN npx prisma generate

# Construir aplicação para desenvolvimento
RUN npm run build

# Expor a porta que a aplicação usa
EXPOSE 3000

# Comando para iniciar a aplicação
# Nota: Este comando será sobrescrito pelo comando no docker-compose.yml
CMD ["npm", "run", "dev"]
