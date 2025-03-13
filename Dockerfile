# Use an official Node.js runtime as a parent image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set the PORT environment variable (Cloud Run passes it automatically)
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the server
CMD [ "node", "server.js" ]
