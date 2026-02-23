# Start with the official Python base image
FROM python:3.11-slim

# Set environment variables to avoid prompts during install
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js (LTS) and dependencies
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY . ./app

# Install dependencies
RUN npm install --prefix app

# Install dependencies
RUN pip install -r app/server/requirements.txt

WORKDIR ./app
# Start the application
CMD sh -c "python server/main.py & npm run dev --workspace=demo"
