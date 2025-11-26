# we use image with node environment in it
FROM node:22.21-trixie-slim

# we install postgresql
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y postgresql postgresql-contrib && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# CLIENT "setup" => we "move" our package and package-lock files into a 
# folder called "client" inside the "app" directory
COPY client/package*.json client/
WORKDIR /app/client
RUN npm ci
COPY client/ .
# here, the client "files" should be moved into the container in /app/client/

# SERVER "setup" => we "move" our package and package-lock files into a 
# folder called "server" inside the "app" directory
WORKDIR /app
COPY server/package*.json server/
WORKDIR /app/server
RUN npm ci 
COPY server/ .
# here, the server files should be correctly moved in the container in /app/server/

# we copy the entrypoint
WORKDIR /app
COPY Docker/entrypoint.sh /entrypoint.sh

# fix windows CRLF that cause "/bin/bash^M: bad interpreter" and ensure executable
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000 5173 5439

ENV DB_USER="postgres"
ENV DB_PASS="mysecretpassword"
ENV DB_NAME="postgres"
ENV PG_PORT=5439

CMD [ "/entrypoint.sh" ]