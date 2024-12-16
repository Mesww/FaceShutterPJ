# Use Alpine as the base image
FROM alpine:latest

# Install SQLite
RUN apk add --no-cache sqlite

# Set working directory
WORKDIR /data

# Command to start SQLite shell
CMD ["sqlite3"]