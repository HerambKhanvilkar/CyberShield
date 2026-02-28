import 'package:flutter/material.dart';

class TestsPage extends StatelessWidget {
  const TestsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildTestSection('DISPLAY & SENSORS'),
        _buildTestTile(context, 'Flashlight', Icons.flashlight_on, 'Test camera flash'),
        _buildTestTile(context, 'Vibration', Icons.vibration, 'Test vibration motor'),
        _buildTestTile(context, 'Dead Pixels', Icons.palette_outlined, 'Check display colors'),
        _buildTestTile(context, 'Multi-touch', Icons.touch_app, 'Test digitizer accuracy'),
        
        const SizedBox(height: 24),
        _buildTestSection('AUDIO & BIOMETRICS'),
        _buildTestTile(context, 'Speakers', Icons.volume_up, 'Test main speakers'),
        _buildTestTile(context, 'Microphone', Icons.mic, 'Record and play back'),
        _buildTestTile(context, 'Biometrics', Icons.fingerprint, 'Test sensor loops'),
      ],
    );
  }

  Widget _buildTestSection(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      child: Text(title, style: const TextStyle(color: Color(0xFFC6FF00), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
    );
  }

  Widget _buildTestTile(BuildContext context, String title, IconData icon, String subtitle) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFFC6FF00)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        trailing: const Icon(Icons.play_arrow_outlined, size: 20),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Starting $title test...')),
          );
        },
      ),
    );
  }
}
