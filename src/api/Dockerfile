FROM node:18-alpine

WORKDIR /app

# Install basic utilities
RUN apk add --no-cache bash

# Copy package files
COPY package*.json ./
RUN npm install

# Copy API source code
COPY . .

# Expose API port
EXPOSE 3000

# Add a startup script that waits for the database to be ready
CMD ["sh", "-c", "echo 'Waiting for database to initialize...' && sleep 10 && npm run dev"]
