import 'package:flutter/material.dart';
import 'package:torch_light/torch_light.dart';
import 'package:vibration/vibration.dart';

class TestsPage extends StatefulWidget {
  const TestsPage({super.key});

  @override
  State<TestsPage> createState() => _TestsPageState();
}

class _TestsPageState extends State<TestsPage> {
  bool _isFlashOn = false;

  Future<void> _toggleFlash() async {
    try {
      if (_isFlashOn) {
        await TorchLight.disableTorch();
      } else {
        await TorchLight.enableTorch();
      }
      setState(() {
        _isFlashOn = !_isFlashOn;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Flash error: $e')),
      );
    }
  }

  Future<void> _testVibration() async {
    if (await Vibration.hasVibrator() ?? false) {
      Vibration.vibrate(duration: 1000);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vibration not supported')),
      );
    }
  }

  void _testDeadPixels() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          body: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              color: Colors.red,
              child: const Center(
                child: Text('Dead Pixel Test\nTap to exit',
                    textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('TESTS'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildTestSection('DISPLAY & SENSORS'),
          _buildTestTile(
            context,
            'Flashlight',
            _isFlashOn ? Icons.flashlight_off : Icons.flashlight_on,
            _isFlashOn ? 'Turn off flash' : 'Test camera flash',
            _toggleFlash,
          ),
          _buildTestTile(
            context,
            'Vibration',
            Icons.vibration,
            'Test vibration motor',
            _testVibration,
          ),
          _buildTestTile(
            context,
            'Dead Pixels',
            Icons.palette_outlined,
            'Check display colors',
            _testDeadPixels,
          ),
          _buildTestTile(
            context,
            'Multi-touch',
            Icons.touch_app,
            'Test digitizer accuracy',
            () {},
          ),
          const SizedBox(height: 24),
          _buildTestSection('AUDIO & BIOMETRICS'),
          _buildTestTile(
            context,
            'Speakers',
            Icons.volume_up,
            'Test main speakers',
            () {},
          ),
          _buildTestTile(
            context,
            'Microphone',
            Icons.mic,
            'Record and play back',
            () {},
          ),
          _buildTestTile(
            context,
            'Biometrics',
            Icons.fingerprint,
            'Test sensor loops',
            () {},
          ),
        ],
      ),
    );
  }

  Widget _buildTestSection(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
      child: Text(title,
          style: const TextStyle(
              color: Color(0xFFC6FF00), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
    );
  }

  Widget _buildTestTile(BuildContext context, String title, IconData icon, String subtitle, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFFC6FF00)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        trailing: const Icon(Icons.play_arrow_outlined, size: 20),
        onTap: onTap,
      ),
    );
  }
}