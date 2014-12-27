# using debian over ubuntu (smaller file size, same benefits)
FROM debian:wheezy

# need to fine python software properties
RUN echo "deb ftp://ftp.debian.org/debian/ wheezy main" > /etc/apt/sources.list
RUN apt-get -y update

# add utils for adding custom PPAs via `apt`
RUN apt-get install --yes --force-yes python-software-properties

# install wget and clean out unnecessary files
RUN apt-get update && apt-get install --yes --force-yes bzip2 libfreetype6 libfontconfig pdftk ghostscript python g++ make wget curl pdftk ghostscript poppler-utils && rm -rf /var/lib/apt/lists/*

# node environment version constant
ENV NODE_VERSION 0.10.33

# download node
RUN curl -SLO "http://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz" \
    && tar -xzf "node-v$NODE_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
    && rm "node-v$NODE_VERSION-linux-x64.tar.gz"

# download phantom
RUN wget -q https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-linux-x86_64.tar.bz2
RUN tar xjf phantomjs-1.9.7-linux-x86_64.tar.bz2
RUN install -t /usr/local/bin phantomjs-1.9.7-linux-x86_64/bin/phantomjs
RUN rm -rf phantomjs-1.9.7-linux-x86_64
RUN rm phantomjs-1.9.7-linux-x86_64.tar.bz2

# sync codebase directory
ADD . /opt/src

# install NPM
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/src && cp -a /tmp/node_modules /opt/src/

WORKDIR /opt/src

# run!
CMD ["node", "src/main.js"]