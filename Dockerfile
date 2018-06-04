FROM node:latest

WORKDIR /usr/src

COPY package.json .
COPY yarn.lock .

RUN yarn

COPY . /usr/src

RUN yarn build

ENV NODE_ENV=production

ENV PORT=8080

EXPOSE 8080

CMD yarn start
