FROM node:lts

# Crie e defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos necessários para o diretório de trabalho
COPY package.json yarn.lock

# Instale as dependências
RUN yarn install

# Copie o restante dos arquivos
COPY ..

# Exponha a porta que a aplicação vai ouvir
EXPOSE 4000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
