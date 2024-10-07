# Use Node Alpine image
FROM node:lts-alpine

# Set the working directory
WORKDIR /app

# Install Chromium for Alpine (instead of Google Chrome) and necessary dependencies
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# Set Puppeteer to use the Alpine-installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose the application port
EXPOSE 3033

# Start the application
CMD ["npm", "run", "start"]
