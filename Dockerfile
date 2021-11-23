FROM node:15

ADD public /app/public

ADD app.js /app/
ADD cheatsheet.js /app/
ADD database.js /app/
ADD designs.json /app/
ADD export2office.js /app/
ADD package.json /app/
ADD retrieve.js /app/
ADD updates.js /app/
ADD yarn.lock /app/

WORKDIR /app

RUN yarn

CMD [ "node", "app.js" ]