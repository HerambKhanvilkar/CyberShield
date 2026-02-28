import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import '../widgets/info_tile.dart';

class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  State<CameraPage> createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> {
  List<CameraDescription> _cameras = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initCameras();
  }

  Future<void> _initCameras() async {
    try {
      final cameras = await availableCameras();
      if (!mounted) return;
      setState(() {
        _cameras = cameras;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_cameras.isEmpty) {
      return const Center(child: Text('No cameras found'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _cameras.length,
      itemBuilder: (context, index) {
        final camera = _cameras[index];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InfoHeader(title: 'Camera ${index + 1}: ${camera.lensDirection.toString().split('.').last.toUpperCase()}'),
            InfoTile(label: 'Name', value: camera.name),
            InfoTile(label: 'Sensor Orientation', value: '${camera.sensorOrientation}°'),
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }
}
