## Useful Docker commands:
docker exec -it gs1resolver_dataentry_db  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P feorfhgofgq348ryfwfAHGAU

docker exec -it data_gs1_org tail -f -n50 /var/log/apache2/error.log

docker exec -it gs1resolver_document_db mongo -u gs1resolver -p gs1resolver

