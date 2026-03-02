import 'package:flutter/material.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:system_info2/system_info2.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:storage_space/storage_space.dart';
import 'dart:io';
import '../widgets/info_tile.dart';

class HardwarePage extends StatefulWidget {
  const HardwarePage({super.key});

  @override
  State<HardwarePage> createState() => _HardwarePageState();
}

class _HardwarePageState extends State<HardwarePage> {
  final DeviceInfoPlugin _deviceInfoPlugin = DeviceInfoPlugin();
  final Battery _battery = Battery();

  Future<Map<String, dynamic>> _getHardwareData() async {
    Map<String, dynamic> data = {};
    try {
      if (Platform.isAndroid) {
        AndroidDeviceInfo info = await _deviceInfoPlugin.androidInfo;
        data['android'] = info;
      }
      data['storage'] = await getStorageSpace(
        lowOnSpaceThreshold: 1024 * 1024 * 500,
        fractionDigits: 2,
      );
      data['battery'] = await _battery.batteryLevel;
    } catch (e) {
      debugPrint('Error loading hardware info: $e');
    }
    return data;
  }

  @override
  Widget build(BuildContext context) {
    const neon = Color(0xFFC6FF00);
    const surface = Color(0xFF1E1E1E);

    return FutureBuilder<Map<String, dynamic>>(
      future: _getHardwareData(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: neon));
        }

        final android = snapshot.data?['android'] as AndroidDeviceInfo?;
        final storage = snapshot.data?['storage'] as StorageSpace?;

        int totalMemMb = SysInfo.getTotalPhysicalMemory() ~/ (1024 * 1024);
        int freeMemMb = SysInfo.getFreePhysicalMemory() ~/ (1024 * 1024);
        int usedMemMb = totalMemMb - freeMemMb;
        double memPercent = totalMemMb > 0 ? usedMemMb / totalMemMb : 0;

        double usedStorage = double.tryParse(storage?.usedSize.toString() ?? '0') ?? 0;
        double totalStorage = double.tryParse(storage?.totalSize.toString() ?? '0') ?? 0;
        double storagePercent = totalStorage > 0 ? usedStorage / totalStorage : 0;

        return ListView(
          padding: const EdgeInsets.all(12),
          physics: const BouncingScrollPhysics(),
          children: [
            // Processor Section
            _buildDetailedCard(
              title: 'Processor',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: surface, borderRadius: BorderRadius.circular(8)),
                        child: const Icon(Icons.memory, color: Colors.redAccent, size: 32),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(android?.hardware.toUpperCase() ?? 'Qualcomm® Snapdragon™', 
                                style: const TextStyle(color: neon, fontWeight: FontWeight.bold, fontSize: 18)),
                            Text(android?.board ?? 'SM7435', style: const TextStyle(color: Colors.white70)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildTags(['4 nm', '${SysInfo.cores.length} cores', SysInfo.kernelArchitecture.name]),
                  const SizedBox(height: 16),
                  const Text('CPU Configuration', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  const SizedBox(height: 8),
                  _buildCpuConfigRow('4× Cortex-A55', '691-1958 MHz', Colors.green),
                  _buildCpuConfigRow('4× Cortex-A78', '691-2400 MHz', Colors.blue),
                  const SizedBox(height: 16),
                  _buildSimpleRow('Vendor', android?.manufacturer ?? 'Unknown'),
                  _buildSimpleRow('Hardware', android?.hardware ?? 'Unknown'),
                  _buildSimpleRow('Architecture', SysInfo.kernelArchitecture.name),
                  _buildSimpleRow('ABI', android?.supportedAbis.first ?? 'Unknown'),
                  _buildSimpleRow('Supported ABIs', android?.supportedAbis.join(', ') ?? 'Unknown'),
                  _buildSimpleRow('Governor', 'walt'),
                  const SizedBox(height: 16),
                  _buildAnalysisButton('CPU Analysis'),
                ],
              ),
            ),

            // GPU Section
            _buildDetailedCard(
              title: 'GPU',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.grid_view, color: neon, size: 40),
                      const SizedBox(width: 16),
                      Text(android?.display ?? 'Adreno 710', style: const TextStyle(color: neon, fontSize: 20, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildSimpleRow('Vendor', android?.brand ?? 'Unknown'),
                  _buildSimpleRow('Renderer', android?.model ?? 'Unknown'),
                ],
              ),
            ),

            // Graphics APIs
            _buildDetailedCard(
              title: 'Graphics APIs',
              child: Column(
                children: [
                  _buildSimpleRow('Vulkan API version', '1.1.128'),
                  _buildAnalysisButton('Vulkan Capabilities'),
                  const SizedBox(height: 16),
                  _buildSimpleRow('OpenGL', 'OpenGL ES 3.2 V@0615.98...'),
                  _buildAnalysisButton('OpenGL ES Capabilities'),
                ],
              ),
            ),

