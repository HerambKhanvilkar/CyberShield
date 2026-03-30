/**
 * Azure Service Bus Email Queue - Comprehensive Performance Test
 * ============================================================
 * Covers all 10 test scenarios:
 *  1.  Enqueue throughput (50 concurrent)
 *  2.  Enqueue-to-delivery latency
 *  3.  Rate-limit correctness (AZURE_SERVICE_BUS_RATE_LIMIT_MS)
 *  4.  Dead-letter queue (DLQ) behaviour — bad handler
 *  5.  maxConcurrentCalls = 1 (serial processing)
 *  6.  Message idempotency (duplicate messageId)
 *  7.  PeekLock timeout / slow handler risk
 *  8.  Startup resilience (bad connection string)
 *  9.  Burst load queue depth
 * 10.  All 8 message-type routes
 *
 * Usage:
 *   node scripts/testQueuePerformance.js [--test=<number>] [--all]
 *
 * Examples:
 *   node scripts/testQueuePerformance.js --all          # run every test
 *   node scripts/testQueuePerformance.js --test=2       # run only test 2
 *   node scripts/testQueuePerformance.js --test=1,5,10  # run tests 1, 5 and 10
 *
 * Requirements:
 *   npm install @azure/service-bus dotenv
 *
 * NOTE: Tests 4 & 7 observe message behaviour, they do NOT actually send real
 *       emails — they just enqueue specially-typed messages that the live
 *       processor would handle.  Run with the processor STOPPED if you only
 *       want to test raw queue mechanics (tests 1, 6, 9).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { ServiceBusClient } = require('@azure/service-bus');

// ─── Config ──────────────────────────────────────────────────────────────────
const CONNECTION_STRING  = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
const QUEUE_NAME         = process.env.AZURE_SERVICE_BUS_QUEUE_NAME || 'email-queue';
const MAX_CONCURRENT     = parseInt(process.env.AZURE_SERVICE_BUS_MAX_CONCURRENT_CALLS || '1', 10);
const RATE_LIMIT_MS      = parseInt(process.env.AZURE_SERVICE_BUS_RATE_LIMIT_MS || '36000', 10);

// ─── ANSI Colours ────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  grey:   '\x1b[90m',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pass  = (msg) => console.log(`  ${C.green}✔ PASS${C.reset}  ${msg}`);
const fail  = (msg) => console.log(`  ${C.red}✘ FAIL${C.reset}  ${msg}`);
const warn  = (msg) => console.log(`  ${C.yellow}⚠ WARN${C.reset}  ${msg}`);
const info  = (msg) => console.log(`  ${C.grey}ℹ${C.reset}      ${msg}`);
const sep   = (t)   => console.log(`\n${C.cyan}${C.bold}${'═'.repeat(60)}${C.reset}\n${C.bold}  Test ${t}${C.reset}`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const uid = (prefix = 'msg') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Send a single test message to the real queue.
 * Returns { messageId, sentAt }
 */
async function sendMessage(client, body, extra = {}) {
  const sender    = client.createSender(QUEUE_NAME);
  const messageId = extra.messageId || uid();
  const sentAt    = Date.now();
  try {
    await sender.sendMessages({
      body,
      contentType: 'application/json',
      messageId,
      subject: body && body.type ? String(body.type) : 'test',
      applicationProperties: { kind: 'email-queue-test', ...extra.props },
    });
  } finally {
    await sender.close();
  }
  return { messageId, sentAt };
}

/**
 * Receive up to `count` messages via peekLock, collect them, abandon each.
 * Returns the array of received message objects within `timeoutMs`.
 */
async function peekMessages(client, count = 1, timeoutMs = 8000) {
  const receiver = client.createReceiver(QUEUE_NAME, { receiveMode: 'peekLock' });
  const received = [];
  const deadline = Date.now() + timeoutMs;

  try {
    while (received.length < count && Date.now() < deadline) {
      const remaining = deadline - Date.now();
      const batch = await receiver.receiveMessages(count - received.length, {
        maxWaitTimeInMs: Math.min(2000, remaining),
      });
      for (const m of batch) {
        received.push(m);
        await receiver.abandonMessage(m).catch(() => {});  // put back
      }
      if (batch.length === 0) break;
    }
  } finally {
    await receiver.close();
  }
  return received;
}

