# Use Node 20 Alpine base image
FROM node:20-alpine AS base

# Install dependencies required for building native modules if needed
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy full application code
COPY . .

# Create public uploads directory with proper permissions
RUN mkdir -p public/uploads

# Expose Next.js server port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Auto-seed static users upon container launch and start development server
CMD ["sh", "-c", "node --env-file=.env.local prisma/seed.js || node prisma/seed.js; npm run dev"]
