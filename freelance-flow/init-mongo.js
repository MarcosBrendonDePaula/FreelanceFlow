// This script initializes the MongoDB replica set
try {
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "mongo:27017" }
    ]
  });
  
  print("MongoDB replica set initialized successfully!");
} catch (e) {
  print("Error initializing replica set: " + e);
}
