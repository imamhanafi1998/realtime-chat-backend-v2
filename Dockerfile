FROM node:lts-alpine
ENV NODE_ENV=production
# WORKDIR /usr/src/app
WORKDIR /opt/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 3031
RUN chown -R node /opt/app
USER node
# CMD ["npm", "start"]
CMD ["node", "src/api"]
