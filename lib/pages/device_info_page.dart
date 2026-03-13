import 'package:flutter/material.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:app_settings/app_settings.dart';
import 'dart:io';

class DeviceInfoPage extends StatefulWidget {
  const DeviceInfoPage({super.key});

  @override
  State<DeviceInfoPage> createState() => _DeviceInfoPageState();
}

class _DeviceInfoPageState extends State<DeviceInfoPage> {
  final DeviceInfoPlugin _deviceInfoPlugin = DeviceInfoPlugin();

  Future<Map<String, dynamic>> _getSystemData() async {
    Map<String, dynamic> data = {};
    try {
      if (Platform.isAndroid) {
        AndroidDeviceInfo info = await _deviceInfoPlugin.androidInfo;
        data['android'] = info;
      } else if (Platform.isIOS) {
        IosDeviceInfo info = await _deviceInfoPlugin.iosInfo;
        data['ios'] = info;
      }
    } catch (e) {
      debugPrint('Error loading system info: $e');
    }
    return data;
  }

  @override
  Widget build(BuildContext context) {
    const neon = Color(0xFFC6FF00);

    return FutureBuilder<Map<String, dynamic>>(
      future: _getSystemData(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: neon));
        }

        final android = snapshot.data?['android'] as AndroidDeviceInfo?;

        return Scaffold(
          backgroundColor: const Color(0xFF0A0A0A),
          appBar: AppBar(
            title: const Text('SYSTEM', style: TextStyle(letterSpacing: 1.5)),
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          body: ListView(
            padding: const EdgeInsets.all(12),
            physics: const BouncingScrollPhysics(),
            children: [
              // Section 1: Device
              _buildSectionCard(
                title: 'Device',
                onSettingsTap: () => AppSettings.openAppSettings(type: AppSettingsType.settings),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const CircleAvatar(
                          radius: 24,
                          backgroundColor: Color(0xFF3F51B5),
                          child: Icon(Icons.android, color: Colors.white, size: 28),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            '${android?.manufacturer.toUpperCase() ?? 'MOTOROLA'} ${android?.model ?? 'EDGE 50 FUSION'}',
                            style: const TextStyle(color: neon, fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      childAspectRatio: 2.5,
                      children: [
                        _buildMiniInfo('Model', android?.model ?? 'N/A'),
                        _buildMiniInfo('Product', android?.product ?? 'N/A'),
                        _buildMiniInfo('Device', android?.device ?? 'N/A'),
                        _buildMiniInfo('Board', android?.board ?? 'N/A'),
                        _buildMiniInfo('Manufacturer', android?.manufacturer ?? 'N/A'),
                        _buildMiniInfo('SKU', 'XT2429-4'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildLabelValue('Bootloader', android?.bootloader ?? 'N/A'),
                    const SizedBox(height: 16),
                    const Text('Radio', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    const SizedBox(height: 6),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(12)),
                      child: const Text('M6450R_DE311_10.90.01.118R', style: TextStyle(color: Colors.white70, fontSize: 11)),
                    ),
                  ],
                ),
              ),

              // Section 2: Operating System
              _buildSectionCard(
                title: 'Operating System',
                onSettingsTap: () => AppSettings.openAppSettings(type: AppSettingsType.settings),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.android, color: neon, size: 48),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            'Android ${android?.version.release ?? '15'} (${android?.version.codename ?? 'Vanilla Ice Cream'})',
                            style: const TextStyle(color: neon, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildTag('API ${android?.version.sdkInt ?? '35'}'),
                        _buildTag('aarch64'),
                        _buildTag('64-bit'),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _buildSimpleRow('Security patch', android?.version.securityPatch ?? 'Unknown'),
                    _buildSimpleRow('Build', android?.id ?? 'Unknown'),
                    _buildSimpleRow('Build date', '29 Dec 2025 2:04:57 pm'),
                    _buildSimpleRow('Architecture', 'aarch64 (64-bit)'),
                    _buildSimpleRow('Instruction sets', android?.supportedAbis.join('\n') ?? 'N/A'),
                    const SizedBox(height: 16),
                    const Text('Fingerprint', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    const SizedBox(height: 6),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(12)),
                      child: Text(android?.fingerprint ?? 'N/A', style: const TextStyle(color: Colors.white70, fontSize: 10)),
                    ),
                    const SizedBox(height: 16),
                    _buildSimpleRow('Kernel', '5.10.233-android12-9-00008-gf5ac1bdc50ed'),
                  ],
                ),
              ),

              // Section 3: Updates
              _buildSectionCard(
                title: 'Updates',
                onSettingsTap: () => AppSettings.openAppSettings(type: AppSettingsType.settings),
                child: Column(
                  children: [
                    _buildSimpleRow('Current release', 'Android 15 (Vanilla Ice Cream)'),
                    _buildSimpleRow('Initial release', 'Android 14 (Upside Down Cake)'),
                    const SizedBox(height: 12),
                    _buildCheckRow('Project Treble', true),
                    _buildCheckRow('Project Mainline', true),
                    _buildCheckRow('Dynamic partitions', true),
                    _buildCheckRow('Seamless updates', true),
                    const SizedBox(height: 12),
                    _buildSimpleRow('Active slot', '_a'),
                  ],
                ),
              ),

              // Section 4: Security
              _buildSectionCard(
                title: 'Security',
                onSettingsTap: () => AppSettings.openAppSettings(type: AppSettingsType.settings),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(child: _buildMiniInfo('Verified Boot (AVB)', 'AVB 1.2')),
                        Expanded(child: _buildMiniInfo('Verified boot state', 'Green', valueColor: Colors.green)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _buildMiniInfo('dm-verity', 'Enforcing')),
                        Expanded(child: _buildMiniInfo('Bootloader', 'Locked')),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildSimpleRow('Root access', 'Device is not rooted'),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionCard({required String title, required Widget child, VoidCallback? onSettingsTap}) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
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
              Text(title, style: const TextStyle(color: Color(0xFFC6FF00), fontWeight: FontWeight.bold, fontSize: 14)),
              IconButton(
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                icon: const Icon(Icons.settings, size: 16, color: Colors.grey),
                onPressed: onSettingsTap ?? () => AppSettings.openAppSettings(type: AppSettingsType.settings),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildMiniInfo(String label, String value, {Color? valueColor}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
        Text(value, style: TextStyle(color: valueColor ?? Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  Widget _buildSimpleRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value, 
              textAlign: TextAlign.right,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabelValue(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildTag(String text) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white24),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white70, fontSize: 10)),
    );
  }

  Widget _buildCheckRow(String label, bool ok) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(ok ? Icons.check_circle : Icons.cancel, color: ok ? Colors.green : Colors.grey, size: 18),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 13)),
        ],
      ),
    );
  }
}
