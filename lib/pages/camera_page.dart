import 'package:flutter/material.dart';
import 'package:camera/camera.dart';

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

  void _showCameraDetailsPopup(String title, Map<String, String> moreDetails) {
    const neon = Color(0xFFC6FF00);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.info_outline, color: neon),
            const SizedBox(width: 12),
            Text(title, style: const TextStyle(color: neon, fontSize: 18)),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Divider(color: Colors.white24),
                ...moreDetails.entries.map((e) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(e.key, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  e.value,
                                  textAlign: TextAlign.right,
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _getExplanation(e.key),
                            style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11, fontStyle: FontStyle.italic),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: neon, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  String _getExplanation(String key) {
    switch (key) {
      case 'Hardware level':
        return 'Indicates the level of support for camera features (Level 3 is highest).';
      case 'Focus modes':
        return 'The available methods for the lens to focus on a subject.';
      case 'Exposure modes':
        return 'Methods for controlling the amount of light reaching the sensor.';
      case 'Flash modes':
        return 'Available configurations for the camera LED flash.';
      case 'Zoom ratio range':
        return 'The range of digital and optical magnification supported.';
      case 'Max face count':
        return 'Maximum number of faces the hardware can detect simultaneously.';
      case 'AE lock supported':
        return 'Ability to lock Auto Exposure to maintain consistent brightness.';
      case 'AWB lock supported':
        return 'Ability to lock Auto White Balance for consistent color tones.';
      case 'Raw capture support':
        return 'Support for capturing unprocessed image data (DNG format).';
      case 'Burst capture support':
        return 'Support for high-speed sequential photo capture.';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    const neon = Color(0xFFC6FF00);

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: neon));
    }

    if (_cameras.isEmpty) {
      return const Scaffold(
        backgroundColor: Color(0xFF0A0A0A),
        body: Center(child: Text('No cameras found')),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        title: const Text('CAMERA', style: TextStyle(letterSpacing: 1.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(12),
        physics: const BouncingScrollPhysics(),
        itemCount: _cameras.length + 1, // +1 for Video Capture section
        itemBuilder: (context, index) {
          if (index < _cameras.length) {
            final camera = _cameras[index];
            final isRear = camera.lensDirection == CameraLensDirection.back;
            final cameraNum = _cameras
                    .where((c) => c.lensDirection == camera.lensDirection)
                    .toList()
                    .indexOf(camera) +
                1;

            return _buildCameraCard(
              title: '${isRear ? "Rear" : "Front"} camera $cameraNum',
              megapixels: isRear
                  ? (cameraNum == 1 ? "50 MP" : "5 MP")
                  : (cameraNum == 1 ? "12.8 MP" : "9.5 MP"),
              aperture: isRear
                  ? (cameraNum == 1 ? "f/1.8 • 27 mm" : "f/2.2 • 16.6 mm")
                  : (cameraNum == 1 ? "f/2.0 • 27 mm" : "f/2.0 • 31 mm"),
              tags: isRear && cameraNum == 1
                  ? ['OIS', 'Flash']
                  : (isRear ? ['Flash'] : []),
              details: _getCameraDetails(camera, cameraNum),
              moreDetails: _getMoreCameraDetails(camera, cameraNum),
            );
          } else {
            return _buildVideoCaptureCard();
          }
        },
      ),
    );
  }

  Widget _buildCameraCard({
    required String title,
    required String megapixels,
    required String aperture,
    required List<String> tags,
    required Map<String, String> details,
    required Map<String, String> moreDetails,
  }) {
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
          Text(title,
              style: const TextStyle(
                  color: neon, fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.camera_alt_outlined, size: 64, color: Colors.grey),
              const SizedBox(width: 24),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(megapixels,
                      style: const TextStyle(
                          color: neon,
                          fontSize: 24,
                          fontWeight: FontWeight.bold)),
                  Text(aperture,
                      style: const TextStyle(color: Colors.white70, fontSize: 14)),
                ],
              ),
            ],
          ),
          if (tags.isNotEmpty) ...[
            const SizedBox(height: 16),
            Row(
              children: tags.map((t) => _buildTag(t)).toList(),
            ),
          ],
          const SizedBox(height: 20),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            childAspectRatio: 3,
            children: details.entries
                .map((e) => _buildMiniInfo(e.key, e.value))
                .toList(),
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: () => _showCameraDetailsPopup(title, moreDetails),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Text(
                    'More',
                    style: TextStyle(
                        color: neon.withOpacity(0.8),
                        fontWeight: FontWeight.bold,
                        fontSize: 14),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.chevron_right,
                    color: neon.withOpacity(0.8),
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoCaptureCard() {
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
          const Text('Video capture',
              style: const TextStyle(
                  color: neon, fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 16),
          const Text('Profiles',
              style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: Colors.black26, borderRadius: BorderRadius.circular(12)),
            child: const Text('720p @ 30, 120 Hz\n1080p @ 30 Hz',
                style: const TextStyle(color: Colors.white70, fontSize: 13)),
          ),
          const SizedBox(height: 16),
          _buildSimpleRow('Max frame rate', '120 Hz'),
          const SizedBox(height: 12),
          _buildCheckRow('High speed video', true),
          _buildCheckRow('Video stabilization', false),
          _buildCheckRow('HDR10 support', false),
        ],
      ),
    );
  }

  Widget _buildTag(String text) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white24),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(text,
          style: const TextStyle(color: Colors.white70, fontSize: 10)),
    );
  }

  Widget _buildMiniInfo(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
        Text(value,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  Widget _buildSimpleRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        const SizedBox(width: 16),
        Expanded(
          child: Text(value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
        ),
      ],
    );
  }

  Widget _buildCheckRow(String label, bool ok) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(ok ? Icons.check_circle : Icons.cancel,
              color: ok ? Colors.green : Colors.grey, size: 18),
          const SizedBox(width: 12),
          Text(label,
              style: const TextStyle(color: Colors.white70, fontSize: 13)),
        ],
      ),
    );
  }

  Map<String, String> _getCameraDetails(CameraDescription camera, int cameraNum) {
    if (camera.lensDirection == CameraLensDirection.back) {
      if (cameraNum == 1) {
        return {
          'Effective megapixels': '12.5 MP',
          'Resolution': '4080x3060',
          'Sensor size': '1/2.5"',
          'Pixel size': '0.64 µm',
          '35mm equivalent focal length': '27 mm',
          'Shutter speed': '1/53475 - 1/10 s',
          'ISO sensitivity range': '25 - 3200',
          'Optical image stabilization': 'Yes',
        };
      } else {
        return {
          'Resolution': '2576x1932',
          'Sensor size': '1/4.4"',
          'Pixel size': '1.13 µm',
          '35mm equivalent focal length': '16.6 mm',
          'Shutter speed': '1/40000 - 1/7 s',
          'ISO sensitivity range': '50 - 1600',
          'Optical image stabilization': 'No',
          'Flash': 'No',
        };
      }
    } else {
      if (cameraNum == 1) {
        return {
          'Resolution': '4128x3096',
          'Sensor size': '1/2.8"',
          'Pixel size': '1.12 µm',
          '35mm equivalent focal length': '27 mm',
          'Shutter speed': '1/24330 - 1/8 s',
          'ISO sensitivity range': '61 - 3200',
          'Optical image stabilization': 'No',
          'Flash': 'No',
        };
      } else {
        return {
          'Resolution': '3712x2556',
          'Sensor size': '1/3.2"',
          'Pixel size': '1.12 µm',
          '35mm equivalent focal length': '31 mm',
          'Shutter speed': '1/24330 - 1/8 s',
          'ISO sensitivity range': '61 - 3200',
          'Optical image stabilization': 'No',
          'Flash': 'No',
        };
      }
    }
  }

  Map<String, String> _getMoreCameraDetails(CameraDescription camera, int cameraNum) {
    return {
      'Hardware level': 'Level 3',
      'Focus modes': 'auto, continuous-video, continuous-picture, macro',
      'Exposure modes': 'auto, custom',
      'Flash modes': 'off, on, auto, torch',
      'Zoom ratio range': '1.0 - 10.0',
      'Max face count': '10',
      'AE lock supported': 'Yes',
      'AWB lock supported': 'Yes',
      'Raw capture support': 'Yes',
      'Burst capture support': 'Yes',
    };
  }
}
