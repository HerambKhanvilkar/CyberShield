import 'package:flutter/material.dart';
import 'package:system_info2/system_info2.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:storage_space/storage_space.dart';
import 'package:app_settings/app_settings.dart';
import 'package:installed_apps/installed_apps.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:camera/camera.dart';
import 'dart:async';
import 'dart:io';
import 'hardware_page.dart';
import 'device_info_page.dart';
import 'battery_page.dart';
import 'network_page.dart';
import 'apps_page.dart';
import 'camera_page.dart';
import 'sensors_page.dart';
import 'tests_page.dart';
import 'tools_page.dart';
import 'widgets_popup.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  late Timer _timer;
  final Battery _battery = Battery();
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  
  int _batteryLevel = 0;
  BatteryState _batteryState = BatteryState.unknown;
  StorageSpace? _storage;
  String _deviceName = 'Loading...';
  String _processorName = 'Loading...';
  String _androidVersion = 'Loading...';
  
  int _totalMemory = 0;
  int _usedMemory = 0;
  double _memPercent = 0;
  int _userAppsCount = 0;
  int _systemAppsCount = 0;
  int _cameraCount = 0;

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
    
    final storage = await getStorageSpace(
      lowOnSpaceThreshold: 1024 * 1024 * 500,
      fractionDigits: 2,
    );

    final userApps = await InstalledApps.getInstalledApps(false, false);
    final systemApps = await InstalledApps.getInstalledApps(true, false);
    final cameras = await availableCameras();

    if (!mounted) return;
    String deviceName = 'Unknown Device';
    String processor = 'Unknown Processor';
    String androidVersion = 'Unknown';

    if (Platform.isAndroid) {
      final info = await _deviceInfo.androidInfo;
      deviceName = '${info.manufacturer} ${info.model}';
      processor = info.hardware;
      androidVersion = 'Android ${info.version.release}';
    }

    setState(() {
      _batteryLevel = level;
      _batteryState = state;
      _deviceName = deviceName;
      _processorName = processor;
      _androidVersion = androidVersion;
      _storage = storage;
      _userAppsCount = userApps.length;
      _systemAppsCount = systemApps.length - _userAppsCount;
      _cameraCount = cameras.length;
      
      _totalMemory = SysInfo.getTotalPhysicalMemory() ~/ (1024 * 1024);
      _usedMemory = (SysInfo.getTotalPhysicalMemory() - SysInfo.getFreePhysicalMemory()) ~/ (1024 * 1024);
      _memPercent = _totalMemory > 0 ? _usedMemory / _totalMemory : 0.0;
    });
  }

  @override
  Widget build(BuildContext context) {
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
          childAspectRatio: 1.4,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          children: [
            _buildInteractiveCard(
              title: 'Battery',
              value: '$_batteryLevel%',
              sub: '${_batteryLevel > 30 ? "33°C" : "28°C"}\n${_batteryState.name.toUpperCase()}',
              icon: Icons.battery_charging_full,
              color: Colors.orangeAccent,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const BatteryPage())),
            ),
            _buildInteractiveCard(
              title: 'Network',
              value: 'Wi‑Fi',
              sub: '351 Mbps\n78% -61 dBm',
              icon: Icons.signal_cellular_alt,
              color: Colors.greenAccent,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const NetworkPage())),
            ),
            _buildInteractiveCard(
              title: 'Apps',
              value: '${_userAppsCount + _systemAppsCount}',
              sub: '$_userAppsCount User\n$_systemAppsCount System',
              icon: Icons.apps,
              color: Colors.greenAccent,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const AppsPage())),
            ),
            _buildInteractiveCard(
              title: 'Camera',
              value: '50 MP',
              sub: '$_cameraCount Cameras\nf/1.8 • OIS • Flash',
              icon: Icons.camera_alt_outlined,
              color: Colors.greenAccent,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const CameraPage())), 
            ),
            _buildProgressCard(
              title: 'Hardware',
              used: '${(_usedMemory/1024).toStringAsFixed(2)} GB used',
              total: '${(_totalMemory/1024).toStringAsFixed(2)} GB total',
              percent: _memPercent,
              color: Colors.greenAccent,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const HardwarePage())),
            ),
            _buildInteractiveCard(
              title: 'Sensors',
              value: 'Active',
              sub: 'Accelerometer\nGyro • Magnetometer',
              icon: Icons.sensors,
              color: Colors.greenAccent,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SensorsPage())),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _buildToolsRow(),
        const SizedBox(height: 12),
        _buildBottomInfoCard(),
      ],
    );
  }

  Widget _buildInteractiveCard({required String title, required String value, required String sub, required IconData icon, required Color color, required VoidCallback onTap}) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(title, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                  const Icon(Icons.more_vert, size: 14, color: Colors.grey),
                ],
              ),
              const Spacer(),
              Row(
                children: [
                  Icon(icon, size: 28, color: color),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFFC6FF00))),
                        Text(sub, style: const TextStyle(color: Colors.white, fontSize: 10), maxLines: 2),
                      ],
                    ),
                  ),
                ],
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProgressCard({required String title, required String used, required String total, required double percent, required Color color, required VoidCallback onTap}) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(title, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                  const Icon(Icons.more_vert, size: 14, color: Colors.grey),
                ],
              ),
              const Spacer(),
              Row(
                children: [
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        height: 40, width: 40,
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
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(used, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        Text(total, style: const TextStyle(color: Colors.grey, fontSize: 10)),
                      ],
                    ),
                  ),
                ],
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildToolsRow() {
    return Row(
      children: [
        _buildToolIcon(Icons.check_box_outlined, 'Tests', onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const TestsPage()))),
        const SizedBox(width: 8),
        _buildToolIcon(Icons.handyman_outlined, 'Tools', onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const ToolsPage()))),
        const SizedBox(width: 8),
        _buildToolIcon(Icons.widgets_outlined, 'Widgets', onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const WidgetsPopup()))),
      ],
    );
  }

  Widget _buildToolIcon(IconData icon, String label, {required VoidCallback onTap}) {
    return Expanded(
      child: Card(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              children: [
                Icon(icon, size: 20, color: const Color(0xFFC6FF00)),
                const SizedBox(height: 4),
                Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomInfoCard() {
    return Card(
      child: InkWell(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const DeviceInfoPage())),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              const CircleAvatar(
                backgroundColor: Colors.blue,
                child: Icon(Icons.android, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                 child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                   children: [ Text(_deviceName,style: const TextStyle(color: Color(0xFFC6FF00),
          fontWeight: FontWeight.bold,
          fontSize: 16,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      Text(
        _processorName,
        style: const TextStyle(fontSize: 12),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      Text(
        _androidVersion,
        style: const TextStyle(fontSize: 12),
      ),
      const SizedBox(height: 4),
      const Text(
        'Uptime: 4d 5h 54m 32s',
        style: TextStyle(color: Colors.grey, fontSize: 11),
      ),
    ],
  ),
),
              const Icon(Icons.more_vert, color: Colors.grey),
            ],
          ),
        ),
      ),
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
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('CPU Status', style: TextStyle(color: Color(0xFFC6FF00), fontWeight: FontWeight.bold, fontSize: 12)),
                Icon(Icons.more_vert, size: 14, color: Colors.grey),
              ],
            ),
            const Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Text('691 MHz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
                        Text('691 MHz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Text('1651 MHz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
                        Text('1651 MHz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            Container(
              height: 40,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFC6FF00).withValues(alpha: 0.1),
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
            Text(text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
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
      ..color = const Color(0xFFC6FF00).withValues(alpha: 0.5)
      ..style = PaintingStyle.fill;

    final path = Path();
    path.moveTo(0, size.height);
    path.lineTo(0, size.height * 0.8);
    path.quadraticBezierTo(size.width * 0.1, size.height * 0.3, size.width * 0.2, size.height * 0.6);
    path.quadraticBezierTo(size.width * 0.3, size.height * 0.9, size.width * 0.4, size.height * 0.4);
    path.quadraticBezierTo(size.width * 0.5, size.height * 0.2, size.width * 0.6, size.height * 0.7);
    path.quadraticBezierTo(size.width * 0.7, size.height * 0.9, size.width * 0.8, size.height * 0.5);
    path.lineTo(size.width, size.height * 0.6);
    path.lineTo(size.width, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
