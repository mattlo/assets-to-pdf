# using debian over ubuntu (smaller file size, same benefits)
FROM debian:wheezy

# install wget and clean out unnecessary files
RUN apt-get update && apt-get install --yes --force-yes python-software-properties python g++ make wget curl pdftk ghostscript poppler-utils && rm -rf /var/lib/apt/lists/*

# node environment version constant
ENV NODE_VERSION 0.10.33

# download node
RUN curl -SLO "http://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz" \
    && tar -xzf "node-v$NODE_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
    && rm "node-v$NODE_VERSION-linux-x64.tar.gz"

# sync codebase directory
ADD . /opt/src

# install NPM
RUN cd /opt/src; npm install

# run!
CMD ["node", "/opt/src/main.js"]