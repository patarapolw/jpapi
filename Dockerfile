FROM node:12-alpine
RUN mkdir -p /lib
WORKDIR /lib
RUN apk add alpine-sdk
COPY packages/server/lib /lib
RUN tar zxfv mecab-0.996.tar.gz
WORKDIR /lib/mecab-0.996
RUN ./configure --enable-utf8-only
RUN make
RUN make install

# Ipadic
WORKDIR /lib
RUN tar zxfv mecab-ipadic-2.7.0-20070801.tar.gz
WORKDIR /lib/mecab-ipadic-2.7.0-20070801
RUN ./configure --with-charset=utf8
RUN make
RUN make install
RUN echo "dicdir = /usr/local/lib/mecab/dic/ipadic" > /usr/local/etc/mecabrc

RUN mkdir -p /server
WORKDIR /server
COPY packages/server/package.json packages/server/package-lock.json ./
RUN apk add python
RUN npm i
COPY packages/server .
RUN npm run build
RUN npm prune --production
RUN apk del alpine-sdk python

EXPOSE 8080

CMD [ "npm", "start" ]