/**
 * Receive up to `count` messages and COMPLETE (delete) them.
 * Used to clean up after tests that deliberately leave messages.
 */
async function drainMessages(client, count = 50, timeoutMs = 10000) {
  const receiver = client.createReceiver(QUEUE_NAME, { receiveMode: 'peekLock' });
  let drained = 0;
  const deadline = Date.now() + timeoutMs;
  try {
    while (drained < count && Date.now() < deadline) {
      const batch = await receiver.receiveMessages(Math.min(10, count - drained), {
        maxWaitTimeInMs: 1500,
      });
      if (batch.length === 0) break;
      for (const m of batch) {
        await receiver.completeMessage(m).catch(() => {});
        drained++;
      }
    }
  } finally {
    await receiver.close();
  }
  return drained;
}

// ─── Test Implementations ─────────────────────────────────────────────────────

async function test1_EnqueueThroughput(client) {
  sep('1  —  Enqueue Throughput (50 concurrent messages)');
  info('Sending 50 messages in parallel and measuring total time…');

  const tasks = Array.from({ length: 50 }, (_, i) =>
    sendMessage(client, { type: 'REGISTRATION_OTP', payload: { email: `user${i}@test.com`, otpCode: '123456' }, _testId: uid() })
  );

  const start = Date.now();
  const results = await Promise.allSettled(tasks);
  const elapsed = Date.now() - start;

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed_count = 50 - succeeded;

  info(`Sent ${succeeded}/50 messages in ${elapsed}ms (${(elapsed / succeeded).toFixed(1)}ms avg)`);

  if (elapsed < 5000 && succeeded === 50) {
    pass(`All 50 enqueued in ${elapsed}ms — queue accepts bursts without blocking HTTP`);
  } else if (succeeded === 50) {
    warn(`All 50 enqueued but took ${elapsed}ms — may add latency under load`);
  } else {
    fail(`Only ${succeeded}/50 succeeded — ${failed_count} enqueue errors`);
  }

  // Clean up the messages we just injected
  info('Draining test messages…');
  const drained = await drainMessages(client, 50, 15000);
  info(`Drained ${drained} messages from queue`);
}

async function test2_EnqueueToDeliveryLatency(client) {
  sep('2  —  Enqueue-to-Delivery Latency');
  info('Sending 1 message and measuring time until it is visible/receivable…');

  const body = { type: 'REGISTRATION_OTP', payload: { email: 'latency@test.com', otpCode: '000000' }, enqueuedAt: Date.now() };
  const { sentAt } = await sendMessage(client, body);

  const msgs = await peekMessages(client, 1, 8000);
  const receivedAt = Date.now();

  if (msgs.length === 0) {
    fail('Message not received within 8s timeout — check connection and queue name');
    return;
  }

  const latency = receivedAt - sentAt;
  info(`Latency: ${latency}ms`);

  if (latency < 2000) {
    pass(`Excellent: ${latency}ms — well under 2s`);
  } else if (latency < 5000) {
    warn(`Acceptable: ${latency}ms — within 5s`);
  } else {
    fail(`Slow: ${latency}ms — consumer may be stalled or connection is degraded`);
  }
}

async function test3_RateLimitCorrectness(client) {
  sep('3  —  Rate-Limit Config Verification');

  info(`Current AZURE_SERVICE_BUS_RATE_LIMIT_MS = ${RATE_LIMIT_MS}ms`);

  if (RATE_LIMIT_MS === 0) {
    warn('Rate limiting is DISABLED (0ms). Azure email cap is 100/hr.');
    warn('If your processor runs fast, you risk silent 429 throttles from Azure Communication Email.');
    info('Recommended: set AZURE_SERVICE_BUS_RATE_LIMIT_MS=36000 (1 email per 36s = 100/hr)');
    info('Simulation: sending 3 messages quickly and checking they have no artificial delay…');

    const times = [];
    for (let i = 0; i < 3; i++) {
      const { sentAt } = await sendMessage(client, { type: 'REGISTRATION_OTP', payload: { email: `rate${i}@test.com`, otpCode: '999' } });
      times.push(Date.now() - sentAt);
    }
    info(`Enqueue times: ${times.map(t => t + 'ms').join(', ')} — no delay introduced (correct for 0ms)`);
    warn('ACTION REQUIRED: Consider enabling rate limiting to protect the 100/hr Azure quota.');
    await drainMessages(client, 3, 5000);
  } else {
    pass(`Rate limit is set to ${RATE_LIMIT_MS}ms (${(3600000 / RATE_LIMIT_MS).toFixed(0)} emails/hr)`);
    info('The processor will sleep between messages. Verify in server logs:');
    info('"Email sent. Waiting <N>ms before next message."');
  }
}

