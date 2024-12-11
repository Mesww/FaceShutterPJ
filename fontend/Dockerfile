FROM node:21.1.0 as build

WORKDIR /app/font
COPY package.json .

RUN yarn install
COPY . .


RUN yarn build

# Use an official Nginx runtime as a parent image
FROM nginx:alpine

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the build stage to the nginx web server directory
COPY --from=build /app/font/dist /usr/share/nginx/html

# Expose port 3000 or by default port 80 to the outside world
EXPOSE 3000

# Start Nginx when the container is run
CMD ["nginx", "-g", "daemon off;"]