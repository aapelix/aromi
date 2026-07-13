FROM oven/bun:latest

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile
RUN bun --cwd apps/web build

WORKDIR /app/apps/web

CMD ["bun", "run", "start"]