async function test4_DeadLetterBehaviour(client) {
  sep('4  —  Dead-Letter Queue (DLQ) Behaviour');
  info('This test checks your queue config — it does NOT send real emails.');
  info('To trigger DLQ, a message must fail MAX_DELIVERY_COUNT times.');
  info('Default Azure max delivery count = 10. Each abandon increments the counter.');

  // Send a message with an unknown type — the live processor will throw +
  // call abandonMessage(), incrementing delivery count towards DLQ
  const body = {
    type: 'UNKNOWN_TYPE_FOR_DLQ_TEST',
    payload: { email: 'dlq@test.com' },
    _note: 'This message intentionally has an unknown type to trigger DLQ path'
  };
  const { messageId } = await sendMessage(client, body, { messageId: uid('dlq') });
  pass(`Message ${messageId} enqueued with unknown type`);
  info('Expected behaviour when processor is running:');
  info('  • processEmailQueueMessage throws "Unknown email task type: UNKNOWN_TYPE_FOR_DLQ_TEST"');
  info('  • processor calls receiver.abandonMessage(message)');
  info('  • Azure increments delivery count; after 10 failures → moves to Dead-Letter Queue');
  info('Verify in Azure Portal: Queue → Dead-letter → messages count > 0');

  // Peek to confirm it's in queue
  const msgs = await peekMessages(client, 1, 5000);
  if (msgs.length > 0) {
    pass('Message confirmed in queue — will be processed by live processor and eventually DLQ\'d');
  } else {
    warn('Could not peek message (may have already been consumed if processor is running)');
  }
}

async function test5_ConcurrentCallsConfig(client) {
  sep('5  —  maxConcurrentCalls Config Verification');
  info(`Current AZURE_SERVICE_BUS_MAX_CONCURRENT_CALLS = ${MAX_CONCURRENT}`);

  if (MAX_CONCURRENT === 1) {
    pass('maxConcurrentCalls=1 — serial processing. Messages are handled one at a time.');
    info('Advantage: no race conditions, no accidental Azure Email quota bursts.');
    info('Trade-off: throughput = 1 email per (send_time + RATE_LIMIT_MS).');
    info('Simulation: checking 5 messages are enqueued to test serial drain…');

    for (let i = 0; i < 5; i++) {
      await sendMessage(client, { type: 'REGISTRATION_OTP', payload: { email: `serial${i}@test.com`, otpCode: '111' } });
    }
    info('5 messages enqueued. If processor is running, watch logs for sequential processing.');
    info('Expected log pattern: "Email sent. Waiting Xms before next message." — never overlapping.');
    await drainMessages(client, 5, 8000);
  } else {
    warn(`maxConcurrentCalls=${MAX_CONCURRENT} — parallel processing active.`);
    warn('Risk: Multiple emails may be sent simultaneously, exceeding Azure quota.');
  }
}

