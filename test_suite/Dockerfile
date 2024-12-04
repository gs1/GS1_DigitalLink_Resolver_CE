# Use Python 3.10 as the base image
FROM python:3.10-bullseye

# Set the working directory in the container
WORKDIR /app

# Copy the requirements.txt into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python script into the container
COPY testHarness.py .

# Copy the 'public' folder and its contents
COPY public ./public

# Expose the Flask port 5000
EXPOSE 5000

# Set the default command to run the Flask application
CMD ["python", "testHarness.py"]