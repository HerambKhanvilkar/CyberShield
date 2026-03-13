import 'dart:async';
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:android_intent_plus/android_intent.dart';
import 'package:android_intent_plus/flag.dart';
import 'package:app_settings/app_settings.dart';

import '../services/native_network_service.dart';

class BatteryPage extends StatefulWidget {
  const BatteryPage({super.key});

  @override
  State<BatteryPage> createState() => _BatteryPageState();
}

class _BatteryPageState extends State<BatteryPage>
    with SingleTickerProviderStateMixin {
  final Battery _battery = Battery();
  final NativeNetworkService _native = NativeNetworkService();

  int _batteryLevel = 0;
  BatteryState _batteryState = BatteryState.unknown;
  Map<String, dynamic>? _batteryDetails;

  Timer? _pollTimer;
  late final AnimationController _waveController;

  @override
  void initState() {
    super.initState();

    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();

    _initBatteryInfo();

    _battery.onBatteryStateChanged.listen((state) {
      if (!mounted) return;
      setState(() => _batteryState = state);
    });
    _pollTimer = Timer.periodic(
        const Duration(seconds: 1), (_) => _refreshBatteryDetails());

    unawaited(_refreshBatteryDetails());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _waveController.dispose();
    super.dispose();
  }

  Future<void> _initBatteryInfo() async {
    final level = await _battery.batteryLevel;
    final state = await _battery.batteryState;

    if (!mounted) return;

    setState(() {
      _batteryLevel = level;
      _batteryState = state;
    });
  }

  Future<void> _refreshBatteryDetails() async {
    final details = await _native.getBatteryDetails();
    if (!mounted) return;

    setState(() {
      _batteryDetails = details;
      final percent = details?['percent'];
      if (percent is num) {
        _batteryLevel = percent.round();
      }
    });
  }

  Future<void> _openBatterySettings() async {
    if (!Platform.isAndroid) return;

    const actions = [
      'android.settings.BATTERY_USAGE_SUMMARY',
      'android.settings.POWER_USAGE_SUMMARY',
      'android.settings.BATTERY_SAVER_SETTINGS',
      'android.settings.BATTERY_SETTINGS',
    ];

    for (final action in actions) {
      try {
        await AndroidIntent(
          action: action,
          flags: <int>[Flag.FLAG_ACTIVITY_NEW_TASK],
        ).launch();
        return;
      } catch (_) {}
    }

    await AppSettings.openAppSettings();
  }

  String _statusLine() {
    final nativeStatus = _batteryDetails?['status'] as String?;
    final plug = _batteryDetails?['plugType'] as String?;

    if (nativeStatus == null) {
      return _batteryState.toString().split('.').last;
    }

    if (plug != null && plug != 'Battery') {
      return '$nativeStatus $plug';
    }

    return nativeStatus;
  }

  double? _tempC() => (_batteryDetails?['temperatureC'] as num?)?.toDouble();
  double? _voltageV() => (_batteryDetails?['voltageV'] as num?)?.toDouble();
  double? _powerW() => (_batteryDetails?['powerW'] as num?)?.toDouble();
  double? _currentMa() => (_batteryDetails?['currentMa'] as num?)?.toDouble();

  @override
  Widget build(BuildContext context) {
    const neonGreen = Color(0xFFC6FF00);
    const surface = Color(0xFF161616);

    final temp = _tempC();
    final volt = _voltageV();
    final power = _powerW();
    final current = _currentMa();

    final tempLabel = temp != null ? '${temp.toStringAsFixed(1)}°C' : '—';
    final voltLabel = volt != null ? '${volt.toStringAsFixed(3)} V' : '—';
    final powerLabel = volt != null && current != null ? '${((volt * current.abs()) / 1000).toStringAsFixed(1)} W' : '—';
    final currentLabel = current != null ? '${current.round().abs()} mA' : '—';

    final tech = (_batteryDetails?['technology'] as String?) ?? 'Unknown';
    final health = (_batteryDetails?['health'] as String?) ?? 'Unknown';

    final batterySaver = _batteryDetails?['batterySaver'] as bool?;
    final batteryProtection = _batteryDetails?['batteryProtection'] as bool?;

    final saverLabel = batterySaver == null
        ? 'Unknown'
        : batterySaver
            ? 'Enabled'
            : 'Disabled';

    final protectionLabel = batteryProtection == null
        ? 'Unavailable'
        : batteryProtection
            ? 'Enabled'
            : 'Disabled';

    final chargeCounterMah =
        (_batteryDetails?['chargeCounterMah'] as num?)?.toDouble();
    final estimatedFullMah =
        (_batteryDetails?['estimatedFullCapacityMah'] as num?)?.toDouble();

    final designCapacityLabel =
        estimatedFullMah != null ? '${estimatedFullMah.round()} mAh' : 'Unknown';

    final estimatedCapacityLabel = estimatedFullMah != null
        ? '${estimatedFullMah.round()} mAh'
        : 'Learning...';

    final chargeCounterLabel =
        chargeCounterMah != null ? '${chargeCounterMah.round()} mAh' : 'Unknown';

    String etaText = 'Calculating...';
    String rateText = '-- %/h';

    final statusNative = _batteryDetails?['status'] as String?;
    final isCharging = statusNative == 'Charging';
    
    if (estimatedFullMah != null && chargeCounterMah != null && current != null && current != 0) {
      final ratePerHour = (current.abs() / estimatedFullMah) * 100;
      rateText = '${ratePerHour.toStringAsFixed(1)} %/h';

      if (isCharging && current > 0) {
        final remainingMah = (estimatedFullMah - chargeCounterMah).clamp(0.0, estimatedFullMah);
        final hours = remainingMah / current;
        if (hours > 0 && hours < 48) {
          final totalMinutes = (hours * 60).round();
          final h = totalMinutes ~/ 60;
          final m = totalMinutes % 60;
          etaText = h > 0 ? '${h}h ${m}m' : '${m}m';
        }
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        title: const Text('BATTERY', style: TextStyle(letterSpacing: 1.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        physics: const BouncingScrollPhysics(),
        children: [
          // Main Status Card
          _buildDetailedCard(
            title: 'Status',
            onSettingsTap: _openBatterySettings,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$_batteryLevel%',
                      style: const TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: neonGreen,
                      ),
                    ),
                    const SizedBox(width: 24),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _statusLine(),
                            style: const TextStyle(
                                color: neonGreen,
                                fontWeight: FontWeight.bold,
                                fontSize: 16),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            etaText,
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 14),
                          ),
                          const Text(
                            'Time until full',
                            style: TextStyle(color: Colors.grey, fontSize: 11),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            rateText,
                            style: const TextStyle(color: Colors.grey, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildMiniMetric(tempLabel, 'Temperature'),
                    _buildMiniMetric(voltLabel, 'Voltage'),
                    _buildMiniMetric(powerLabel, 'Power'),
                  ],
                ),
                const SizedBox(height: 24),
                const Text('Current',
                    style: TextStyle(color: Colors.grey, fontSize: 12)),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SizedBox(),
                    Text(currentLabel,
                        style: const TextStyle(
                            color: neonGreen,
                            fontWeight: FontWeight.bold,
                            fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 40,
                  width: double.infinity,
                  child: AnimatedBuilder(
                    animation: _waveController,
                    builder: (context, child) {
                      return CustomPaint(
                        painter: _BatteryWavePainter(
                          phase: _waveController.value,
                          intensity: 0.5,
                          color: neonGreen,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Info Card
          _buildDetailedCard(
            title: 'Info',
            child: GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              childAspectRatio: 2.5,
              children: [
                _buildLabelValue('Technology', tech),
                _buildLabelValue('Health', health),
                _buildLabelValue('Battery protection', protectionLabel),
                _buildLabelValue('Battery saver', saverLabel),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Capacity Card
          _buildDetailedCard(
            title: 'Capacity & health',
            child: GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              childAspectRatio: 2.5,
              children: [
                _buildLabelValue('Design capacity', designCapacityLabel),
                _buildLabelValue('Capacity (estimated)', estimatedCapacityLabel),
                _buildLabelValue('Charge counter', chargeCounterLabel),
                _buildLabelValue('Charge cycles', 'N/A'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailedCard(
      {required String title, required Widget child, VoidCallback? onSettingsTap}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161616),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title,
                  style: const TextStyle(
                      color: Color(0xFFC6FF00),
                      fontWeight: FontWeight.bold,
                      fontSize: 14)),
              if (onSettingsTap != null)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(Icons.settings, size: 18, color: Colors.grey),
                  onPressed: onSettingsTap,
                ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildMiniMetric(String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
      ],
    );
  }

  Widget _buildLabelValue(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
        const SizedBox(height: 2),
        Text(value,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }
}

class _BatteryWavePainter extends CustomPainter {
  final double phase;
  final double intensity;
  final Color color;

  _BatteryWavePainter({
    required this.phase,
    required this.intensity,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final path = Path();
    final midY = size.height * 0.5;
    final amp = size.height * 0.3 * intensity;

    for (double x = 0; x <= size.width; x += 2) {
      final t = (x / size.width * 2 * math.pi) + phase * 2 * math.pi;
      final y = midY - amp * math.sin(t);

      if (x == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _BatteryWavePainter oldDelegate) {
    return oldDelegate.phase != phase ||
        oldDelegate.intensity != intensity ||
        oldDelegate.color != color;
  }
}
