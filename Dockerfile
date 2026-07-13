# Estágio 1: Compilar a aplicação React/Vite
FROM node:20-alpine AS build

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante do código fonte da aplicação
COPY . .

# Compilar a aplicação para produção
RUN npm run build

# Estágio 2: Servir a aplicação usando o Nginx
FROM nginx:1.25-alpine

# Copiar os arquivos gerados no build para o diretório público do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80 do container
EXPOSE 80

# Inicia o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
