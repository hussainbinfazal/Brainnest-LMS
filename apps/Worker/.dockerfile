FROM node:alpine AS base
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*","npm-shrinkwrap.json*","./"]




#Development Image
FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm","run","dev"]


# Production dependencies
FROM base AS deps
ENV NODE_ENV=production
RUN npm ci --omit=dev

# Production Stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN chown -R node /usr/src/app
USER node
EXPOSE 3000
CMD ["npm","start"]



