## 📢 Welcome to GS1 Resolver Community Edition Version 3.0 Beta 1

GS1 Resolver is a free and open-source software that allows you to resolve GS1 identifiers to their corresponding web resources. This software is developed by the GS1 Resolver Community and is based on the GS1 Digital Link standard.

### 🚀 What's new in this version?
1. Completely revised and simplified architecture for better performance and scalability.
2. Improved support for GS1 Digital Link and GS1 Web URI according to th standard published at https://ref.gs1.org/standards/resolver/

### 📚 Simplified Architecture
The new architecture is based on a microservices approach. In this solution the data entry service with its API can be separated from the Front-end resolving web service.
The main components, each architected as separate container images, are:
1. **Data Entry Service**: This service is responsible for storing and managing the GS1 identifiers and their corresponding web resources.
2. **Front-end Web Service**: This service is responsible for resolving GS1 identifiers to their corresponding web resources, and redirecting web clients as needed
3. **Single Document Database** : This database is used to store the GS1 identifiers and their corresponding web resources in an IETF LinkSet format.
4. **Frontend Proxy Server**: This server is responsible for routing the incoming requests to the appropriate service when used together in a Docker composition or Kubernetes cluster.

### 📦 Installation
The GS1 Resolver Community Edition is available as a Docker image. You can run the software using the following command:
```bash
docker compose up -d --build
```
This command will download the base container images from Docker Hub, build the necessary images, and start the services.

The service will then be available at http://localhost:8080.
