import 'package:flutter/material.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:system_info2/system_info2.dart';
import 'dart:io';

class CpuAnalysisPage extends StatelessWidget {
  const CpuAnalysisPage({super.key});

  @override
  Widget build(BuildContext context) {
    const neon = Color(0xFFC6FF00);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        title: const Text('CPU ANALYSIS', style: TextStyle(letterSpacing: 1.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: FutureBuilder<AndroidDeviceInfo?>(
        future: Platform.isAndroid ? DeviceInfoPlugin().androidInfo : Future.value(null),
        builder: (context, snapshot) {
          final android = snapshot.data;
          final cores = SysInfo.cores;

          return ListView(
            padding: const EdgeInsets.all(16),
            physics: const BouncingScrollPhysics(),
            children: [
              _buildSectionCard(
                title: 'Processor',
                child: Column(
                  children: [
                    _buildRow('Hardware', android?.hardware ?? 'SM7435'),
                    _buildRow('Manufacturer', android?.manufacturer ?? 'Qualcomm'),
                    _buildRow('Marketing name', 'Snapdragon 7s Gen 2'),
                    _buildRow('Process', '4 nm'),
                    _buildRow('Cores', cores.length.toString()),
                    _buildRow('CPU', '4 x Cortex-A55\n4 x Cortex-A78'),
                    _buildRow('Frequencies', '691 MHz - 1958 MHz\n691 MHz - 2400 MHz'),
                    _buildRow('Architecture', SysInfo.kernelArchitecture.name),
                    _buildRow('ABI', android?.supportedAbis.first ?? 'arm64-v8a'),
                    _buildRow('Supported ABIs', android?.supportedAbis.join('\n') ?? 'N/A'),
                    _buildRow('Features', 'fp asimd evtstrm aes pmull shal sha2 crc32 atomics fphp asimdhp cpuid asimdrdm lrcpc dcpop asimddp'),
                    _buildRow('Governor', 'walt'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _buildSectionCard(
                title: 'Cluster 1',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: List.generate(4, (i) => _buildCoreDetail(i, 'Cortex-A55', '1958 MHz')),
                ),
              ),
              const SizedBox(height: 16),
              _buildSectionCard(
                title: 'Cluster 2',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: List.generate(4, (i) => _buildCoreDetail(i + 4, 'Cortex-A78', '2400 MHz')),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSectionCard({required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161616),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Color(0xFFC6FF00), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
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

  Widget _buildCoreDetail(int index, String type, String maxFreq) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('CPU$index', style: const TextStyle(color: Color(0xFFC6FF00), fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(height: 8),
          _buildRow('Type', type),
          _buildRow('Vendor', 'ARM'),
          _buildRow('Cluster', index < 4 ? '[0, 1, 2, 3]' : '[4, 5, 6, 7]'),
          _buildRow('Max frequency', maxFreq),
          _buildRow('Min frequency', '691 MHz'),
          _buildRow('Governor', 'walt'),
        ],
      ),
    );
  }
}
