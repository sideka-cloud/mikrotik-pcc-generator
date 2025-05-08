# Use official Node.js image based on alpine
FROM node:22-alpine

# Maintainer
#MAINTAINER sys-ops.id

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package.json ./

# Install dependencies (this will read package.json and install missing packages)
RUN npm install

# Copy the rest of the application into the container
COPY . .

# Expose port for the app to run
EXPOSE 3030

# Start the application
CMD ["npm", "start"]
