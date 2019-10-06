FROM mcr.microsoft.com/mssql/server:2017-latest
ENV DEBIAN_FRONTEND=noninteractive
ENV ACCEPT_EULA=Y
ENV MSSQL_SA_PASSWORD=feorfhgofgq348ryfwfAHGAU
ENV MSSQL_PID=Express
ENV MSSQL_LCID=1033
ENV MSSQL_MEMORY_LIMIT_MB=1024
ENV MSSQL_BACKUP_DIR=/gs1resolver_data/backup
ENV MSSQL_DATA_DIR=/gs1resolver_data/data
ENV MSSQL_LOG_DIR=/gs1resolver_data/log
ENV MSSQL_DUMP_DIR=/gs1resolver_data/dump
ENV MSSQL_AGENT_ENABLED=true

COPY gs1resolver_dataentry_db_build_script.sql /gs1resolver_data/setup/gs1resolver_dataentry_db_build_script.sql

# Go into container and run: /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P feorfhgofgq348ryfwfAHGAU -i  /gs1resolver_data/setup/gs1resolver_dataentry_db_build_script.sql