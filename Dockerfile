FROM node:latest

WORKDIR /usr/src

COPY package.json .
COPY yarn.lock .

RUN yarn

COPY . /usr/src

RUN yarn build

CMD yarn start