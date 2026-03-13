import 'package:flutter/material.dart';

class FeedPage extends StatelessWidget {
  const FeedPage({super.key});

  @override
  Widget build(BuildContext context) {
    const neon = Color(0xFFC6FF00);
    
    return ListView(
      padding: const EdgeInsets.all(16),
      physics: const BouncingScrollPhysics(),
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 8.0),
          child: Text(
            'CYBER FEED',
            style: TextStyle(
              color: neon,
              fontWeight: FontWeight.bold,
              fontSize: 12,
              letterSpacing: 2,
            ),
          ),
        ),
        _buildFeedCard(
          'Security Alert',
          'Your device security patch is up to date (Jan 2026). Keep automatic updates enabled.',
          Icons.security,
          Colors.blueAccent,
        ),
        _buildFeedCard(
          'Hardware Health',
          'Battery health is "Good". Charging temperature is within optimal range (33°C).',
          Icons.battery_charging_full,
          neon,
        ),
        _buildFeedCard(
          'Performance Tip',
          'High background activity detected in 3 apps. Consider optimizing your RAM usage.',
          Icons.speed,
          Colors.orangeAccent,
        ),
        _buildFeedCard(
          'Privacy Check',
          '5 apps accessed your location in the last 24 hours. Review permissions in Tools.',
          Icons.privacy_tip_outlined,
          Colors.redAccent,
        ),
      ],
    );
  }

  Widget _buildFeedCard(String title, String body, IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161616),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 6),
                Text(
                  body,
                  style: const TextStyle(color: Colors.grey, fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
