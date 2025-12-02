FROM mcr.microsoft.com/playwright:v1.56.1

RUN apt update && apt install -y graphicsmagick

WORKDIR /test
COPY . /test
RUN npm ci && npx playwright install --with-deps