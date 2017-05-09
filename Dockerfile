FROM node:7.5
COPY . /app
WORKDIR /app
CMD ["node", "index.js"]
