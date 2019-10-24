## Deploying to Kubernetes

This is an early attempt at running the GS1 DigitalLink Resolver Commnity Edition on a Kubernetes cluster. 
You are strongly advised to use caution at this time, as the 'YAML' configuration files are a work in progress
and may yet yield performance and security issues. Running these configuration files on a cloud provider's Kubernetes service
could have serious costs implications.

Proceed with care and caution, and in the knowlesge that you must be liable for your own actions! 



### Installation of the various services (current folder)
Executing the command below should build the complete service in Kubernetes:
<table border="1">
<tr><th>Container name</th><th>Instances running (replicas)</th></tr>
<tr><td>dataentry-web-server</td><td>2</td></tr>
<tr><td>id-web-server</td><td>4</td></tr>
<tr><td>gs1dl-toolkit-server</td><td>1</td></tr>
<tr><td>dataentry-sql-server</td><td>4</td></tr>
<tr><td>id-mongo-server</td><td>1</td></tr>
</table>

Make sure you have your terminal prompt <b>in the root folder</b> of this repository, and use this command to build everything:
<pre>docker-compose build</pre>
Now run this command to install the newly built images into Kubernetes
<pre>kubectl apply -f ./kubernetes</pre>

### The Kubernetes web dashboard

#### Installation of dashboard
Follow the instructions for installing the dashboard here

https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/

Connect to the dashboard with:
<pre>kubectl proxy</pre>
...then go to http://localhost:8001/ui

...to get the required Token to login:
<pre>kubectl describe secret</pre>

copy token (1025 chars) to dashboard UI token entry section on login screen.
