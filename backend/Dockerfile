FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Migrate, then serve. Putting this in the start path rather than a platform
# "pre-deploy" setting means the schema is brought up to date wherever the
# image runs, instead of depending on a dashboard field that is easy to leave
# unset — which is exactly how production ended up serving code against a
# database with no Membership table.
#
# Safe to run on every boot: migrate deploy applies only what is pending and
# is a no-op otherwise. With several instances starting at once Prisma's
# advisory lock makes the losers wait rather than double-apply.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]