# Dockerfile in nginx directory
FROM nginx:alpine

# Copy the custom nginx.conf to the container
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]