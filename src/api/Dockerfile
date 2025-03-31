FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy API source code
COPY . .

# Expose API port
EXPOSE 3000

# Start API server in development mode for hot reloading
CMD ["npm", "run", "dev"]
