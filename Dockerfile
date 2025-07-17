# Dockerfile

# Base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build app
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/main"]
