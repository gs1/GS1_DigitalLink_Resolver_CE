# This Dockerfile will build a Microsoft SQL Server Express edition container and copy across the SQL script
# which you will run inside the container once it is up and running.
# ONLY USE THIS CONTAINER FOR EXPERIMENTATION - Use proper cloud or on-premises-based databases in production
FROM mcr.microsoft.com/mssql/server:2017-latest

ENV DEBIAN_FRONTEND=noninteractive
ENV ACCEPT_EULA=Y

# Set the TZDATA value to the continent/city matching your own timezone
ENV TZ=Europe/London

# This password is used by the dataentry_web_server to login to the database as 'sa'.
ENV MSSQL_SA_PASSWORD=its@SECR3T!

# We are using Express edition. If you have a licence then you can change to other allowed editions
# See: https://hub.docker.com/_/microsoft-mssql-server
ENV MSSQL_PID=Express

# This is the sys.language from Transact-SQL - 1033 is English. You may wish to alter this.
# More here: https://docs.microsoft.com/en-us/sql/relational-databases/system-compatibility-views/sys-syslanguages-transact-sql?view=sql-server-2017
ENV MSSQL_LCID=1033

# If you have lots of memory in host environment running this container, this can go higher. Lower memory limits can place limits on the SQL Server's in-memory sorting
# capabilities and thus slow it down. However, if you are not processing big data changes updates through the servefr then this is fine. The stored procedures used by
# tha data entry API data_gs1_org have been designed to minimise processing load as much as possible.
ENV MSSQL_MEMORY_LIMIT_MB=1024

# Enabling MSSQL Agent will allow scheduled tasks to be conducted such as performing regukar backups (Not imeplmented yet in this project yet)
# More at: https://docs.microsoft.com/en-us/sql/linux/sql-server-linux-run-sql-server-agent-job?view=sql-server-2017
ENV MSSQL_AGENT_ENABLED=true

# Copy the scripts and convert them to unix format
RUN apt-get update -y && apt-get dist-upgrade -y && apt-get install -y dos2unix
COPY sqldb_create_script.sql /gs1resolver_sql_scripts/sqldb_create_script.sql

# Convert any Windows formatted text files to unix format.
RUN find  /gs1resolver_data/setup/* -type f -print0 | xargs -0 dos2unix