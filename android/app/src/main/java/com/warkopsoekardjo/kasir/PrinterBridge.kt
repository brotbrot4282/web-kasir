package com.warkopsoekardjo.kasir

import android.webkit.JavascriptInterface
import android.widget.Toast

class PrinterBridge(
    private val activity: MainActivity,
    private val printer: BluetoothPrinterManager
) {

    @JavascriptInterface
    fun getPrinters(): String = printer.listPrinters()

    @JavascriptInterface
    fun connect(address: String): Boolean {
        return try {
            printer.connect(address)
        } catch (e: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun disconnect(): Boolean = printer.disconnect()

    @JavascriptInterface
    fun isConnected(): Boolean = printer.isConnected()

    @JavascriptInterface
    fun print(base64: String): Boolean {
        if (!printer.isConnected()) return false
        printer.printAsync(base64) { ok ->
            activity.runOnUiThread {
                Toast.makeText(
                    activity,
                    if (ok) "Struk terkirim ke printer" else "Gagal mengirim ke printer",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
        return true
    }
}
