FROM node:18-alpine
WORKDIR /automate_marketing
COPY . .
RUN npm install
EXPOSE 9002
CMD ["npm", "start"]