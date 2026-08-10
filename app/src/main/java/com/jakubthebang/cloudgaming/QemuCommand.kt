package com.jakubthebang.cloudgaming

/** Builds the QEMU command line used by the native backend. */
object QemuCommand {
    fun build(ramMb: Int, cpuCount: Int, diskPath: String, isoPath: String? = null): List<String> {
        val args = mutableListOf(
            "qemu-system-x86_64",
            "-m", ramMb.coerceIn(1024, 32768).toString(),
            "-smp", cpuCount.coerceIn(1, 16).toString(),
            "-drive", "file=$diskPath,format=qcow2,if=virtio",
            "-machine", "q35",
            "-accel", "tcg,thread=multi",
            "-device", "virtio-vga",
            "-device", "virtio-net-pci,netdev=n0",
            "-netdev", "user,id=n0"
        )
        if (!isoPath.isNullOrBlank()) {
            args += listOf("-cdrom", isoPath)
        }
        return args
    }
}
