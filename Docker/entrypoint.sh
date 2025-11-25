#!/bin/bash

#first, we configure variables and paths used later
PG_VERSION="17" 
PG_BIN_PATH="/usr/lib/postgresql/${PG_VERSION}/bin"

PG_CTL="${PG_BIN_PATH}/pg_ctl"
INITDB="${PG_BIN_PATH}/initdb"
PG_ISREADY="${PG_BIN_PATH}/pg_isready"
PGDATA="/var/lib/postgresql/data" # this directory MUST be mapped into a VOLUME!!!

DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-mysecretpassword}"
PG_PORT="${PG_PORT:-5439}"


# we initialize the DB configrations
mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"

# we check if it has already been init
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "[entrypoint] Initializing database cluster with initdb..."
    
    # init with user 'postgres'
    su - postgres -c "$INITDB -D '$PGDATA' --username=$DB_USER --pwfile=<(echo $DB_PASS)"
fi


# we launch the DB

echo "[entrypoint] Starting Postgres on port ${PG_PORT}..."
su - postgres -c "$PG_CTL -D '$PGDATA' -o \"-c listen_addresses='0.0.0.0' -p ${PG_PORT}\" -w start"

# we wait postgres to be launched before launching server (that needs the DB up and running)
echo "[entrypoint] Waiting for Postgres to be ready..."

until $PG_ISREADY -h localhost -p ${PG_PORT} -U ${DB_USER} > /dev/null 2>&1; do
  echo "Postgres is unavailable - sleeping for 1 second..."
  sleep 1
done

echo "[entrypoint] Postgres is ready!"


# at the first launch, we populate the DB with basic datas

POPULATE_MARKER="${PGDATA}/.db_populated"

if [ ! -f "$POPULATE_MARKER" ]; then
    echo "[entrypoint] Database not yet populated. Running population script..."

    cd /app/server
    npm run populate-db
    
    if [ $? -eq 0 ]; then
        su - postgres -c "touch $POPULATE_MARKER"
        echo "[entrypoint] Database populated successfully. Marker created."
    else
        echo "[entrypoint] ERROR: Database population failed. Marker not created."
    fi
else
    echo "[entrypoint] Database already populated. Skipping population script."
fi


# here we run the actual application (ui and backend)

echo "[entrypoint] Starting Node server (server) and client (dev)..."

# run the server
cd /app/server
npm run dev & SERVER_PID=$!

# run the client
cd /app/client
npm run dev & CLIENT_PID=$!


# part to handle the termination of the processes
wait -n
echo "[entrypoint] One process exited, shutting down..."

# we kill the "other ones"
kill -TERM ${SERVER_PID} ${CLIENT_PID} 2>/dev/null || true

echo "[entrypoint] Stopping Postgres..."
su - postgres -c "$PG_CTL -D '$PGDATA' -w stop"

exit 0