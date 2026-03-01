import 'package:flutter/material.dart';

class WidgetsPopup extends StatelessWidget {
  const WidgetsPopup({super.key});

  @override
  Widget build(BuildContext context) {
    const neon = Color(0xFFC6FF00);
    const surface = Color(0xFF1E1E1E);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        title: const Text('Widgets BETA', style: TextStyle(fontSize: 18)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: neon, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text(
              'Widgets require Cyber Shield Pro',
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 32),
            
            // Storage Widget Preview
            _buildWidgetPreview(
              label: 'Storage',
              percent: '75%',
              child: Container(
                height: 10,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white10,
                  borderRadius: BorderRadius.circular(5),
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: 0.75,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.cyanAccent,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                ),
              ),
            ),
            
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16.0),
              child: Text(
                'Show battery, temperature, RAM, ZRAM, storage or SD card usage',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ),

            // Battery Widget Preview
            Container(
              width: 160,
              height: 180,
              decoration: BoxDecoration(
                color: surface,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 12.0),
                    child: Text('My Device', style: TextStyle(color: Colors.white, fontSize: 12)),
                  ),
                  const Text('~2 hours', style: TextStyle(color: Colors.grey, fontSize: 10)),
                  const Spacer(),
                  Container(
                    height: 100,
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: Colors.cyanAccent,
                      borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(24),
                        bottomRight: Radius.circular(24),
                      ),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      '75%',
                      style: TextStyle(color: Color(0xFF121212), fontSize: 32, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
            
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16.0),
              child: Text('Show battery usage details', style: TextStyle(color: Colors.grey, fontSize: 12)),
            ),

            // Large Info Widget Preview
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: surface,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Tue, Jul 1', style: TextStyle(color: Colors.white, fontSize: 12)),
                      Icon(Icons.refresh, color: Colors.grey, size: 16),
                    ],
                  ),
                  const Text('9:55', style: TextStyle(color: Colors.cyanAccent, fontSize: 48, fontWeight: FontWeight.bold)),
                  Row(
                    children: [
                      const Icon(Icons.smartphone, color: Colors.white, size: 40),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('My Device', style: TextStyle(color: neon, fontWeight: FontWeight.bold)),
                          const Text('Ultra 1000X', style: TextStyle(color: Colors.white, fontSize: 12)),
                          Text('Uptime: 3d 4h 12m', style: TextStyle(color: Colors.cyanAccent.withValues(alpha: 0.7), fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildMiniProgress('RAM', 0.75, '75%'),
                  const SizedBox(height: 12),
                  _buildMiniProgress('Storage', 0.5, '50%'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWidgetPreview({required String label, required String percent, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(color: Colors.white, fontSize: 14)),
              Text(percent, style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }

  Widget _buildMiniProgress(String label, double val, String percent) {
    return Row(
      children: [
        SizedBox(width: 60, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10))),
        Expanded(
          child: LinearProgressIndicator(
            value: val,
            backgroundColor: Colors.white10,
            color: Colors.cyanAccent,
            minHeight: 6,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 12),
        Text(percent, style: const TextStyle(color: Colors.cyanAccent, fontSize: 10)),
      ],
    );
  }
}
