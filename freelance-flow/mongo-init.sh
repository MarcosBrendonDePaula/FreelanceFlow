#!/bin/bash
# Wait for MongoDB to start
sleep 10

# Initialize replica set
echo "Initializing MongoDB replica set..."
mongosh --host mongo:27017 --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'mongo:27017'}]})"

echo "MongoDB replica set initialized successfully!"
