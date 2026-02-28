import 'package:flutter/material.dart';
import 'package:system_info2/system_info2.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:storage_space/storage_space.dart';
import 'dart:async';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  late Timer _timer;
  final Battery _battery = Battery();
  
  int _batteryLevel = 0;
  BatteryState _batteryState = BatteryState.unknown;
  StorageSpace? _storage;
  
  int _totalMemory = 0;
  int _usedMemory = 0;
  double _memPercent = 0;

  @override
  void initState() {
    super.initState();
    _updateAllInfo();
    _timer = Timer.periodic(const Duration(seconds: 2), (timer) {
      _updateAllInfo();
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  Future<void> _updateAllInfo() async {
    final level = await _battery.batteryLevel;
    final state = await _battery.batteryState;
    
    // Fixed storage_space 1.2.0 compatibility
    final storage = await getStorageSpace(
      lowOnSpaceThreshold: 1024 * 1024 * 500, // 500MB
      fractionDigits: 2, // Required parameter in 1.2.0
    );

    if (!mounted) return;

    setState(() {
      _batteryLevel = level;
      _batteryState = state;
      _storage = storage;
      
      _totalMemory = SysInfo.getTotalPhysicalMemory() ~/ (1024 * 1024);
      _usedMemory = (SysInfo.getTotalPhysicalMemory() - SysInfo.getFreePhysicalMemory()) ~/ (1024 * 1024);
      _memPercent = _totalMemory > 0 ? _usedMemory / _totalMemory : 0.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    double usedStorageSize = 0;
    double totalStorageSize = 0;
    double storageUsagePercent = 0;

    if (_storage != null) {
      // In storage_space 1.2.0, these values are returned as Strings based on the error
      // or the package documentation has changed significantly.
      // Let's parse them safely.
      try {
        usedStorageSize = double.tryParse(_storage!.usedSize.toString()) ?? 0;
        totalStorageSize = double.tryParse(_storage!.totalSize.toString()) ?? 0;
        storageUsagePercent = totalStorageSize > 0 ? usedStorageSize / totalStorageSize : 0.0;
      } catch (e) {
        debugPrint("Error parsing storage values: $e");
      }
    }

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        _buildCPUStatusCard(),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _buildSimpleInfoCard('CPU: 40°C', Icons.thermostat, Colors.orange)),
            const SizedBox(width: 8),
            Expanded(child: _buildSimpleInfoCard('GPU: 39°C', Icons.thermostat_auto, Colors.orange)),
          ],
        ),
        const SizedBox(height: 8),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.5,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          children: [
            _buildGridCard(
              'Battery',
              '$_batteryLevel%',
              _batteryState.name.toUpperCase(),
              Icons.battery_charging_full,
              Colors.greenAccent,
            ),
            _buildGridCard(
              'Network',
              'Connected',
              'WiFi',
              Icons.network_check,
              Colors.blueAccent,
            ),
            _buildGridCard(
              'Apps',
              '101',
              '62 User | 39 System',
              Icons.apps,
              Colors.purpleAccent,
            ),
            _buildGridCard(
              'Display',
              '1080 x 2400',
              '144 Hz',
              Icons.smartphone,
              Colors.cyanAccent,
            ),
            _buildProgressGridCard(
              'RAM',
              '${(_usedMemory/1024).toStringAsFixed(2)} GB',
              '${(_totalMemory/1024).toStringAsFixed(2)} GB total',
              _memPercent,
              Colors.blue,
            ),
            _buildProgressGridCard(
              'Storage',
              '${(usedStorageSize / (1024*1024*1024)).toStringAsFixed(1)} GB',
              '${(totalStorageSize / (1024*1024*1024)).toStringAsFixed(0)} GB total',
              storageUsagePercent,
              Colors.green,
            ),
          ],
        ),
        const SizedBox(height: 12),
        _buildDeviceInfoCard(),
      ],
    );
  }

  Widget _buildCPUStatusCard() {
    return Card(
      child: Container(
        padding: const EdgeInsets.all(16),
        height: 160,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('CPU Status', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12)),
            const Expanded(
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Text('691 MHz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
                    Text('691 MHz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            ),
            Container(
              height: 40,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: CustomPaint(painter: WavePainter()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimpleInfoCard(String text, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Row(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 8),
            Text(text, style: const TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildGridCard(String title, String value, String sub, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
                Icon(Icons.more_vert, size: 14, color: Colors.grey[600]),
              ],
            ),
            const Spacer(),
            Row(
              children: [
                Icon(icon, size: 24, color: color),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(sub, style: TextStyle(color: Colors.grey[400], fontSize: 9)),
                  ],
                ),
              ],
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressGridCard(String title, String used, String total, double percent, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
            const Spacer(),
            Row(
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      height: 40,
                      width: 40,
                      child: CircularProgressIndicator(
                        value: percent,
                        strokeWidth: 4,
                        backgroundColor: Colors.grey[800],
                        valueColor: AlwaysStoppedAnimation<Color>(color),
                      ),
                    ),
                    Text('${(percent * 100).toInt()}%', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(used, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text(total, style: TextStyle(color: Colors.grey[400], fontSize: 9)),
                  ],
                ),
              ],
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }

  Widget _buildDeviceInfoCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle),
              child: const Icon(Icons.android, color: Colors.white, size: 30),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Motorola Edge 50 Fusion', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('Qualcomm® Snapdragon™ 7s Gen 2', style: TextStyle(fontSize: 12)),
                  Text('Android 15 (Vanilla Ice Cream)', style: TextStyle(fontSize: 12)),
                  SizedBox(height: 4),
                  Text('Uptime: 2h 44m 33s', style: TextStyle(color: Colors.grey, fontSize: 11)),
                ],
              ),
            ),
            Icon(Icons.more_vert, color: Colors.grey[600]),
          ],
        ),
      ),
    );
  }
}

class WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.green.withOpacity(0.5)
      ..style = PaintingStyle.fill;

    final path = Path();
    path.moveTo(0, size.height);
    path.lineTo(0, size.height * 0.8);
    path.quadraticBezierTo(size.width * 0.2, size.height * 0.4, size.width * 0.4, size.height * 0.7);
    path.quadraticBezierTo(size.width * 0.6, size.height * 0.9, size.width * 0.8, size.height * 0.5);
    path.lineTo(size.width, size.height * 0.6);
    path.lineTo(size.width, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
