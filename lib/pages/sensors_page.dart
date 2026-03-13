import 'package:flutter/material.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'dart:async';

class SensorsPage extends StatefulWidget {
  const SensorsPage({super.key});

  @override
  State<SensorsPage> createState() => _SensorsPageState();
}

class _SensorsPageState extends State<SensorsPage> {
  AccelerometerEvent? _accelerometer;
  GyroscopeEvent? _gyroscope;
  MagnetometerEvent? _magnetometer;

  StreamSubscription? _accSub;
  StreamSubscription? _gyroSub;
  StreamSubscription? _magSub;

  @override
  void initState() {
    super.initState();
    _accSub = accelerometerEventStream().listen((event) => setState(() => _accelerometer = event));
    _gyroSub = gyroscopeEventStream().listen((event) => setState(() => _gyroscope = event));
    _magSub = magnetometerEventStream().listen((event) => setState(() => _magnetometer = event));
  }

  @override
  void dispose() {
    _accSub?.cancel();
    _gyroSub?.cancel();
    _magSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const neon = Color(0xFFC6FF00);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        title: const Text('SENSORS', style: TextStyle(letterSpacing: 1.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
        physics: const BouncingScrollPhysics(),
        children: [
          _buildSensorCard(
            'Accelerometer',
            'Measures the acceleration force in m/s² that is applied to a device on all three physical axes (x, y, and z), including the force of gravity.',
            [
              'X: ${_accelerometer?.x.toStringAsFixed(4) ?? "0.00"}',
              'Y: ${_accelerometer?.y.toStringAsFixed(4) ?? "0.00"}',
              'Z: ${_accelerometer?.z.toStringAsFixed(4) ?? "0.00"}',
            ],
          ),
          _buildSensorCard(
            'Gyroscope',
            'Measures a device\'s rate of rotation in rad/s around each of the three physical axes (x, y, and z).',
            [
              'X: ${_gyroscope?.x.toStringAsFixed(4) ?? "0.00"}',
              'Y: ${_gyroscope?.y.toStringAsFixed(4) ?? "0.00"}',
              'Z: ${_gyroscope?.z.toStringAsFixed(4) ?? "0.00"}',
            ],
          ),
          _buildSensorCard(
            'Magnetometer',
            'Measures the ambient geomagnetic field for all three physical axes (x, y, z) in μT.',
            [
              'X: ${_magnetometer?.x.toStringAsFixed(4) ?? "0.00"}',
              'Y: ${_magnetometer?.y.toStringAsFixed(4) ?? "0.00"}',
              'Z: ${_magnetometer?.z.toStringAsFixed(4) ?? "0.00"}',
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSensorCard(String title, String description, List<String> values) {
    const neon = Color(0xFFC6FF00);
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
          Text(title, style: const TextStyle(color: neon, fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          Text(description, style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.4)),
          const SizedBox(height: 16),
          ...values.map((v) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(v.split(':')[0], style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
                Text(v.split(':')[1].trim(), style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
              ],
            ),
          )),
        ],
      ),
    );
  }
}
