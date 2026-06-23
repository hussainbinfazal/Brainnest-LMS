// queues/reconcileQueue.ts

// import { connection } from '@repo/shared';
import { connection } from '@repo/shared';
import { Queue } from 'bullmq';



export const reconcileQueue: Queue = new Queue('reconcile', {
  connection: connection, ///Redis connection
  defaultJobOptions: {
    attempts: 3,                    // ✅ retry 3 times if it fails
    backoff: {
      type: 'exponential',
      delay: 1000                   // wait longer each retry
    }
  }
});

// ✅ Schedule it to run every 15 minutes automatically
export async function registerCronJobs() {
  
  // ✅ Step 1: remove old sweep if exists
  const repeatableJobs = await reconcileQueue.getRepeatableJobs();
  const sweepJob = repeatableJobs.find(job => job.name === 'sweep');
  
  if (sweepJob) {
    await reconcileQueue.removeRepeatableByKey(sweepJob.key);
  }

  // ✅ Step 2: register fresh
  await reconcileQueue.add('sweep', {}, {
    repeat: { pattern: '*/15 * * * *' }
  });

  console.log('Cron jobs registered');
}