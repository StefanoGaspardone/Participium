## Create the `working` folder

First of all, you have to create a new folder, in which the actions to build the application will be executed

## Move the `docker-compose.prod.yaml` and `prod.env` into `working`folder

You now have to insert the file provided to you (`docker-compose.prod.yaml` and `prod.env`) inside the `working` folder previously created

> [!WARNING]
> The `prod.env` has to be kept and exchanged in a secure way because it contains sensitive information (e.g., passwords, secret keys, etc.)

## Execute the application

Now that everything you need is in the right place, you have to execute the following commands INSIDE of the `working` folder :

Linux/MacOS environments :

    docker compose -f ./docker-compose.prod.yaml --env-file ./prod.env up -d

Windows environments :

    docker compose -f .\docker-compose.prod.yaml --env-file .\prod.env up -d

## Stop the application

If you want to stop the application, you have to execute the following commands in the `working` folder :

Linux/MacOS environments :

    docker compose -f ./docker-compose.prod.yaml --env-file ./prod.env down --volumes --remove-orphans

Windows environments :

    docker compose -f .\docker-compose.prod.yaml --env-file .\prod.env down --volumes --remove-orphans
