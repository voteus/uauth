FROM node:latest

RUN npm install pm2 -g

WORKDIR /opt/app

EXPOSE 3000 3030

CMD ["pm2-docker", "ecosystem.json"]
