FROM node:18-alpine

WORKDIR /usr/src/app

# Install wget for healthchecks and other necessary utilities
RUN apk add --no-cache wget curl

COPY package*.json ./

RUN npm install

COPY . .

# Create uploads and data directories with proper permissions
RUN mkdir -p uploads data && chmod -R 777 uploads data

EXPOSE 5000

# Run as root to eliminate permission issues
# We're mounting volumes so we need write access

CMD ["node", "index.js"]
