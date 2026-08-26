FROM node:22-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["sh", "/app/entrypoint.sh"]