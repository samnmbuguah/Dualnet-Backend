// jobs/generatePdfCronJob.js
const cron = require("node-cron");
const { generatePdfsForUsertype4Users } = require("../controllers/Users"); // Update the path accordingly

let runCount = 0;
const generatePdfCronJob = () => {
  console.log("Generating");

  // Schedule the function to run every day at 12:00 pm
  cron.schedule("0 37 16 * * *", async () => {
    runCount++; // Increment the counter
    console.log(
      `Running generatePdfsForUsertype4Users every day at 12:30 pm. Run count: ${runCount}`
    );

    try {
      // Call your function here
      await generatePdfsForUsertype4Users();
    } catch (error) {
      console.error("Error during scheduled task:", error);
    }
  });
};

module.exports = generatePdfCronJob;
