FROM node:16.16-alpine
LABEL org.beckett.image.authors="yifan@beckett.com"

# setup code and node modules
COPY marketplace /opt/marketplace
WORKDIR /opt/marketplace
RUN npm ci

# marketplace API port
EXPOSE 3300
EXPOSE 4300
EXPOSE 5300

# start the marketplace API server in development mode
WORKDIR /opt/marketplace
ENTRYPOINT ["npm", "run", "start"]