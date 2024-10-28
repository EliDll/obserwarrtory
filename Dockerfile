#Start from NodeJS
FROM node:latest
# ENV NODE_ENV=production
WORKDIR /app

# Add PATH var by installing globally
ENV PATH /backend/node_modules/.bin:$PATH

#Include the shared interface to Obserwarrtory
COPY ./obserwarrtory/src/app/Specfiles ./obserwarrtory/src/app/Specfiles

#Include all target files
COPY ./backend ./backend

#Run from backend subdir
WORKDIR /app/backend

# Not production build for now
RUN npm install

CMD npm run start
