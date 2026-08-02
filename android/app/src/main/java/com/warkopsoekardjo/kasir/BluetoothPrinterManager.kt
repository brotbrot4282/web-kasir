package com.warkopsoekardjo.kasir

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class BluetoothPrinterManager {

    private val sppUuid: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    @Volatile
    private var socket: BluetoothSocket? = null

    private val executor: ExecutorService = Executors.newSingleThreadExecutor()

    fun listPrinters(): String {
        return try {
            val adapter = BluetoothAdapter.getDefaultAdapter() ?: return "[]"
            val arr = JSONArray()
            for (d in adapter.bondedDevices) {
                if (d.type == BluetoothDevice.DEVICE_TYPE_CLASSIC || d.type == BluetoothDevice.DEVICE_TYPE_DUAL) {
                    val o = JSONObject()
                    o.put("name", d.name ?: "Printer")
                    o.put("address", d.address)
                    o.put("bonded", true)
                    arr.put(o)
                }
            }
            arr.toString()
        } catch (e: Exception) {
            "[]"
        }
    }

    @Synchronized
    fun connect(address: String): Boolean {
        disconnect()
        return try {
            val adapter = BluetoothAdapter.getDefaultAdapter() ?: return false
            val device = adapter.getRemoteDevice(address)
            adapter.cancelDiscovery()
            val s = device.createRfcommSocketToServiceRecord(sppUuid)
            try {
                s.connect()
                socket = s
            } catch (e1: Exception) {
                val s2 = device.createInsecureRfcommSocketToServiceRecord(sppUuid)
                s2.connect()
                socket = s2
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    @Synchronized
    fun disconnect(): Boolean {
        return try {
            socket?.close()
            socket = null
            true
        } catch (e: Exception) {
            false
        }
    }

    fun isConnected(): Boolean = socket?.isConnected == true

    fun printAsync(base64: String, callback: (Boolean) -> Unit) {
        executor.execute {
            var ok = false
            try {
                val s = socket
                if (s != null && s.isConnected) {
                    val bytes = Base64.decode(base64, Base64.DEFAULT)
                    val out = s.outputStream
                    out.write(bytes)
                    out.flush()
                    ok = true
                }
            } catch (e: Exception) {
                ok = false
            }
            callback(ok)
        }
    }
}
