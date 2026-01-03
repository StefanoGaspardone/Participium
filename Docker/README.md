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

> [!WARNING]
> The application will be actually working ONLY when the server has printed the line 
    
    [<date and hour>] INFO: [EMAIL SETUP] SMTP transporter for smtp.gmail.com is ready. Emails will be sent from: pparticipium@gmail.com

> you can check it by inspecting the logs of the server executing the command :

    docker logs -f participium_server

## Stop the application

If you want to stop the application, you have to execute the following commands in the `working` folder :

Linux/MacOS environments :

    docker compose -f ./docker-compose.prod.yaml --env-file ./prod.env down --volumes --remove-orphans

Windows environments :

    docker compose -f .\docker-compose.prod.yaml --env-file .\prod.env down --volumes --remove-orphans

## INFO

The application starts with 2 pre-defined users :
- An administrator with username `admin` and password `admin`
(the password is predefined and cannot be changed for now, to do so, please contact the development team)
- A citizen user with username `user` and password `user`

The administrator needs to exist i norder to create new municipality users (such as Technical Office Staff Members, External Mainatiners, Public Relations Officers etc...), the user is there just to give the possibility to go around the application as a normal citizen, so that the customer can see how the application works from a citizen point of view without the need to create a new user by himself.

The served `offices` are the following :
- `Organization`  
- `Public Services Division`
- `Environmental Quality Division`
- `Green Areas, Parks and Animal Welfare Division`
- `Infrastructure Division`
- `General Services Division`.

While the `categories` in which a report can be classified, together with the related `office`, are :  
- `Water Supply - Drinking Water`, office: `Public Services Division`
- `Architectural Barriers`, office: `Infrastructure Division`
- `Sewer System`, office: `Public Services Division`
- `Public Lighting`, office: `Public Services Division`
- `Waste`, office: `Environmental Quality Division`
- `Road Signs and Traffic Lights`, office: `Infrastructure Division`
- `Roads and Urban Furnishings`, office: `Infrastructure Division`
- `Public Green Areas and Playgrounds`, office: `Green Areas, Parks and Animal Welfare Division`
- `Other`, office: `General Services Division`  

