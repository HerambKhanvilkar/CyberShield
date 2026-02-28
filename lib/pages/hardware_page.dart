import 'package:flutter/material.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:io';
import '../widgets/info_tile.dart';

class HardwarePage extends StatefulWidget {
  const HardwarePage({super.key});

  @override
  State<HardwarePage> createState() => _HardwarePageState();
}

class _HardwarePageState extends State<HardwarePage> {
  late Future<Map<String, String>> _hardwareDetailsFuture;

  @override
  void initState() {
    super.initState();
    _hardwareDetailsFuture = _fetchHardwareDetails();
  }

  Future<Map<String, String>> _fetchHardwareDetails() async {
    final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    Map<String, String> details = {};

    try {
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        details = {
          'Processor': androidInfo.hardware ?? 'N/A',
          'Board': androidInfo.board ?? 'N/A',
          'Product': androidInfo.product ?? 'N/A',
          'Device': androidInfo.device ?? 'N/A',
        };
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        details = {
          'Model': iosInfo.model,
          'Name': iosInfo.name,
        };
      }
    } catch (e) {
      details['Error'] = 'Failed to access hardware data.';
    }

    if (details.isEmpty) {
      details['Status'] = 'Hardware info not available for this platform.';
    }

    return details;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, String>>(
      future: _hardwareDetailsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: Color(0xFFC6FF00)));
        }

        if (snapshot.hasError) {
          return const Center(child: Text('Critical Hardware Error', style: TextStyle(color: Colors.redAccent)));
        }

        final data = snapshot.data ?? {};

        return ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          physics: const BouncingScrollPhysics(),
          children: [
            const InfoHeader(title: 'PROCESSOR & BOARD'),
            ...data.entries.map((e) => InfoTile(label: e.key, value: e.value)),
            const SizedBox(height: 16),
            const InfoHeader(title: 'DISPLAY'),
            InfoTile(
              label: 'Screen Resolution',
              value: '${MediaQuery.of(context).size.width.toInt()} x ${MediaQuery.of(context).size.height.toInt()}',
            ),
            InfoTile(
              label: 'Screen Density',
              value: '${MediaQuery.of(context).devicePixelRatio.toStringAsFixed(2)}x',
            ),
          ],
        );
      },
    );
  }
}
