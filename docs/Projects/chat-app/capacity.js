const os = require("os");

function estimateCapacity(opts) {
  const memoryMB = opts.memoryMB || 256;
  const maxConnections = opts.maxConnections || 50;
  const rateLimitPerMin = opts.rateLimitPerMin || 30;
  const workerThreads = opts.workerThreads || 1;
  const totalRamMB = Math.round(os.totalmem() / (1024 * 1024));
  const freeRamMB = Math.round(os.freemem() / (1024 * 1024));
  const cpuCores = os.cpus().length;

  const baseOverheadMB = 45;
  const perUserMB = 1.2;
  const ramBasedUsers = Math.floor((memoryMB - baseOverheadMB) / perUserMB);
  const cpuBasedUsers = Math.max(10, workerThreads * 20 + Math.floor(cpuCores * 8));
  const safeRamUsers = Math.floor(((freeRamMB * 0.35) - baseOverheadMB) / perUserMB);

  const recommended = Math.max(
    1,
    Math.min(maxConnections, ramBasedUsers, cpuBasedUsers, safeRamUsers > 0 ? safeRamUsers : ramBasedUsers)
  );

  const conservative = Math.max(1, Math.floor(recommended * 0.7));
  const messagesPerMinute = recommended * rateLimitPerMin;

  const warnings = [];
  if (memoryMB > totalRamMB * 0.4) {
    warnings.push(`Memory limit (${memoryMB} MB) is over 40% of system RAM (${totalRamMB} MB). Lower it to avoid crashes.`);
  }
  if (recommended >= maxConnections * 0.9) {
    warnings.push("You are near the configured connection cap. Raise MAX_CONNECTIONS only if estimates allow it.");
  }
  if (workerThreads > cpuCores) {
    warnings.push(`Worker threads (${workerThreads}) exceed CPU cores (${cpuCores}). Use ${cpuCores} or fewer on this PC.`);
  }

  return {
    recommendedOnline: recommended,
    conservativeOnline: conservative,
    maxConfigured: maxConnections,
    messagesPerMinuteTotal: messagesPerMinute,
    ramBasedUsers,
    cpuBasedUsers,
    systemRamMB: totalRamMB,
    freeRamMB,
    cpuCores,
    memoryLimitMB: memoryMB,
    workerThreads,
    warnings,
    summary: `This PC can comfortably host ~${conservative}–${recommended} online users with ${memoryMB} MB allocated.`,
  };
}

module.exports = { estimateCapacity };
