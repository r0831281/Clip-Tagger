FROM node:23-alpine as build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production environment
FROM nginx:alpine

# Install wget for healthchecks
RUN apk add --no-cache wget

COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Add config to allow proper routing with React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