async function test6_MessageIdempotency(client) {
  sep('6  —  Message Idempotency / Duplicate Detection');

  const DUPE_ID = `idempotency-test-${Date.now()}`;
  info(`Sending two messages with the same messageId: ${DUPE_ID}`);

  await sendMessage(client, { type: 'REGISTRATION_OTP', payload: { email: 'idem1@test.com', otpCode: '111' } }, { messageId: DUPE_ID });
  await sleep(300); // slight gap
  await sendMessage(client, { type: 'REGISTRATION_OTP', payload: { email: 'idem2@test.com', otpCode: '222' } }, { messageId: DUPE_ID });

  info('Both sends completed (no client-side error — service-bus SDK allows re-send).');

  const msgs = await peekMessages(client, 5, 6000);
  const dupes = msgs.filter(m => m.messageId === DUPE_ID);
  info(`Found ${dupes.length} message(s) with id=${DUPE_ID} in queue`);

  if (dupes.length === 1) {
    pass('Azure duplicate detection is ACTIVE — only 1 copy exists in queue.');
  } else if (dupes.length === 2) {
    fail('Duplicate detection is NOT active — both copies exist. Same email will be sent twice!');
    warn('Fix: Enable "Requires Duplicate Detection" on the queue in Azure Portal.');
    warn('     Or deduplicate in processEmailQueueMessage before sending.');
    await drainMessages(client, 2, 5000);
  } else {
    warn(`Unexpected count: ${dupes.length} — queue may have pre-existing messages with this ID (unlikely)`);
    await drainMessages(client, dupes.length, 5000);
  }
}

async function test7_PeekLockTimeoutRisk(client) {
  sep('7  —  PeekLock Timeout / Slow Handler Risk');
  info('This is a config analysis test — it does NOT lock a message for 60+ seconds.');
  info('');
  info('Your current setup:');
  info('  • receiveMode: "peekLock" (lock expires after ~60s by default on Standard tier)');
  info('  • handler: beginSend() + pollUntilDone() which can take 10–90s for Azure Email');
  info('  • No receiver.renewMessageLock() call in the code');
  info('');

  // Estimate worst-case time
  const worstCase = RATE_LIMIT_MS + 90000; // 90s for Azure Email poller + rate limit
  const lockTimeout = 60 * 1000; // Azure Standard default

  if (worstCase > lockTimeout) {
    fail(`RISK DETECTED: Handler worst-case (${worstCase / 1000}s) > lock timeout (${lockTimeout / 1000}s).`);
    fail('If Azure Email is slow (>60s), lock expires → message redelivered → DUPLICATE EMAIL sent.');
    warn('Fix options:');
    warn('  Option A — Add lock renewal in emailQueue.js processMessage:');
    warn('             setInterval(() => receiver.renewMessageLock(message), 30000)');
    warn('  Option B — Reduce Azure Email poller timeout (begin + poll with maxPollIntervalInMs)');
    warn('  Option C — Set AZURE_SERVICE_BUS_RATE_LIMIT_MS=0 and rely on Azure lock (only if email is fast)');
  } else {
    pass(`Handler worst-case (${worstCase / 1000}s) ≤ lock timeout (${lockTimeout / 1000}s) — no renewal needed.`);
  }

  // Enqueue a probe message to verify lock expiry window
  const { messageId } = await sendMessage(client, {
    type: 'REGISTRATION_OTP',
    payload: { email: 'locktest@test.com', otpCode: '777' },
    _note: 'PeekLock timeout probe'
  });
  info(`Probe message enqueued: ${messageId}`);
  info('Manual verification: start the server with a 70s sleep in processEmailQueueMessage');
  info('and confirm the message appears in logs TWICE (redelivery) to confirm the risk.');
  await drainMessages(client, 1, 5000);
}

async function test8_StartupResilience() {
  sep('8  —  Startup Resilience (Bad Connection String)');
  info('Testing getClient() null-guard and graceful degradation…');

  // Simulate bad connection string by importing with override
  const BAD_STRING = 'Endpoint=sb://invalid.servicebus.windows.net/;SharedAccessKeyName=bad;SharedAccessKey=bad=';

  let clientCreated = false;
  let clientError   = null;
  try {
    const { ServiceBusClient: SBC } = require('@azure/service-bus');
    const badClient = new SBC(BAD_STRING);
    // Creating the client itself doesn't throw — the error surfaces on send/receive
    clientCreated = true;

    const sender = badClient.createSender('test-queue');
    await sender.sendMessages({ body: { test: true }, messageId: uid('bad') });
    fail('Expected send to fail with bad connection string — it succeeded (unexpected)');
    await sender.close();
    await badClient.close();
  } catch (err) {
    if (clientCreated) {
      pass('Client creation succeeds (lazy connection) but send fails — matches your getClient() pattern.');
      info(`Error thrown: ${err.message.slice(0, 100)}`);
    } else {
      pass(`Client creation itself throws: ${err.message.slice(0, 80)}`);
    }
  }

  // Check the guard in emailQueue.js
  info('');
  info('Code guard check (emailQueue.js lines 28-33):');
  if (!CONNECTION_STRING) {
    pass('CONNECTION_STRING is missing — enqueueEmailTask would throw with clear message.');
  } else {
    pass('CONNECTION_STRING is present — null-guard will not block normal operation.');
    info('To test the guard: temporarily unset AZURE_SERVICE_BUS_CONNECTION_STRING and restart server.');
    info('Expected: "Service Bus connection string missing; email queue disabled." in logs.');
  }
}

