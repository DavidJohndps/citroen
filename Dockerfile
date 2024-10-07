FROM node:18-slim

RUN apt-get update && apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  wget \
  xdg-utils \
  libxshmfence1 \
  libxrender1 \
  libxcursor1 \
  libxi6 \
  libgl1-mesa-glx \
  libpangocairo-1.0-0 \
  libpangoft2-1.0-0 \
  libjpeg62-turbo \
  libx11-6 \
  libxext6 \
  libxfixes3 \
  libxft2 \
  libfreetype6 \
  chromium \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*


# make the 'app' folder the current working directory
WORKDIR /app

# copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./

# install project dependencies
RUN npm install

RUN npm install puppeteer --ignore-scripts

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# Add --no-sandbox and --disable-setuid-sandbox as required in Docker
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome


EXPOSE 3033

# Run the Vite preview command
CMD ["npm","run" ,"start"]
