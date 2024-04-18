const io = require("socket.io-client");

// Connect to the server
const socket = io.connect("http://localhost:3042");
let lastNonEmptyTopScansTimestamp = null;

socket.on("connect", () => {
  console.log("Connected to the server");
  socket.emit("join", 18);
  // Emit the 'updateScans' event every 30 seconds
//   setInterval(() => {
//     console.log("Sending updateScans event to the server");
//     socket.emit("updateScans");
//   }, 600000); // 30000 milliseconds = 30 seconds
});


// Listen for the 'topScans' event to receive the top scans from the server
socket.on("topScans", (data) => {
  if (data && data.length > 0) {
    const currentTimestamp = Date.now();
    if (lastNonEmptyTopScansTimestamp) {
      const timeDifference = (currentTimestamp - lastNonEmptyTopScansTimestamp)/60000;
      console.log(`Time since last non-empty topScans: ${timeDifference} seconds`);
    }
    lastNonEmptyTopScansTimestamp = currentTimestamp;
  }
  console.log("Received topScans from the server:", data[0]);
});

// Listen for the 'botData' event to receive the bot data from the server
socket.on("botData", (data) => {
  console.log("Received botData from the server:", data);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected from the server. Reason:", reason);
});

socket.on("error", (error) => {
  console.error("Received error from the server:", error);
});
