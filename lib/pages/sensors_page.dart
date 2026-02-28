import 'package:flutter/material.dart';
import 'package:sensors_plus/sensors_plus.dart';
import '../widgets/info_tile.dart';
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
  UserAccelerometerEvent? _userAccelerometer;

  StreamSubscription? _accSub;
  StreamSubscription? _gyroSub;
  StreamSubscription? _magSub;
  StreamSubscription? _userAccSub;

  @override
  void initState() {
    super.initState();
    _accSub = accelerometerEventStream().listen((event) => setState(() => _accelerometer = event));
    _gyroSub = gyroscopeEventStream().listen((event) => setState(() => _gyroscope = event));
    _magSub = magnetometerEventStream().listen((event) => setState(() => _magnetometer = event));
    _userAccSub = userAccelerometerEventStream().listen((event) => setState(() => _userAccelerometer = event));
  }

  @override
  void dispose() {
    _accSub?.cancel();
    _gyroSub?.cancel();
    _magSub?.cancel();
    _userAccSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const InfoHeader(title: 'Accelerometer'),
        _buildSensorTile('X: ${_accelerometer?.x.toStringAsFixed(2) ?? "0.00"}'),
        _buildSensorTile('Y: ${_accelerometer?.y.toStringAsFixed(2) ?? "0.00"}'),
        _buildSensorTile('Z: ${_accelerometer?.z.toStringAsFixed(2) ?? "0.00"}'),
        
        const InfoHeader(title: 'Gyroscope'),
        _buildSensorTile('X: ${_gyroscope?.x.toStringAsFixed(2) ?? "0.00"}'),
        _buildSensorTile('Y: ${_gyroscope?.y.toStringAsFixed(2) ?? "0.00"}'),
        _buildSensorTile('Z: ${_gyroscope?.z.toStringAsFixed(2) ?? "0.00"}'),

        const InfoHeader(title: 'Magnetometer'),
        _buildSensorTile('X: ${_magnetometer?.x.toStringAsFixed(2) ?? "0.00"}'),
        _buildSensorTile('Y: ${_magnetometer?.y.toStringAsFixed(2) ?? "0.00"}'),
        _buildSensorTile('Z: ${_magnetometer?.z.toStringAsFixed(2) ?? "0.00"}'),
      ],
    );
  }

  Widget _buildSensorTile(String value) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        title: Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
    );
  }
}
