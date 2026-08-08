import os from 'node:os';
import v8 from 'node:v8';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { monitorEventLoopDelay } from 'node:perf_hooks';

/* ========================================================= */
/* ========================================================= */
/* ========== Calling Promisify, Round, Timestamp ========== */
/* ========================================================= */
/* ========================================================= */
const ExecFileAsync = promisify(execFile);
const round = (n: number): number => Math.round(n * 100) / 100;
const timestamp = () => new Date().toISOString();

/* ====================================================================== */
/* ====================================================================== */
/* ========== Calling Event Loop Monitor & Lag ({ Preflight }) ========== */
/* ====================================================================== */
/* ====================================================================== */
const eventLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
eventLoopMonitor.enable();

const EVENT_LOOP_RESET_INTERVAL_IN_MS = 10_000;
setInterval(() => eventLoopMonitor.reset(), EVENT_LOOP_RESET_INTERVAL_IN_MS).unref();

// Get Event Loop Lag
function getEventLoopLagInMS() {
    return {
        metric: 'ms',
        min: round(eventLoopMonitor.min / 1e6),
        max: round(eventLoopMonitor.max / 1e6),
        mean: round(eventLoopMonitor.mean / 1e6),
        p99: round(eventLoopMonitor.percentile(99) / 1e6),
    };
}

/* ========================================================== */
/* ========================================================== */
/* ==================== Get Cpu Snapshot ==================== */
/* ========================================================== */
/* ========================================================== */
function cpuSnapshot() {
    return os.cpus().map((core) => {
        const times = core.times;
        const total = times.user + times.nice + times.sys + times.idle + times.irq;
        return { idle: times.idle, total };
    });
}

/* ======================================================= */
/* ======================================================= */
/* ==================== Get Cpu Usage ==================== */
/* ======================================================= */
/* ======================================================= */
async function getCpuUsage(samples = 4, defaultMS = 150) {
    const overallReadings: number[] = [];
    const perCoreReadings: number[][] = os.cpus().map(() => []);

    // Loop through
    for (let i = 0; i < samples; i++) {
        const start = cpuSnapshot();
        await new Promise((resolve) => setTimeout(resolve, defaultMS));
        const end = cpuSnapshot();

        // Per Core Usage
        const perCore = start.map((s, idx) => {
            const e = end[idx];
            const idleDelta = e.idle - s.idle;
            const totalDelta = e.total - s.total;
            return totalDelta === 0 ? 0 : 1 - idleDelta / totalDelta;
        });

        // Push to array
        perCore.forEach((usage, idx) => perCoreReadings[idx].push(usage));
        overallReadings.push(perCore.reduce((a, b) => a + b, 0) / perCore.length);
    }

    // Calculate median
    const median = (values: number[]) => {
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
    };

    // Return
    return {
        usagePercentage: round(median(overallReadings) * 100),
        perCoreUsagePercentage: perCoreReadings.map((readings) => round(median(readings) * 100)),
        logicalCoreCount: os.cpus().length,
        model: os.cpus()[0]?.model ?? 'unknown',
    };
}

/* ====================================================================== */
/* ====================================================================== */
/* ==================== Get Swap info :: Linux Only ===================== */
/* ====================================================================== */
/* ====================================================================== */
async function getSwapInfo() {
    if (os.platform() !== 'linux') return null;
    try {
        const raw = await fs.readFile('/proc/meminfo', 'utf-8');
        const read = (key: string) => {
            const match = raw.match(new RegExp(`^${key}:\\s+(\\d+)\\s+kB`, 'm'));
            return match ? Number(match[1]) : null;
        };

        // Read & Check
        const totalKb = read('SwapTotal');
        const freeKb = read('SwapFree');
        if (totalKb === null || freeKb === null) { return null; }

        // Calculate UsedKb & Return
        const usedKb = totalKb - freeKb;
        return {
            totalMb: round(totalKb / 1024),
            usedMb: round(usedKb / 1024),
            freeMb: round(freeKb / 1024),
            usagePercentage: totalKb === 0 ? 0 : round((usedKb / totalKb) * 100),
        };
    } catch (error) {
        return null;
    }
}

/* ======================================================== */
/* ======================================================== */
/* ==================== Get Memory Info =================== */
/* ======================================================== */
/* ======================================================== */
function getMemoryInfo() {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    const usedBytes = totalBytes - freeBytes;

    // Process Usage
    const proc = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    // Return
    return {
        system: {
            totalMb: round(totalBytes / 1024 / 1024),
            usedMb: round(usedBytes / 1024 / 1024),
            freeMb: round(freeBytes / 1024 / 1024),
            usagePercentage: round((usedBytes / totalBytes) * 100),
        },
        process: {
            rssMb: round(proc.rss / 1024 / 1024),
            heapTotalMb: round(proc.heapTotal / 1024 / 1024),
            heapUsedMb: round(proc.heapUsed / 1024 / 1024),
            externalMb: round(proc.external / 1024 / 1024),
            arrayBuffersMb: round(proc.arrayBuffers / 1024 / 1024),
        },
        v8Heap: {
            heapSizeLimitMb: round(heapStats.heap_size_limit / 1024 / 1024),
            usedHeapPercentage: round((heapStats.used_heap_size / heapStats.heap_size_limit) * 100),
            mallocedMemoryMb: round(heapStats.malloced_memory / 1024 / 1024),
        },
    };
}

