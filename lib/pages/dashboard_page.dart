import 'package:flutter/material.dart';
import 'package:system_info2/system_info2.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:storage_space/storage_space.dart';
import 'package:app_settings/app_settings.dart';
import 'package:installed_apps/installed_apps.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:async';
import 'dart:io';
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
      
      _totalMemory = SysInfo.getTotalPhysicalMemory() ~/ (1024 * 1024);
      _usedMemory = (SysInfo.getTotalPhysicalMemory() - SysInfo.getFreePhysicalMemory()) ~/ (1024 * 1024);
      _memPercent = _totalMemory > 0 ? _usedMemory / _totalMemory : 0.0;
    });
  }

  void _showInfoPopup(String title, List<Map<String, String>> info, {VoidCallback? onSettings, Widget? customAction}) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(
              _getIconForTitle(title),
              color: const Color(0xFFC6FF00),
            ),
            const SizedBox(width: 12),
            Text(title, style: const TextStyle(color: Color(0xFFC6FF00))),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Divider(color: Colors.white24),
            ...info.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(item['label']!, style: const TextStyle(color: Colors.grey)),
                  Expanded(
                    child: Text(
                      item['value']!, 
                      textAlign: TextAlign.right,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            )).toList(),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL', style: TextStyle(color: Colors.grey)),
          ),
          if (customAction != null) customAction,
          if (customAction == null)
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                if (onSettings != null) {
                  onSettings();
                } else {
                  AppSettings.openAppSettings();
                }
              },
              child: const Text('SETTINGS', style: TextStyle(color: Color(0xFFC6FF00))),
            ),
        ],
      ),
    );
  }

  IconData _getIconForTitle(String title) {
    if (title == 'Battery') return Icons.battery_charging_full;
    if (title == 'Network') return Icons.network_check;
    if (title == 'RAM') return Icons.memory;
    if (title == 'Apps') return Icons.apps;
    if (title == 'Operating System') return Icons.android;
    if (title == 'Tests') return Icons.check_box_outlined;
    if (title == 'Tools') return Icons.handyman_outlined;
    if (title == 'Widgets') return Icons.widgets_outlined;
    return Icons.storage;
  }

  Future<void> _showOsPopup() async {
    Map<String, String> osInfo = {};
    if (Platform.isAndroid) {
      final info = await _deviceInfo.androidInfo;
      osInfo = {
        'Android Version': '${info.version.release} (${info.version.codename})',
        'Security patch': info.version.securityPatch ?? 'Unknown',
        'Build': info.id,
        'Kernel': '5.10.233-android12-9-00008-gf5...',
        'Architecture': SysInfo.kernelArchitecture.name,
        'Instruction sets': info.supportedAbis.join(', '),
      };
    }

    _showInfoPopup('Operating System', osInfo.entries.map((e) => {'label': e.key, 'value': e.value}).toList());
  }

  void _showTestsPopup() {
    _showInfoPopup(
      'Tests', 
      [
        {'label': 'Flashlight', 'value': 'Interactive'},
        {'label': 'Vibration', 'value': 'Interactive'},
        {'label': 'Multi-touch', 'value': 'Interactive'},
        {'label': 'Biometrics', 'value': 'System'},
      ], 
      customAction: TextButton(
        onPressed: () {
          Navigator.pop(context);
          Navigator.push(context, MaterialPageRoute(builder: (context) => const TestsPage()));
        },
        child: const Text('OPEN TESTS', style: TextStyle(color: Color(0xFFC6FF00))),
      ),
    );
  }

  void _showToolsPopup() {
    _showInfoPopup(
      'Tools', 
      [
        {'label': 'Root Checker', 'value': 'Ready'},
        {'label': 'SafetyNet', 'value': 'Ready'},
        {'label': 'Wi-Fi Analyzer', 'value': 'Ready'},
        {'label': 'GPS Tools', 'value': 'Ready'},
      ], 
      customAction: TextButton(
        onPressed: () {
          Navigator.pop(context);
          Navigator.push(context, MaterialPageRoute(builder: (context) => const ToolsPage()));
        },
        child: const Text('OPEN TOOLS', style: TextStyle(color: Color(0xFFC6FF00))),
      ),
    );
  }

  void _showWidgetsPopup() {
    Navigator.push(context, MaterialPageRoute(builder: (context) => const WidgetsPopup()));
  }

  @override
  Widget build(BuildContext context) {
    double usedStorageSize = 0;
    double totalStorageSize = 0;
    double storageUsagePercent = 0;

    if (_storage != null) {
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
              onTap: () => _showInfoPopup('Battery', [
                {'label': 'Battery level', 'value': '$_batteryLevel%'},
                {'label': 'Temperature', 'value': '33°C'},
                {'label': 'Status', 'value': _batteryState.name.toUpperCase()},
                {'label': 'Technology', 'value': 'Li-ion'},
                {'label': 'Health', 'value': 'Good'},
                {'label': 'Voltage', 'value': '3.717 V'},
                {'label': 'Design capacity', 'value': '4529 mAh'},
              ], onSettings: () => AppSettings.openAppSettings(type: AppSettingsType.batteryOptimization)),
            ),
            _buildInteractiveCard(
              title: 'Network',
              value: 'Wi‑Fi',
              sub: '351 Mbps\n78% -61 dBm',
              icon: Icons.signal_cellular_alt,
              color: Colors.greenAccent,
              onTap: () => _showInfoPopup('Network', [
                {'label': 'Status', 'value': 'Connected'},
                {'label': 'Type', 'value': 'WiFi'},
                {'label': 'SSID', 'value': 'Cyber_Home'},
                {'label': 'IP Address', 'value': '192.168.1.10'},
              ], onSettings: () => AppSettings.openAppSettings(type: AppSettingsType.wifi)),
            ),
            _buildInteractiveCard(
              title: 'Apps',
              value: '${_userAppsCount + _systemAppsCount}',
              sub: '$_userAppsCount User\n$_systemAppsCount System',
              icon: Icons.apps,
              color: Colors.greenAccent,
              onTap: () => _showInfoPopup('Apps', [
                {'label': 'Total Apps', 'value': '${_userAppsCount + _systemAppsCount}'},
                {'label': 'User Apps', 'value': '$_userAppsCount'},
                {'label': 'System Apps', 'value': '$_systemAppsCount'},
              ], onSettings: () => AppSettings.openAppSettings(type: AppSettingsType.settings)),
            ),
            _buildInteractiveCard(
              title: 'Display',
              value: 'Adreno (TM) 710',
              sub: '${MediaQuery.of(context).size.width.toInt()} x ${MediaQuery.of(context).size.height.toInt()} 120Hz',
              icon: Icons.smartphone,
              color: Colors.greenAccent,
              onTap: () => _showInfoPopup('Display', [
                {'label': 'Resolution', 'value': '${MediaQuery.of(context).size.width.toInt()} x ${MediaQuery.of(context).size.height.toInt()}'},
                {'label': 'Density', 'value': '${MediaQuery.of(context).devicePixelRatio.toStringAsFixed(1)}x'},
                {'label': 'Refresh Rate', 'value': '120Hz'},
              ], onSettings: () => AppSettings.openAppSettings(type: AppSettingsType.display)),
            ),
            _buildProgressCard(
              title: 'RAM',
              used: '${(_usedMemory/1024).toStringAsFixed(2)} GB used',
              total: '${(_totalMemory/1024).toStringAsFixed(2)} GB total',
              percent: _memPercent,
              color: Colors.greenAccent,
              onTap: () => _showInfoPopup('RAM', [
                {'label': 'Used', 'value': '${(_usedMemory/1024).toStringAsFixed(2)} GB'},
                {'label': 'Total', 'value': '${(_totalMemory/1024).toStringAsFixed(2)} GB'},
                {'label': 'Free', 'value': '${((_totalMemory - _usedMemory)/1024).toStringAsFixed(2)} GB'},
              ]),
            ),
            _buildProgressCard(
              title: 'Storage',
              used: '${(usedStorageSize / (1024*1024*1024)).toStringAsFixed(2)} GB used',
              total: '${(totalStorageSize / (1024*1024*1024)).toStringAsFixed(0)} GB total',
              percent: storageUsagePercent,
              color: Colors.greenAccent,
              onTap: () => _showInfoPopup('Storage', [
                {'label': 'Used', 'value': '${(usedStorageSize / (1024*1024*1024)).toStringAsFixed(1)} GB'},
                {'label': 'Total', 'value': '${(totalStorageSize / (1024*1024*1024)).toStringAsFixed(0)} GB total'},
                {'label': 'Percent', 'value': '${(storageUsagePercent * 100).toInt()}%'},
              ], onSettings: () => AppSettings.openAppSettings(type: AppSettingsType.internalStorage)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Quick tools buttons
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
        _buildToolIcon(Icons.check_box_outlined, 'Tests', onTap: _showTestsPopup),
        const SizedBox(width: 8),
        _buildToolIcon(Icons.handyman_outlined, 'Tools', onTap: _showToolsPopup),
        const SizedBox(width: 8),
        _buildToolIcon(Icons.widgets_outlined, 'Widgets', onTap: _showWidgetsPopup),
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
        onTap: _showOsPopup,
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