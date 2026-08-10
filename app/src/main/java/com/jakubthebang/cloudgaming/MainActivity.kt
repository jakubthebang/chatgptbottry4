package com.jakubthebang.cloudgaming

import android.app.Activity
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView

class MainActivity : Activity() {
    private lateinit var vm: VMManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        vm = VMManager(this)
        val status = findViewById<TextView>(R.id.status)
        val ram = findViewById<EditText>(R.id.ram)
        val cpu = findViewById<EditText>(R.id.cpu)

        findViewById<Button>(R.id.start).setOnClickListener {
            vm.configure(ram.text.toString().toIntOrNull() ?: 4096, cpu.text.toString().toIntOrNull() ?: 2)
            status.text = vm.start()
        }
        findViewById<Button>(R.id.stop).setOnClickListener { status.text = vm.stop() }
        findViewById<Button>(R.id.restart).setOnClickListener { status.text = vm.restart() }
    }
}