/* ======================================================== */
/* ======================================================== */
/* ==================== Get Disk Usage ==================== */
/* ======================================================== */
/* ======================================================== */
const DEFAULT_DISKINFO_TIMEOUT_MS = 3_000;
async function getDiskInfo(path = './') {
    try {
        const { stdout } = await ExecFileAsync('df', ['-Pk', path], { timeout: DEFAULT_DISKINFO_TIMEOUT_MS });
        const lines = stdout.trim().split('\n');
        const parts = lines[lines.length - 1].split(/\s+/);

        // Filesystem :: 1024-blocks Used Available Capacity MountedOn
        const totalKb = Number(parts[1]);
        const usedKb = Number(parts[2]);
        const freeKb = Number(parts[3]);

        // Check Number
        if (!Number.isFinite(totalKb) || !Number.isFinite(usedKb) || !Number.isFinite(freeKb)) { return null; }

        // Return
        return {
            totalMb: round(totalKb / 1024),
            usedMb: round(usedKb / 1024),
            freeMb: round(freeKb / 1024),
            usagePercentage: round((usedKb / totalKb) * 100),
        };
    } catch (error) {
        return null;
    }
}

/* ========================================================== */
/* ========================================================== */
/* ==================== Get Network Info ==================== */
/* ========================================================== */
/* ========================================================== */
function getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const summary: any = {};

    // Get name & address
    for (const [name, addrs] of Object.entries(interfaces)) {
        if (!addrs) continue;
        summary[name] = addrs.map((a) => ({
            address: a.address,
            family: a.family,
            internal: a.internal,
        }));
    }

    // Return
    return summary;
}

/* =================================================================== */
/* =================================================================== */
/* ==================== Get Process / Runtime Info =================== */
/* =================================================================== */
/* =================================================================== */
function getProcessInfo() {
    return {
        pid: process.pid,
        versionOfNode: process.version,
        uptimeInSeconds: round(process.uptime()),
        environment: 'production',
    };
}

/* =============================================================== */
/* =============================================================== */
/* ==================== Get System Level Info ==================== */
/* =============================================================== */
/* =============================================================== */
function getSystemInfo() {
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        architecture: os.arch(),
        release: os.release(),
        uptimeInSeconds: round(os.uptime()),
        loadAvg: os.loadavg().map((n) => round(n)),
    };
}

/* =============================================================================== */
/* =============================================================================== */
/* ========== @types :: interface Componenets Checks ({ HealthReport }) ========== */
/* =============================================================================== */
/* =============================================================================== */
interface ComponentsChecks {
    name: string;
    status: 'ok' | 'warn' | 'fail';
    message?: string;
}

/* ================================================================= */
/* ================================================================= */
/* =============== @types :: interface Health Report =============== */
/* ================================================================= */
/* ================================================================= */
export interface HealthReport {
    status: 'ok' | 'degraded' | 'critical';
    version: string;
    timestamp: string;
    cached: boolean;
    os: ReturnType<typeof getSystemInfo>;
    cpu: Awaited<ReturnType<typeof getCpuUsage>>;
    eventloop: ReturnType<typeof getEventLoopLagInMS>;
    memory: ReturnType<typeof getMemoryInfo>;
    swap: Awaited<ReturnType<typeof getSwapInfo>>;
    disk: Awaited<ReturnType<typeof getDiskInfo>>;
    network: ReturnType<typeof getNetworkInfo>;
    process: ReturnType<typeof getProcessInfo>;
    components: ComponentsChecks[];
}

/* ========================================================================= */
/* ========================================================================= */
/* ==================== Hard Safe Usage Limit By System ==================== */
/* ========================================================================= */
/* ========================================================================= */
const SYSTEM_UPTO_SAFE_USAGE_LIMIT = {
    cpu: {
        warn: 75,
        fail: 90,
    },
    memory: {
        warn: 80,
        fail: 92,
    },
    disk: {
        warn: 80,
        fail: 90,
    },
    swap: {
        warn: 30,
        fail: 60,
    },
    eventloop: {
        warnInMS: 50,
        failInMS: 150,
    },
};

/* ============================================================================= */
/* ============================================================================= */
/* ==================== Report Caching & Build Health Report =================== */
/* ============================================================================= */
/* ============================================================================= */
const CACHE_TTL_IN_MS = 10_000;
let CachedAt = 0;
let CachedResponse: HealthReport | null = null;
let InFlight: Promise<HealthReport> | null = null;

