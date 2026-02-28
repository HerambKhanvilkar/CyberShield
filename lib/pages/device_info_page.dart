import 'package:flutter/material.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:io';
import '../widgets/info_tile.dart';

class DeviceInfoPage extends StatefulWidget {
  const DeviceInfoPage({super.key});

  @override
  State<DeviceInfoPage> createState() => _DeviceInfoPageState();
}

class _DeviceInfoPageState extends State<DeviceInfoPage> {
  final DeviceInfoPlugin _deviceInfoPlugin = DeviceInfoPlugin();

  Future<Map<String, String>> _getSystemInfo() async {
    Map<String, String> systemInfo = {};
    try {
      if (Platform.isAndroid) {
        AndroidDeviceInfo androidInfo = await _deviceInfoPlugin.androidInfo;
        systemInfo = {
          'Model': androidInfo.model,
          'Manufacturer': androidInfo.manufacturer,
          'Brand': androidInfo.brand,
          'Android Version': androidInfo.version.release,
          'SDK Level': androidInfo.version.sdkInt.toString(),
          'Security Patch': androidInfo.version.securityPatch ?? 'Unknown',
          'Build ID': androidInfo.id,
          'Hardware': androidInfo.hardware,
          'Board': androidInfo.board,
          'Display': androidInfo.display,
        };
      } else if (Platform.isIOS) {
        IosDeviceInfo iosInfo = await _deviceInfoPlugin.iosInfo;
        systemInfo = {
          'Model': iosInfo.model,
          'System Name': iosInfo.systemName,
          'System Version': iosInfo.systemVersion,
          'Name': iosInfo.name,
          'Localized Model': iosInfo.localizedModel,
        };
      }
    } catch (e) {
      systemInfo = {'Error': 'Failed to load system info: $e'};
    }
    return systemInfo;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, String>>(
      future: _getSystemInfo(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(color: Color(0xFFC6FF00)),
          );
        }

        if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(
            child: Text('Unable to retrieve system data'),
          );
        }

        final data = snapshot.data!;
        
        return ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          physics: const BouncingScrollPhysics(),
          children: [
            const InfoHeader(title: 'SYSTEM'),
            ...data.entries.map((e) => InfoTile(label: e.key, value: e.value)),
          ],
        );
      },
    );
  }
}
