import 'package:flutter/material.dart';

class DiskPartitionsPage extends StatelessWidget {
  const DiskPartitionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    const neon = Color(0xFFC6FF00);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        title: const Text('DISK PARTITIONS', style: TextStyle(letterSpacing: 1.2)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        physics: const BouncingScrollPhysics(),
        children: [
          _buildPartitionTile('/data', '117 GB total', '47.06 GB used', 0.40),
          _buildPartitionTile('/system', '4.0 GB total', '3.8 GB used', 0.95),
          _buildPartitionTile('/vendor', '1.2 GB total', '1.1 GB used', 0.90),
          _buildPartitionTile('/cache', '512 MB total', '12 MB used', 0.02),
          _buildPartitionTile('/persist', '32 MB total', '2 MB used', 0.06),
          _buildPartitionTile('/metadata', '64 MB total', '4 MB used', 0.06),
          _buildPartitionTile('/mnt/vendor/persist', '32 MB total', '2 MB used', 0.06),
        ],
      ),
    );
  }

  Widget _buildPartitionTile(String path, String total, String used, double percent) {
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
          Text(path, style: const TextStyle(color: Color(0xFFC6FF00), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(used, style: const TextStyle(color: Colors.white70, fontSize: 12)),
              Text(total, style: const TextStyle(color: Colors.grey, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: percent,
            backgroundColor: Colors.white10,
            color: const Color(0xFFC6FF00),
            minHeight: 6,
            borderRadius: BorderRadius.circular(3),
          ),
        ],
      ),
    );
  }
}
