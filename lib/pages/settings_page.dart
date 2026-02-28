import 'package:flutter/material.dart';
import '../main.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _realTimeMonitoring = true;
  bool _batteryAlerts = false;

  @override
  Widget build(BuildContext context) {
    const neonGreen = Color(0xFFC6FF00);
    final isDark = themeNotifier.value == ThemeMode.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('SETTINGS'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSectionHeader('GENERAL'),
          _buildSettingsTile(
            context,
            icon: Icons.language,
            title: 'Language',
            subtitle: 'English (US)',
            onTap: () => _showLanguageDialog(context),
          ),
          _buildSettingsTile(
            context,
            icon: isDark ? Icons.dark_mode : Icons.light_mode,
            title: 'Theme Mode',
            subtitle: isDark ? 'Dark Mode' : 'Light Mode',
            onTap: () {
              setState(() {
                themeNotifier.value = isDark ? ThemeMode.light : ThemeMode.dark;
              });
            },
          ),
          const SizedBox(height: 24),
          _buildSectionHeader('MONITORING'),
          _buildSwitchTile(
            context,
            icon: Icons.timer,
            title: 'Real-time Monitoring',
            value: _realTimeMonitoring,
            onChanged: (val) {
              setState(() {
                _realTimeMonitoring = val;
              });
            },
          ),
          _buildSwitchTile(
            context,
            icon: Icons.notification_important,
            title: 'Battery Alerts',
            value: _batteryAlerts,
            onChanged: (val) {
              setState(() {
                _batteryAlerts = val;
              });
            },
          ),
          const SizedBox(height: 24),
          _buildSectionHeader('ABOUT'),
          _buildSettingsTile(
            context,
            icon: Icons.info_outline,
            title: 'Version',
            subtitle: '1.0.0 (Build 1)',
          ),
          _buildSettingsTile(
            context,
            icon: Icons.policy_outlined,
            title: 'Privacy Policy',
            onTap: () {},
          ),
          const SizedBox(height: 32),
          Center(
            child: Text(
              'CYBER SHIELD',
              style: TextStyle(
                color: neonGreen.withOpacity(0.5),
                letterSpacing: 4,
                fontWeight: FontWeight.bold,
                fontSize: 10,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).cardTheme.color,
        title: const Text('Select Language', style: TextStyle(color: Color(0xFFC6FF00), fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('English (US)'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              title: const Text('Spanish (ES)'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              title: const Text('Hindi (IN)'),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 8),
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

  Widget _buildSettingsTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: ListTile(
        leading: Icon(icon, color: Colors.white70, size: 20),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
        subtitle: subtitle != null ? Text(subtitle, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)) : null,
        trailing: const Icon(Icons.chevron_right, size: 18, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }

  Widget _buildSwitchTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: ListTile(
        leading: Icon(icon, color: Colors.white70, size: 20),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
        trailing: Switch(
          value: value,
          activeColor: const Color(0xFFC6FF00),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
