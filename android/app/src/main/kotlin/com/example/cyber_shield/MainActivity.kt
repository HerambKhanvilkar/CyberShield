package com.example.cyber_shield

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.telephony.CellInfo
import android.telephony.CellInfoGsm
import android.telephony.CellInfoLte
import android.telephony.CellInfoWcdma
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
  private val channelName = "cyber_shield/network"

  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)

    MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName).setMethodCallHandler { call, result ->
      when (call.method) {
        "getWifiHardwareSupport" -> result.success(getWifiHardwareSupport())
        "getWifiNativeInfo" -> result.success(getWifiNativeInfo())
        "getMobileInfo" -> result.success(getMobileInfo())
        "getBatteryDetails" -> result.success(getBatteryDetails())
        else -> result.notImplemented()
      }
    }
  }

  private fun hasPermission(permission: String): Boolean {
    return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
  }

  private fun getWifiHardwareSupport(): Map<String, Any?> {
    val pm = packageManager
    val supportsWifi = pm.hasSystemFeature(PackageManager.FEATURE_WIFI)
    val supportsWifiDirect = pm.hasSystemFeature(PackageManager.FEATURE_WIFI_DIRECT)
    val supportsWifiAware = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      pm.hasSystemFeature(PackageManager.FEATURE_WIFI_AWARE)
    } else {
      false
    }
    val supportsPasspoint = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      pm.hasSystemFeature(PackageManager.FEATURE_WIFI_PASSPOINT)
    } else {
      false
    }
    val supportsWifiRtt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      pm.hasSystemFeature(PackageManager.FEATURE_WIFI_RTT)
    } else {
      false
    }

    val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
    val supports5ghz = try {
      wifiManager?.is5GHzBandSupported ?: false
    } catch (_: Throwable) {
      false
    }
    val supports6ghz = try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        wifiManager?.is6GHzBandSupported ?: false
      } else {
        false
      }
    } catch (_: Throwable) {
      false
    }

    return mapOf(
      "supportsWifi" to supportsWifi,
      "supportsWifiDirect" to supportsWifiDirect,
      "supportsWifiAware" to supportsWifiAware,
      "supportsWifiPasspoint" to supportsPasspoint,
      "supportsWifiRtt" to supportsWifiRtt,
      "supports5Ghz" to supports5ghz,
      "supports6Ghz" to supports6ghz,
    )
  }

  private fun getWifiNativeInfo(): Map<String, Any?> {
    val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
    if (wifiManager == null) {
      return mapOf("available" to false)
    }

    val canReadWifi = hasPermission(Manifest.permission.ACCESS_FINE_LOCATION) ||
      hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION) ||
      (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && hasPermission(Manifest.permission.NEARBY_WIFI_DEVICES))

    if (!canReadWifi) {
      return mapOf(
        "available" to true,
        "permissionDenied" to true,
      )
    }

    return try {
      val info = wifiManager.connectionInfo
      mapOf(
        "available" to true,
        "permissionDenied" to false,
        "linkSpeedMbps" to info.linkSpeed,
        "rssiDbm" to info.rssi,
        "frequencyMhz" to info.frequency,
      )
    } catch (t: Throwable) {
      mapOf(
        "available" to true,
        "error" to (t.message ?: "Unknown error"),
      )
    }
  }

  private fun getMobileInfo(): Map<String, Any?> {
    val telephony = applicationContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
      ?: return mapOf("available" to false)

    val pm = packageManager
    val supportsEsim = pm.hasSystemFeature(PackageManager.FEATURE_TELEPHONY_EUICC)

    val hasPhonePermission = hasPermission(Manifest.permission.READ_PHONE_STATE)
    val hasLocationPermission = hasPermission(Manifest.permission.ACCESS_FINE_LOCATION) || hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION)

    val cm = applicationContext.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
    val activeNetwork = cm?.activeNetwork
    val caps = if (activeNetwork != null) cm.getNetworkCapabilities(activeNetwork) else null
    val isCellular = caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true

    val (downKbps, upKbps) = if (caps != null) {
      caps.linkDownstreamBandwidthKbps to caps.linkUpstreamBandwidthKbps
    } else {
      null to null
    }

    var dualSim: Boolean? = null
    if (hasPhonePermission) {
      dualSim = try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
          val subMgr = applicationContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
          (subMgr?.activeSubscriptionInfoCount ?: 0) > 1
        } else {
          null
        }
      } catch (_: Throwable) {
        null
      }
    }

    val phoneType = when (telephony.phoneType) {
      TelephonyManager.PHONE_TYPE_GSM -> "GSM"
      TelephonyManager.PHONE_TYPE_CDMA -> "CDMA"
      TelephonyManager.PHONE_TYPE_SIP -> "SIP"
      else -> "UNKNOWN"
    }

    val operator = try {
      telephony.networkOperatorName?.takeIf { it.isNotBlank() } ?: telephony.simOperatorName?.takeIf { it.isNotBlank() }
    } catch (_: Throwable) {
      null
    }

    val signal = if (hasPhonePermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      try {
        telephony.signalStrength
      } catch (_: Throwable) {
        null
      }
    } else {
      null
    }

    val signalLevel = if (signal != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      try {
        signal.level
      } catch (_: Throwable) {
        null
      }
    } else {
      null
    }

    var signalDbm: Int? = null
    var signalAsu: Int? = null
    if (signal != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      try {
        val best = signal.cellSignalStrengths
          .filter { it.level >= 0 }
          .maxByOrNull { it.level }
        if (best != null) {
          signalDbm = best.dbm
          signalAsu = best.asuLevel
        }
      } catch (_: Throwable) {
        // ignore
      }
    }

    var cellId: Long? = null
    var trackingAreaCode: Int? = null
    if (hasPhonePermission && hasLocationPermission) {
      try {
        @Suppress("DEPRECATION")
        val cells: List<CellInfo> = telephony.allCellInfo ?: emptyList()
        val registered = cells.firstOrNull { it.isRegistered } ?: cells.firstOrNull()
        when (registered) {
          is CellInfoLte -> {
            cellId = registered.cellIdentity.ci.toLong()
            trackingAreaCode = registered.cellIdentity.tac
          }
          is CellInfoWcdma -> {
            cellId = registered.cellIdentity.cid.toLong()
            trackingAreaCode = registered.cellIdentity.lac
          }
          is CellInfoGsm -> {
            cellId = registered.cellIdentity.cid.toLong()
            trackingAreaCode = registered.cellIdentity.lac
          }
        }
      } catch (_: Throwable) {
        // ignore
      }
    }

    var interfaceName: String? = null
    var dnsServers: List<String>? = null
    if (cm != null && activeNetwork != null) {
      try {
        val link = cm.getLinkProperties(activeNetwork)
        interfaceName = link?.interfaceName
        dnsServers = link?.dnsServers?.map { it.hostAddress ?: it.toString() }
      } catch (_: Throwable) {
        // ignore
      }
    }

    return mapOf(
      "available" to true,
      "permissionPhoneDenied" to !hasPhonePermission,
      "permissionLocationDenied" to !hasLocationPermission,
      "operatorName" to operator,
      "dualSim" to dualSim,
      "phoneType" to phoneType,
      "esimSupported" to supportsEsim,
      "connectionStatus" to if (isCellular) "Connected" else "Disconnected",
      "signalLevel" to signalLevel,
      "signalDbm" to signalDbm,
      "signalAsu" to signalAsu,
      "downstreamKbps" to downKbps,
      "upstreamKbps" to upKbps,
      "cellId" to cellId,
      "trackingAreaCode" to trackingAreaCode,
      "interfaceName" to interfaceName,
      "dnsServers" to dnsServers,
    )
  }

  private fun getBatteryDetails(): Map<String, Any?> {
    val ctx = applicationContext
    val bm = ctx.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
      ?: return mapOf("available" to false)

    val intentFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    val statusIntent = ctx.registerReceiver(null, intentFilter)

    val level = statusIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
    val scale = statusIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
    val percent = if (level >= 0 && scale > 0) (level * 100) / scale else null

    val statusCode = statusIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
    val plugCode = statusIntent?.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) ?: 0
    val healthCode = statusIntent?.getIntExtra(BatteryManager.EXTRA_HEALTH, -1) ?: -1
    val technology = statusIntent?.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY)
    val voltageMv = statusIntent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1) ?: -1
    val tempTenthsC = statusIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1) ?: -1

    val statusLabel = when (statusCode) {
      BatteryManager.BATTERY_STATUS_CHARGING -> "Charging"
      BatteryManager.BATTERY_STATUS_DISCHARGING -> "Discharging"
      BatteryManager.BATTERY_STATUS_FULL -> "Full"
      BatteryManager.BATTERY_STATUS_NOT_CHARGING -> "Not charging"
      else -> "Unknown"
    }

    val plugLabel = when (plugCode) {
      BatteryManager.BATTERY_PLUGGED_USB -> "USB"
      BatteryManager.BATTERY_PLUGGED_AC -> "AC"
      BatteryManager.BATTERY_PLUGGED_WIRELESS -> "Wireless"
      else -> "Battery"
    }

    val healthLabel = when (healthCode) {
      BatteryManager.BATTERY_HEALTH_GOOD -> "Good"
      BatteryManager.BATTERY_HEALTH_OVERHEAT -> "Overheat"
      BatteryManager.BATTERY_HEALTH_DEAD -> "Dead"
      BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> "Over voltage"
      BatteryManager.BATTERY_HEALTH_UNSPECIFIED_FAILURE -> "Failure"
      BatteryManager.BATTERY_HEALTH_COLD -> "Cold"
      else -> "Unknown"
    }

    val currentMicroA = try {
      bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW)
    } catch (_: Throwable) {
      Int.MIN_VALUE
    }
    val currentMa: Double? = if (currentMicroA == Int.MIN_VALUE) {
      null
    } else {
      currentMicroA / 1000.0
    }

    val chargeCounterUah = try {
      bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER)
    } catch (_: Throwable) {
      Int.MIN_VALUE
    }
    val chargeCounterMah: Double? = if (chargeCounterUah == Int.MIN_VALUE) {
      null
    } else {
      chargeCounterUah / 1000.0
    }

    val tempC: Double? = if (tempTenthsC > 0) tempTenthsC / 10.0 else null
    val voltageV: Double? = if (voltageMv > 0) voltageMv / 1000.0 else null

    val powerW: Double? = if (currentMa != null && voltageV != null) {
      (currentMa / 1000.0) * voltageV
    } else {
      null
    }

    // Rough estimate of full capacity based on charge counter and level.
    val estimatedFullCapacityMah: Double? = if (chargeCounterMah != null && percent != null && percent > 0) {
      chargeCounterMah * (100.0 / percent.toDouble())
    } else {
      null
    }

    return mapOf(
      "available" to true,
      "percent" to percent,
      "status" to statusLabel,
      "plugType" to plugLabel,
      "health" to healthLabel,
      "technology" to technology,
      "temperatureC" to tempC,
      "voltageV" to voltageV,
      "powerW" to powerW,
      "currentMa" to currentMa,
      "chargeCounterMah" to chargeCounterMah,
      "estimatedFullCapacityMah" to estimatedFullCapacityMah,
    )
  }
}
