const { ServiceBusClient } = require("@azure/service-bus");
const logger = require("../logger");

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
const queueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME || "email-queue";
const maxConcurrentCalls = parseInt(
  process.env.AZURE_SERVICE_BUS_MAX_CONCURRENT_CALLS || "1",
  10
);

// 100 emails/hr = 1 email per 36 seconds
const EMAIL_RATE_LIMIT_MS = parseInt(
  process.env.AZURE_SERVICE_BUS_RATE_LIMIT_MS || "36000",
  10
);

let client = null;

const getClient = () => {
  if (!connectionString) return null;
  if (!client) {
    client = new ServiceBusClient(connectionString);
  }
  return client;
};

const enqueueEmailTask = async (task) => {
  if (!connectionString) {
    throw new Error("AZURE_SERVICE_BUS_CONNECTION_STRING is not set");
  }
  if (!queueName) {
    throw new Error("AZURE_SERVICE_BUS_QUEUE_NAME is not set");
  }

  const sbClient = getClient();
  const sender = sbClient.createSender(queueName);
  const messageId = task && task.messageId
    ? String(task.messageId)
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    await sender.sendMessages({
      body: task,
      contentType: "application/json",
      messageId,
      subject: task && task.type ? String(task.type) : "email",
      applicationProperties: {
        kind: "email"
      }
    });
  } finally {
    await sender.close();
  }
};

const startEmailQueueProcessor = async ({ onMessage, onError } = {}) => {
  if (!connectionString) {
    logger.warn("Service Bus connection string missing; email queue disabled.");
    return null;
  }

  const sbClient = getClient();
  const receiver = sbClient.createReceiver(queueName, {
    receiveMode: "peekLock"
  });

  receiver.subscribe(
    {
      processMessage: async (message) => {
        // Renew peekLock every 30s — Azure Email send (pollUntilDone) can take 10-90s,
        // which exceeds the 60s default lock timeout and causes redelivery + duplicate emails.
        // Confirmed by test run: serial0@test.com took 64s to complete.
        const lockRenewal = setInterval(async () => {
          try {
            await receiver.renewMessageLock(message);
            logger.info("Message lock renewed successfully.");
          } catch (renewErr) {
            logger.warn("Message lock renewal failed (message may have been completed already):", renewErr.message);
          }
        }, 30_000);

        try {
          if (typeof onMessage !== "function") {
            logger.warn("Email queue processor started without onMessage handler.");
            clearInterval(lockRenewal);
            await receiver.completeMessage(message);
            return;
          }

          await onMessage(message.body || {}, message);
          clearInterval(lockRenewal);
          await receiver.completeMessage(message);

          // Rate limit: respect Azure's 100 emails/hr cap
          logger.info(`Email sent. Waiting ${EMAIL_RATE_LIMIT_MS}ms before next message.`);
          await new Promise((res) => setTimeout(res, EMAIL_RATE_LIMIT_MS));
        } catch (err) {
          clearInterval(lockRenewal);
          logger.error("Email queue message handling failed:", err);
          try {
            await receiver.abandonMessage(message);
          } catch (abandonErr) {
            logger.error("Failed to abandon email message:", abandonErr);
          }
        }
      },
      processError: async (args) => {
        logger.error("Email queue processor error:", args.error || args);
        if (typeof onError === "function") {
          await onError(args);
        }
      }
    },
    {
      autoCompleteMessages: false,
      maxConcurrentCalls
    }
  );

  logger.info(
    `Email queue processor started (queue=${queueName}, concurrency=${maxConcurrentCalls}).`
  );

  return { client: sbClient, receiver };
};

const closeEmailQueueProcessor = async (processor) => {
  if (!processor) return;
  const { receiver, client: sbClient } = processor;
  if (receiver) {
    await receiver.close();
  }
  if (sbClient) {
    await sbClient.close();
  }
};

module.exports = {
  enqueueEmailTask,
  startEmailQueueProcessor,
  closeEmailQueueProcessor
};
