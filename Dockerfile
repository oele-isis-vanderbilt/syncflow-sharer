FROM node:24 AS build

# Enable pnpm via Corepack (bundled with Node 24)
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install

COPY . .
RUN pnpm run build
RUN pnpm prune --prod

FROM node:24 AS run

ENV NODE_ENV=production

WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

ENTRYPOINT ["node", "build"]