import 'package:flutter/material.dart';

class ToolsPage extends StatelessWidget {
  const ToolsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildToolSection('DIAGNOSTIC TOOLS'),
        _buildToolTile(context, 'Root Checker', Icons.security, 'Check root access status'),
        _buildToolTile(context, 'SafetyNet Test', Icons.verified_user_outlined, 'Verify Play Integrity'),
        _buildToolTile(context, 'Bluetooth Scanner', Icons.bluetooth_searching, 'Analyze nearby devices'),
        
        const SizedBox(height: 24),
        _buildToolSection('NETWORK UTILITIES'),
        _buildToolTile(context, 'Wi-Fi Analyzer', Icons.wifi_find, 'Signal strength and channels'),
        _buildToolTile(context, 'Network Mapper', Icons.map_outlined, 'Map connected devices'),
        
        const SizedBox(height: 24),
        _buildToolSection('ADVANCED TOOLS'),
        _buildToolTile(context, 'Usage Stats', Icons.bar_chart, 'Detailed app usage timing'),
        _buildToolTile(context, 'GPS Tools', Icons.gps_fixed, 'Satellite and location data'),
      ],
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

  Widget _buildToolTile(BuildContext context, String title, IconData icon, String subtitle) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFFC6FF00)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Opening $title...')),
          );
        },
      ),
    );
  }
}
