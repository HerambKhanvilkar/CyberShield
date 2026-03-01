import 'package:flutter/material.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:io';

class ToolsPage extends StatefulWidget {
  const ToolsPage({super.key});

  @override
  State<ToolsPage> createState() => _ToolsPageState();
}

class _ToolsPageState extends State<ToolsPage> {
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();

  Future<void> _checkRoot() async {
    bool isRooted = false;
    // Basic check for common root paths
    final paths = [
      '/system/app/Superuser.apk',
      '/sbin/su',
      '/system/bin/su',
      '/system/xbin/su',
      '/data/local/xbin/su',
      '/data/local/bin/su',
      '/system/sd/xbin/su',
      '/system/bin/failsafe/su',
      '/data/local/su'
    ];
    
    for (String path in paths) {
      if (File(path).existsSync()) {
        isRooted = true;
        break;
      }
    }

    _showResult('Root Check', isRooted ? 'Device is rooted' : 'Device is not rooted');
  }

  Future<void> _checkPermissions() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.camera,
      Permission.location,
      Permission.microphone,
      Permission.storage,
    ].request();
    
    String result = statuses.entries
        .map((e) => '${e.key.toString().split('.').last}: ${e.value.name}')
        .join('\n');
    _showResult('Permissions Summary', result);
  }

  void _showResult(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        title: Text(title, style: const TextStyle(color: Color(0xFFC6FF00))),
        content: Text(message, style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: Color(0xFFC6FF00))),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('TOOLS'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildToolSection('DIAGNOSTIC TOOLS'),
          _buildToolTile(context, 'Root Checker', Icons.security, 'Check root access status', _checkRoot),
          _buildToolTile(context, 'Permissions Explorer', Icons.verified_user_outlined, 'Scan app permissions', _checkPermissions),
          
          const SizedBox(height: 24),
          _buildToolSection('NETWORK UTILITIES'),
          _buildToolTile(context, 'Connection Type', Icons.wifi, 'Check active network', () async {
            var result = await Connectivity().checkConnectivity();
            _showResult('Network', 'Connected via ${result.toString().split('.').last}');
          }),
          
          const SizedBox(height: 24),
          _buildToolSection('ADVANCED TOOLS'),
          _buildToolTile(context, 'Device ID', Icons.fingerprint, 'Show unique hardware ID', () async {
            if (Platform.isAndroid) {
              var info = await _deviceInfo.androidInfo;
              _showResult('Hardware ID', info.id);
            }
          }),
        ],
      ),
    );
  }

  Widget _buildToolSection(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      child: Text(
        title,
        style: const TextStyle(
          color: Color(0xFFC6FF00),
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildToolTile(BuildContext context, String title, IconData icon, String subtitle, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFFC6FF00)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }
}