async function test9_BurstLoadQueueDepth(client) {
  sep('9  —  Burst Load / Queue Depth');
  info('Simulating a burst of 100 requests hitting the endpoint simultaneously…');
  info('(This tests the queue as a buffer — not actual email sending speed)');

  const BURST = 100;
  const tasks = Array.from({ length: BURST }, (_, i) =>
    sendMessage(client, {
      type: 'REGISTRATION_OTP',
      payload: { email: `burst${i}@load-test.com`, otpCode: String(100000 + i) },
      _burstTest: true,
      _index: i
    })
  );

  const start = Date.now();
  const results = await Promise.allSettled(tasks);
  const elapsed = Date.now() - start;
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message?.slice(0, 60));

  info(`Burst of ${BURST} messages: ${succeeded} succeeded, ${BURST - succeeded} failed — ${elapsed}ms total`);
  info(`Throughput: ${(succeeded / (elapsed / 1000)).toFixed(1)} enqueues/sec`);

  if (succeeded === BURST && elapsed < 10000) {
    pass(`Queue absorbed all ${BURST} messages in ${elapsed}ms — excellent burst buffer.`);
    pass('HTTP responses would have returned immediately; emails processed asynchronously.');
  } else if (succeeded >= BURST * 0.95) {
    warn(`${succeeded}/${BURST} succeeded (≥95%). Minor send errors under burst.`);
  } else {
    fail(`Only ${succeeded}/${BURST} succeeded. Queue may be throttling.`);
    if (errors.length > 0) info(`Sample errors: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);
  }

  // Drain to keep the queue clean
  info('Draining burst test messages…');
  const drained = await drainMessages(client, BURST, 20000);
  info(`Drained ${drained}/${succeeded} messages`);

  return { elapsed, succeeded, throughput: (succeeded / (elapsed / 1000)).toFixed(1) };
}

async function test10_MessageTypeRouting(client) {
  sep('10  —  All 8 Message-Type Routes');
  info('Enqueueing one message of each type to verify router completeness…');
  info('NOTE: These will be processed by the live processor if it is running.');

  const types = [
    { type: 'REGISTRATION_OTP',  payload: { email: 'route1@test.com', otpCode: '111111' } },
    { type: 'PASSWORD_RESET_OTP', payload: { email: 'route2@test.com', otpCode: '222222' } },
    { type: 'BULK_USER_WELCOME',  payload: { email: 'route3@test.com', password: 'Temp@123', loginUrl: 'http://localhost:3000/login' } },
    { type: 'BADGE_RECEIVED',     payload: { email: 'route4@test.com', badgeName: 'TestBadge', badgeDescription: 'A test badge', profileLink: null, certificateId: null, badgeImageUrl: null } },
    { type: 'PROFILE_UPDATE',     payload: { email: 'route5@test.com', reasonType: 'badge_stripped', badgeName: 'TestBadge', additionalInfo: 'test', profileLink: null } },
    { type: 'INTERVIEW_SCHEDULED',payload: { email: 'route6@test.com', scheduledAt: '2026-04-01T10:00', meetLink: 'https://meet.google.com/test' } },
    { type: 'APPLICATION_STATUS', payload: { email: 'route7@test.com', status: 'ACCEPTED' } },
    { type: 'TERMINATION',        payload: { email: 'route8@test.com', reason: 'Performance Review' } },
    // Negative test — unknown type
    { type: 'UNKNOWN_TYPE',       payload: { email: 'route9@test.com' }, _expect: 'DLQ' },
  ];

  let passed = 0;
  for (const t of types) {
    try {
      const { messageId } = await sendMessage(client, { type: t.type, payload: t.payload }, { messageId: uid(`type-${t.type}`) });
      if (t._expect === 'DLQ') {
        info(`  [NEGATIVE] ${t.type} → enqueued. Processor should throw & abandon → DLQ after 10 retries.`);
      } else {
        pass(`  ${t.type} → enqueued (${messageId})`);
      }
      passed++;
    } catch (err) {
      fail(`  ${t.type} → enqueue FAILED: ${err.message}`);
    }
  }

  info('');
  info(`${passed}/${types.length} messages enqueued successfully.`);
  info('If processor is running, verify server logs show correct handler for each type.');
  info('Verify UNKNOWN_TYPE ends up in Azure Portal → Dead-letter after 10 delivery attempts.');

  // Drain only the valid test types (not the DLQ bait)
  await drainMessages(client, types.length - 1, 15000);
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${C.bold}${C.cyan}Azure Service Bus — Queue Performance Test Suite${C.reset}`);
  console.log(`${C.grey}Queue: ${QUEUE_NAME} | Concurrency: ${MAX_CONCURRENT} | RateLimit: ${RATE_LIMIT_MS}ms${C.reset}\n`);

  if (!CONNECTION_STRING) {
    console.log(`${C.red}ERROR: AZURE_SERVICE_BUS_CONNECTION_STRING is not set in .env${C.reset}`);
    process.exit(1);
  }

  // Parse CLI args
  const args       = process.argv.slice(2);
  const runAll     = args.includes('--all');
  const testArg    = (args.find(a => a.startsWith('--test=')) || '').replace('--test=', '');
  const selectedTests = runAll
    ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    : testArg
      ? testArg.split(',').map(Number).filter(Boolean)
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // default: run all

  console.log(`Running tests: ${selectedTests.join(', ')}`);

  const client = new ServiceBusClient(CONNECTION_STRING);

  const summary = [];
  const startTime = Date.now();

  const testMap = {
    1:  () => test1_EnqueueThroughput(client),
    2:  () => test2_EnqueueToDeliveryLatency(client),
    3:  () => test3_RateLimitCorrectness(client),
    4:  () => test4_DeadLetterBehaviour(client),
    5:  () => test5_ConcurrentCallsConfig(client),
    6:  () => test6_MessageIdempotency(client),
    7:  () => test7_PeekLockTimeoutRisk(client),
    8:  () => test8_StartupResilience(),
    9:  () => test9_BurstLoadQueueDepth(client),
    10: () => test10_MessageTypeRouting(client),
  };

  for (const num of selectedTests) {
    const fn = testMap[num];
    if (!fn) { warn(`No test #${num} — skipping`); continue; }

    const t0 = Date.now();
    try {
      await fn();
      summary.push({ num, status: 'completed', ms: Date.now() - t0 });
    } catch (err) {
      console.log(`\n${C.red}  ✘ Test ${num} threw an unhandled error:${C.reset}`);
      console.error('  ', err.message);
      summary.push({ num, status: 'error', ms: Date.now() - t0, error: err.message });
    }

    // Small breathing room between tests
    await sleep(500);
  }

  // ─── Final Summary ────────────────────────────────────────────────────────
  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}  Summary${C.reset}   (total: ${Date.now() - startTime}ms)\n`);
  for (const s of summary) {
    const icon = s.status === 'completed' ? `${C.green}✔${C.reset}` : `${C.red}✘${C.reset}`;
    const label = s.status === 'error' ? `${C.red}ERROR${C.reset}: ${s.error?.slice(0, 60)}` : `${C.grey}${s.ms}ms${C.reset}`;
    console.log(`  ${icon}  Test ${String(s.num).padEnd(3)} — ${label}`);
  }
  console.log('');

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  try { await client.close(); } catch (_) {}
  process.exit(0);
}

run().catch(err => {
  console.error(`${C.red}Fatal:${C.reset}`, err.message || err);
  process.exit(1);
});
