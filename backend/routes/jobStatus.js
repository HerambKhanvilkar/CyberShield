const express = require('express');
const router = express.Router();
const JobResult = require('../models/JobResult');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticateJWT } = require('../middleware/auth');
const agenda = require('../worker.js'); // path to your agenda initialization module

const getUsername = async (authHeader) => {
  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findOne({
    _id: decoded.id,
  });

  if (!user) {
    return null;
  }
  return user.email;
}

router.put("/job-status/:jobId", authenticateJWT, async (req, res) => {
  try {
    const  { revision }  = req.body;
    const { jobId } = req.params;
  
    // Validate that revision data exists in request body.
    if (!revision) {
      return res.status(400).json({ message: "Revision data is required." });
    }

    const authHeader = req.headers.authorization;
    const userMail = await getUsername(authHeader);
    const userId = (await User.findOne({ email: userMail })).email;
    // Ensure the authenticated user is allowed to see this result
    const jobStatusDoc = await JobResult.findOne({ jobId, userId});
    if (!jobStatusDoc) {
      return res.status(404).json({ message: "Job not found." });
    }
    if (jobStatusDoc.status !== 'completed') {
      return res.status(404).json({ message: "Job not found." });
    }
    // Update the jobStatus document with the new revision data.
    // Optionally, you might want to re-run some validations or merge the revisions.
    jobStatusDoc.revision = revision;
    jobStatusDoc.updatedAt = new Date();
    jobStatusDoc.revisionStatus = "pending"

    await jobStatusDoc.save()

    console.log("jobId, revision, userId");
    console.log(jobId, revision, userId);

    await agenda.now('reprocess revision', { jobId, revision, userId });

    return res.status(200).json({
      message: "Revision data updated successfully.",
      jobStatus: jobStatusDoc
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/job-status/:jobId", authenticateJWT, async (req, res) => {
  try {
    const { jobId } = req.params;
    const authHeader = req.headers.authorization;
    const userMail = await getUsername(authHeader);
    const userId = (await User.findOne({ email: userMail })).email;
    // Ensure the authenticated user is allowed to see this result
    const jobStatus = await JobResult.findOne({ jobId, userId});
    if (!jobStatus) {
      return res.status(404).json({ message: "Job not found." });
    }
    return res.status(200).json({
      jobId,
      status: jobStatus.status,
      result: jobStatus.result,  // will be null if job still pending or processing
      revision: jobStatus.revision,  // will be null if job still pending or processing
      revisionStatus: jobStatus.revisionStatus,
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
