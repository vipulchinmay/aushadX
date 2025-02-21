const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 6001; // Choose a different port than your React Native app

app.use(cors());
app.use(bodyParser.json());

// Mock Contacts Data (Replace with a database connection in a real application)
const contacts = [
  { id: "1", name: "Shailesh", phoneNumber: "+917893262555" },
  { id: "2", name: "Bob Smith", phoneNumber: "+15559876543" },
  { id: "3", name: "Charlie Brown", phoneNumber: "+15552468013" },
];

// GET /contacts - Retrieve a list of contacts
app.get("/contacts", (req, res) => {
  res.json(contacts);
});

// POST /messages - Simulate sending a message (In a real app, integrate with a messaging service)
app.post("/messages", (req, res) => {
  const { recipientPhoneNumber, message } = req.body;

  // In a real application, you would integrate with a messaging service (e.g., Twilio, Firebase Cloud Messaging)
  // to actually send the message to the recipientPhoneNumber.

  console.log(
    `Simulating sending message to ${recipientPhoneNumber}: ${message}`
  );

  res.status(200).json({ success: true, message: "Message sent successfully (simulated)" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
