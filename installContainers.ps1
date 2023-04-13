Get-ExecutionPolicy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned # or Unrestricted

$Downloads = $env:HOMEDRIVE + $env:HOMEPATH + "\Downloads\"
Set-Location $Downloads

# Get Powershell
$psURI = "https://github.com/PowerShell/PowerShell/releases/download/v7.3.3/"
$psOutfile = "PowerShell-7.3.3-win-x64.msi"
$uri = $psURI+$psOutfile
$installFile = $Downloads+$psOutfile
# download Powershell
Invoke-WebRequest -Uri $uri -OutFile $installFile
# install Powershell
Invoke-Expression -Command $installFile

# Get VS Code
$psURI = "https://code.visualstudio.com/docs/?dv=win"
$psOutfile = "VSCodeUserSetup-x64.exe"
$uri = $psURI+$psOutfile
$installFile = $Downloads+$psOutfile
# download VS Code
Invoke-WebRequest -Uri $uri -OutFile $installFile
# install VS Code
Invoke-Expression -Command $installFile

# 1. Get Docker Desktop
$psURI = "https://www.docker.com/products/docker-desktop/"
$psOutfile = "Docker Desktop Installer.exe"
$uri = $psURI+$psOutfile
$installFile = $Downloads+$psOutfile
# download
Invoke-WebRequest -Uri $uri -OutFile $installFile
# install:
Invoke-Expression -Command $installFile

# 2. Clone Git Repo
$repoPath = "https://github.com/gs1/"
$repoName = "GS1_DigitalLink_Resolver_CE"
$repoUri = $repoPath+$repoNam+".git"
$repoRoot = $env:HOMEDRIVE + $env:HOMEPATH + "\source\"

# 3. change directory to the one at the 'root' of this repository,
if(Test-Path -Path $repoRoot){ 
    Write-Output "$repoRoot exists"  
}else {
    New-Item -Path $repoRoot
}
Set-Location $repoRoot
git clone $repoUri $repoName
Set-Location $repoName

Get-ChildItem docker-compose.yml
docker-compose config

# type this command, If you're not seeing any errors then we're good to go.
docker info

# 4. Make sure you have a good internet connection, and then type this command:
docker-compose build

# 5. Before you do, make sure you have no SQL Server service, MongoDB service or port 80 web server running on your computer as they will clash with Docker as it tries to start the service up."
docker-compose up -d

# 6. Now wait 10 seconds while the system settles down (the SQL Server service takes a few seconds to initialise when 'new') then copy and paste this command (ensuring it is on one terminal line), which will run a program inside the SQL Server container, creating the database and some example data.
docker exec -it resolver-sql-server bash
# to enter the container and get a terminal prompt

# then run this command:
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P its@SECR3T! -i /gs1resolver_sql_scripts/sqldb_create_script.sql
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P its@SECR3T! -i /resolver_sql_server/sqldb_create_script.sql
#                                                                   \resolver_sql_server\sqldb_create_script.sql
# 7. Head to 
http://localhost/ui 
# and select the Download page.
# In the authorization key box, type: "12345" and click the Download button. Save the file to your local computer.

# 8. Click the link to go back to the home page, then choose the Upload page.

# 9. Type in your authorization key (12345), then choose the file you just downloaded. The Upload page detects 'Download' -format file and will set all the columns correctly for you. Have look at the example data in each column and what it means (see next section for details of the file columns). 

# 10. Click 'Check file' followed by 'Upload file' and the file should be uploaded with no errors. Completing these steps means that your installation of Resolver has been successful.

# 11. By now the local Mongo database should be built (a build event occurs every one minute) so try out this request in a terminal window:
curl -I http://localhost/gtin/09506000134376?serialnumber=12345
# which should result in this appearing in your terminal window:

# HTTP/1.1 307 Temporary Redirect
# Server: nginx/1.19.0
# Date: Mon, 09 Nov 2020 17:39:55 GMT
# Connection: keep-alive
# Vary: Accept-Encoding
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: HEAD, GET, OPTIONS
# Access-Control-Expose-Headers: Link, Content-Length
# Cache-Control: max-age=0, no-cache, no-store, must-revalidate
# X-Resolver-ProcessTimeMS: 9
# Link: <https://dalgiardino.com/medicinal-compound/pil.html>; rel="gs1:epil"; type="text/html"; hreflang="en"; title="Product Information Page", <https://dalgiardino.com/medicinal-compound/>; rel="gs1:pip"; type="text/html"; hreflang="en"; title="Product Information Page", <https://dalgiardino.com/medicinalcompound/index.html.ja>; rel="gs1:pip"; type="text/html"; hreflang="ja"; title="Product Information Page", <https://id.gs1.org/01/09506000134376>; rel="owl:sameAs" Location: https://dalgiardino.com/medicinal-compound/?serialnumber=12345

# This demonstrates that Resolver has found an entry for GTIN 09506000134376 and is redirecting you to the web site shown in the 'Location' header. Can also see this in action if you use the same web address - you should end up at our fictional brand site!

# 12. Shutting down the service To close the entire application down type this:
docker-compose down

# Since the data is stored on Docker volumes, the data will survive the shutdown and be available when you 'up' the service again.

# If you wish to delete the volumes and thus wipe the data, type these commands:
docker volume rm gs1_digitallink_resolver_ce_resolver-document-volume
docker volume rm gs1_digitallink_resolver_ce_resolver-sql-server-dbbackupvolume
docker volume rm gs1_digitallink_resolver_ce_resolver-sql-server-volume-dbdata
docker volume rm gs1_digitallink_resolver_ce_resolver-sql-server-volume-dblog
docker volume rm s1_digitallink_resolver_k8s_resolver-document-volume

# If the above volume are the only ones in your Docker Engine then it's quicker to type:
docker volume ls

# to confirm, then to delete all the volumes type:
docker volume prune