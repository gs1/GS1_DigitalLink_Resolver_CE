/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P feorfhgofgq348ryfwfAHGAU -Q "EXEC sp_configure 'contained', 1; RECONFIGURE"
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P feorfhgofgq348ryfwfAHGAU -Q "RESTORE DATABASE [gs1resolverdb] FROM DISK='/dbbackup/gs1resolverdb.bak' WITH NORECOVERY, REPLACE"