// Build Logic
async function buildHealthReport(): Promise<HealthReport> {
    const [cpu, disk, swap] = await Promise.all([getCpuUsage(), getDiskInfo(), getSwapInfo()]);
    const memory = getMemoryInfo();
    const system = getSystemInfo();
    const network = getNetworkInfo();
    const proc = getProcessInfo();
    const eventloop = getEventLoopLagInMS();

    // Create :: An array of components
    const arrayChecks: HealthReport['components'] = [];

    // Cpu Check
    if (cpu.usagePercentage >= SYSTEM_UPTO_SAFE_USAGE_LIMIT.cpu.fail) {
        arrayChecks.push({ name: 'cpu', status: 'fail', message: `Your cpu usage at ${cpu.usagePercentage}%` });
    } else if (cpu.usagePercentage >= SYSTEM_UPTO_SAFE_USAGE_LIMIT.cpu.warn) {
        arrayChecks.push({ name: 'cpu', status: 'warn', message: `Yout cpu usage at ${cpu.usagePercentage}%` });
    } else {
        arrayChecks.push({ name: 'cpu', status: 'ok' });
    }

    // Memory Checks
    if (memory.system.usagePercentage >= SYSTEM_UPTO_SAFE_USAGE_LIMIT.memory.fail) {
        arrayChecks.push({ name: 'memory', status: 'fail', message: `Your memory usage at ${memory.system.usagePercentage}%` });
    } else if (memory.system.usagePercentage >= SYSTEM_UPTO_SAFE_USAGE_LIMIT.memory.warn) {
        arrayChecks.push({ name: 'memory', status: 'warn', message: `Your memory usage at ${memory.system.usagePercentage}%` });
    } else {
        arrayChecks.push({ name: 'memory', status: 'ok' });
    }

    // Disk Check
    if (disk === null) {
        arrayChecks.push({ name: 'disk', status: 'warn', message: 'Unable to read disk usage' });
    } else if (disk.usagePercentage >= SYSTEM_UPTO_SAFE_USAGE_LIMIT.disk.fail) {
        arrayChecks.push({ name: 'disk', status: 'fail', message: `Yout disk usage at ${disk.usagePercentage}%` });
    } else if (disk.usagePercentage >= SYSTEM_UPTO_SAFE_USAGE_LIMIT.disk.warn) {
        arrayChecks.push({ name: 'disk', status: 'warn', message: `Your disk usage at ${disk.usagePercentage}%` });
    } else {
        arrayChecks.push({ name: 'disk', status: 'ok' });
    }

    // Swap Check :: ({ OS: Linux Only })
    if (swap === null) {
        arrayChecks.push({ name: 'swap', status: 'ok', message: 'No swap configured' });
    } else if (swap.usagePercentage >= SYSTEM_UPTO_SAFE_USAGE_LIMIT.swap.fail) {
        arrayChecks.push({ name: 'swap', status: 'fail', message: `Your swap at ${swap.usagePercentage}%` });
    } else if (swap.usagePercentage >= SYSTEM_UPTO_SAFE_USAGE_LIMIT.swap.warn) {
        arrayChecks.push({ name: 'swap', status: 'warn', message: `Your swap at ${swap.usagePercentage}%` });
    } else {
        arrayChecks.push({ name: 'swap', status: 'ok' });
    }

    // Event Loop Check
    if (eventloop.p99 >= SYSTEM_UPTO_SAFE_USAGE_LIMIT.eventloop.failInMS) {
        arrayChecks.push({ name: 'eventloop', status: 'fail', message: `Event loop p99 lag at ${eventloop.p99}ms` });
    } else if (eventloop.p99 >= SYSTEM_UPTO_SAFE_USAGE_LIMIT.eventloop.warnInMS) {
        arrayChecks.push({ name: 'eventloop', status: 'warn', message: `Event loop p99 lag at ${eventloop.p99}ms` });
    } else {
        arrayChecks.push({ name: 'eventloop', status: 'ok' });
    }

    // Current status
    const hasFail = arrayChecks.some((c) => c.status === 'fail');
    const hasWarn = arrayChecks.some((c) => c.status === 'warn');
    const status: HealthReport['status'] = hasFail ? 'critical' : hasWarn ? 'degraded' : 'ok';

    // Return
    return {
        status: status,
        version: 'v1',
        timestamp: timestamp(),
        cached: false,
        os: system,
        cpu: cpu,
        eventloop: eventloop,
        memory: memory,
        swap: swap,
        disk: disk,
        network: network,
        process: proc,
        components: arrayChecks,
    };
}

// Export :: ({ GenerateHealthReport })
export async function GenerateHealthReport(): Promise<HealthReport> {
    const now = Date.now();

    // Logic :: Cache exist
    if (CachedResponse && now - CachedAt < CACHE_TTL_IN_MS) {
        return { ...CachedResponse, cached: true };
    }

    // In-Flight :: Not call resource if exist
    if (!InFlight) {
        InFlight = buildHealthReport().finally(() => { 
            InFlight = null; 
        });
    }

    // Final Report Send
    const report = await InFlight;
    CachedResponse = report;
    CachedAt = Date.now();
    return report;
}