            // Memory Section
            _buildDetailedCard(
              title: 'Memory',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSimpleRow('RAM size', '${(totalMemMb/1024).toStringAsFixed(0)} GB'),
                  const SizedBox(height: 12),
                  _buildProgressRow('RAM', usedMemMb/1024, totalMemMb/1024, memPercent),
                  const SizedBox(height: 12),
                  _buildProgressRow('ZRAM', 2.16, 5.87, 0.36),
                ],
              ),
            ),

            // Storage Section
            _buildDetailedCard(
              title: 'Storage',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSimpleRow('Size', '${(totalStorage/(1024*1024*1024)).toStringAsFixed(0)} GB'),
                  _buildSimpleRow('Type', 'UFS'),
                  const SizedBox(height: 12),
                  _buildProgressRow('Storage', usedStorage/(1024*1024*1024), totalStorage/(1024*1024*1024), storagePercent),
                  const SizedBox(height: 16),
                  const Text('Internal storage', style: TextStyle(color: neon, fontWeight: FontWeight.bold, fontSize: 14)),
                  _buildSimpleRow('Filesystem', 'f2fs'),
                  _buildSimpleRow('Block size', '4 kB'),
                  const SizedBox(height: 12),
                  _buildProgressRow('/data', 47.06, 117, 0.40),
                  const SizedBox(height: 16),
                  _buildAnalysisButton('Disk partitions'),
                ],
              ),
            ),

            // Display Section
            _buildDetailedCard(
              title: 'Display',
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(Icons.screenshot_monitor, color: Colors.grey, size: 48),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${MediaQuery.of(context).size.width.toInt()} x ${MediaQuery.of(context).size.height.toInt()}',
                              style: const TextStyle(color: neon, fontSize: 22, fontWeight: FontWeight.bold)),
                          const Text('144 Hz • 395 ppi', style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildSimpleRow('Current resolution', '1080 x 2400 @ 120 Hz'),
                  _buildSimpleRow('Screen size (estimated)', '6.66 in / 169 mm'),
                  _buildSimpleRow('Supported refresh rates', '60 Hz, 90 Hz, 120 Hz, 144 Hz'),
                  _buildSimpleRow('Wide color gamut', 'Yes'),
                  _buildSimpleRow('HDR support', 'No'),
                ],
              ),
            ),

            // Bluetooth & Audio
            _buildDetailedCard(
              title: 'Bluetooth',
              child: _buildSimpleRow('Bluetooth support', 'SHOW'),
            ),

            _buildDetailedCard(
              title: 'Audio',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildCheckRow('Low latency audio', false),
                  _buildCheckRow('Pro audio support', false),
                  _buildCheckRow('MIDI support', true),
                  _buildCheckRow('Unprocessed audio source', true),
                  const SizedBox(height: 16),
                  const Text('Output', style: TextStyle(color: neon, fontSize: 12)),
                  _buildSimpleRow('Sample rate', '48 kHz'),
                  _buildSimpleRow('Buffer size', '192 Frames'),
                  _buildSimpleRow('Bit depth', '16-bit'),
                  _buildSimpleRow('Output routes', 'Speaker'),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDetailedCard({required String title, required Widget child}) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161616),
        borderRadius: BorderRadius.circular(12),
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

  Widget _buildTags(List<String> tags) {
    return Row(
      children: tags.map((t) => Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.white24),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(t, style: const TextStyle(color: Colors.white70, fontSize: 10)),
      )).toList(),
    );
  }

  Widget _buildCpuConfigRow(String label, String freq, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Row(
            children: List.generate(4, (i) => Container(
              width: 8, height: 8,
              margin: const EdgeInsets.only(right: 2),
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
            )),
          ),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
          const Spacer(),
          Text(freq, style: const TextStyle(color: Colors.white70, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildSimpleRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
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

  Widget _buildProgressRow(String label, double used, double total, double percent) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
            Text('${used.toStringAsFixed(2)} GB used / ${total.toStringAsFixed(2)} GB total', 
                style: const TextStyle(color: Colors.grey, fontSize: 11)),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: percent,
          backgroundColor: Colors.white10,
          color: const Color(0xFFC6FF00),
          minHeight: 10,
          borderRadius: BorderRadius.circular(5),
        ),
      ],
    );
  }

  Widget _buildAnalysisButton(String label) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 8),
      child: OutlinedButton(
        onPressed: () {},
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Colors.white10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.settings_outlined, size: 16, color: Colors.grey),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
            const Spacer(),
            const Icon(Icons.chevron_right, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}