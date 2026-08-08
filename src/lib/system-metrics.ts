import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// Calling promisify, round & timestamp declaration
const ExecFileAsync = promisify(execFile);
const round = (n: number): number => Math.round(n * 100) / 100;
const timestamp = () => new Date().toISOString();

// Get Cpu Snapshot
function cpuSnapshot() {
    return os.cpus().map((core) => {
        const times = core.times;
        const total = times.user + times.nice + times.sys + times.idle + times.irq;
        return { idle: times.idle, total };
    });
}

// Cpu Usage
async function getCpuUsage(defaultMS = 200) {
    const start = cpuSnapshot();
    await new Promise((resolve) => setTimeout(resolve, defaultMS));
    const end = cpuSnapshot();

    // Per Core Usage
    const perCore = start.map((s, i) => {
        const e = end[i];
        const idleDelta = e.idle - s.idle;
        const totalDelta = e.total - s.total;
        const usage = totalDelta === 0 ? 0 : 1 - idleDelta / totalDelta;

        // Result :: One decimal place
        return Math.round(usage * 1000) / 10;
    });

    // Usage `%` & Return
    const usagePercentage = Math.round((perCore.reduce((a, b) => a + b, 0) / perCore.length) * 10) / 10;
    return {
        usagePercentage: usagePercentage,
        perCore: perCore,
        coreCount: os.cpus().length,
        model: os.cpus()[0]?.model ?? 'unknown',
    };
}

// Get Memory Info
function getMemoryInfo() {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    const usedBytes = totalBytes - freeBytes;

    // Process Usage
    const proc = process.memoryUsage();

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
        },
    };
}

// Get Disk Usage
async function getDiskInfo(path = '/') {
    try {
        const { stdout } = await ExecFileAsync('df', ['-Pk', path]);
        const lines = stdout.trim().split('\n');
        const parts = lines[lines.length - 1].split(/\s+/);

        // Filesystem :: 1024-blocks Used Available Capacity MountedOn
        const totalKb = Number(parts[1]);
        const usedKb = Number(parts[2]);
        const freeKb = Number(parts[3]);

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

// Get Network
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

// Get Process / Runtime Info
function getProcessInfo() {
    return {
        pid: process.pid,
        nodeVersion: process.version,
        uptimeSeconds: round(process.uptime()),
        env: 'production',
    };
}

// Get System Level Info
function getSystemInfo() {
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        uptimeSeconds: round(os.uptime()),
        loadAvg: os.loadavg().map((n) => round(n)),
    };
}

// @types :: interface Checks ({ HealthReport })
interface Checks {
    name: string;
    status: 'ok' | 'warn' | 'fail';
    message?: string;
}

// @types :: interface Health Report
export interface HealthReport {
    status: 'ok' | 'degraded' | 'critical';
    timestamp: string;
    system: ReturnType<typeof getSystemInfo>;
    cpu: Awaited<ReturnType<typeof getCpuUsage>>;
    memory: ReturnType<typeof getMemoryInfo>;
    disk: Awaited<ReturnType<typeof getDiskInfo>>;
    network: ReturnType<typeof getNetworkInfo>;
    process: ReturnType<typeof getProcessInfo>;
    checks: Checks[];
}

// Usage Lavel limits
const SYS_SAFE_USAGE_THRESHOLDS = {
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
    }
};

// Export ({ generateHealthReport :: v1 })
export async function generateHealthReport(): Promise<HealthReport> {
    const [cpu, disk] = await Promise.all([getCpuUsage(), getDiskInfo()]);
    const memory = getMemoryInfo();
    const system = getSystemInfo();
    const network = getNetworkInfo();
    const proc = getProcessInfo();

    // Empty checks array
    const checks: HealthReport['checks'] = [];

    // Cpu Checks :: Later changes the messags if required.
    if (cpu.usagePercentage >= SYS_SAFE_USAGE_THRESHOLDS.cpu.fail) {
        checks.push({ 
            name: 'cpu', 
            status: 'fail', 
            message: `CPU at ${cpu.usagePercentage}%` 
        });
    } else if (cpu.usagePercentage >= SYS_SAFE_USAGE_THRESHOLDS.cpu.warn) {
        checks.push({ 
            name: 'cpu', 
            status: 'warn', 
            message: `CPU at ${cpu.usagePercentage}%` 
        });
    } else {
        checks.push({ 
            name: 'cpu', 
            status: 'ok' 
        });
    }

    // Memory Checks :: Later changes the messags if required.
    if (memory.system.usagePercentage >= SYS_SAFE_USAGE_THRESHOLDS.memory.fail) {
        checks.push({
            name: 'memory',
            status: 'fail',
            message: `Memory at ${memory.system.usagePercentage}%`,
        });
    } else if (memory.system.usagePercentage >= SYS_SAFE_USAGE_THRESHOLDS.memory.warn) {
        checks.push({
            name: 'memory',
            status: 'warn',
            message: `Memory at ${memory.system.usagePercentage}%`,
        });
    } else {
        checks.push({ 
            name: 'memory', 
            status: 'ok' 
        });
    }

    // Disk Check :: Later changes the messags if required.
    if (disk === null) {
        checks.push({ 
            name: 'disk', 
            status: 'warn', 
            message: 'unable to read disk usage' 
        });
    } else if (disk.usagePercentage >= SYS_SAFE_USAGE_THRESHOLDS.disk.fail) {
        checks.push({ 
            name: 'disk', 
            status: 'fail', 
            message: `Disk at ${disk.usagePercentage}%` 
        });
    } else if (disk.usagePercentage >= SYS_SAFE_USAGE_THRESHOLDS.disk.warn) {
        checks.push({ 
            name: 'disk', 
            status: 'warn', 
            message: `Disk at ${disk.usagePercentage}%` 
        });
    } else {
        checks.push({ 
            name: 'disk', 
            status: 'ok' 
        });
    }

    const hasFail = checks.some((c) => c.status === 'fail');
    const hasWarn = checks.some((c) => c.status === 'warn');
    const status: HealthReport['status'] = hasFail ? 'critical' : hasWarn ? 'degraded' : 'ok';

    // Return
    return {
        status: status,
        timestamp: timestamp(),
        system: system,
        cpu: cpu,
        memory: memory,
        disk: disk,
        network: network,
        process: proc,
        checks: checks,
    }
}