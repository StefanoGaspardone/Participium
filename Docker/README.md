# Create the Persistent VOLUME
 to do so, you have to create a docker volume, mapped to a directory to "save" datas across the runs, running the command:
 > docker volume create pg_participium_volume
 
 this volume will be mapped to the "folder" used by postgres to save the datas

# Download the IMAGE
once the volume to save datas is created, we have to pull the image from Docker Hub :
> \*\*\*\*\*\*\*\*COMMAND\*\*\*\*\*\*\*\*

# Run the CONTAINER
once the image has been downloaded, we just have to run :
> docker run <--name participium-app> -p 3000:3000 -p 5173:5173 -v pg_participium_volume:/var/lib/postgresql/data participium-group5

<--name participium-app> is optional, if used, it enables you to interact with the container using that name