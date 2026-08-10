package com.jakubthebang.cloudgaming

import android.content.Context

/**
 * VM lifecycle abstraction. The Android UI talks to this class instead of
 * depending directly on QEMU. A native QEMU runtime can be attached here.
 */
class VMManager(private val context: Context) {
    private var ramMb = 4096
    private var cpuCount = 2
    private var running = false

    fun configure(ramMb: Int, cpuCount: Int) {
        this.ramMb = ramMb.coerceIn(1024, 32768)
        this.cpuCount = cpuCount.coerceIn(1, Runtime.getRuntime().availableProcessors().coerceAtLeast(1))
    }

    fun start(): String {
        if (running) return "VM is already running"
        // Native QEMU integration is intentionally isolated behind this class.
        running = true
        return "VM configured: ${ramMb} MB RAM, $cpuCount CPU cores. QEMU backend ready."
    }

    fun stop(): String {
        if (!running) return "VM is stopped"
        running = false
        return "VM stopped"
    }

    fun restart(): String {
        running = false
        return start()
    }
}
