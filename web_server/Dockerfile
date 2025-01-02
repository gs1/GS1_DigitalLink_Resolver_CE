FROM python:3.10-bullseye
LABEL authors="nick"

# The environment variable ensures that the python output is set straight
# to the terminal without buffering it first
ENV PYTHONUNBUFFERED 1

 # This Environment variable is used to set the fully qualified domain name (FQDN) of the host machine which will be
 # Used when outputing linkset information
 ENV FQDN='id.mydomainname_currently_set_in_dockerfile.com'

# Install Node for GS1 Digital Link Toolikit
RUN apt-get update && apt-get install -y curl && curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs nano
ADD src/gs1-digitallink-toolkit /app/gs1-digitallink-toolkit
WORKDIR /app/gs1-digitallink-toolkit
RUN npm init es6
RUN npm install --save gs1encoder

WORKDIR /app

# Add requirements.txt before rest of repo for caching
ADD src/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Add the current directory contents into the container at /app
ADD src /app/

EXPOSE 4000

CMD ["python", "-m", "main"]