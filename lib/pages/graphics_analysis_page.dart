import 'package:flutter/material.dart';

class GraphicsAnalysisPage extends StatelessWidget {
  final String type; // 'Vulkan' or 'OpenGL'
  const GraphicsAnalysisPage({super.key, required this.type});

  @override
  Widget build(BuildContext context) {
    const neon = Color(0xFFC6FF00);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        title: Text(type == 'Vulkan' ? 'Vulkan Capabilities' : 'OpenGL ES Capabilities', style: const TextStyle(letterSpacing: 1.2)),
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
        children: type == 'Vulkan' ? _buildVulkanContent() : _buildOpenGLContent(),
      ),
    );
  }

  List<Widget> _buildVulkanContent() {
    return [
      _buildSectionCard('GPU Identity', [
        _buildRow('Name', 'Adreno (TM) 710'),
        _buildRow('Vendor', 'Qualcomm'),
        _buildRow('Device ID', '0x07010000'),
        _buildRow('Device Type', 'Integrated GPU'),
        _buildRow('Instance API', '1.3.0'),
        _buildRow('Device API', '1.1.128'),
        _buildRow(
          'Driver',
          'Qualcomm Technologies\nInc. Adreno Vulkan Driver\n• Driver Build: 0c393b63cf,\nI94e2bd5684, 1746191168\nDate: 05/02/25\nCompiler Version:\nEV031.36.08.33\nDriver Branch:',
        ),
        _buildRow('Driver version', '512.615.98'),
        _buildRow('Driver Conformance', '1.2.7.2'),
        _buildRow('Device extensions', '89'),
        _buildRow('Instance extensions', '14'),
        _buildActionRow('Device extensions', 'SHOW'),
        _buildActionRow('Instance extensions', 'SHOW'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('UUIDs', [
        _buildRow('Device UUID', '43510000-0600-0000-c602-60\n000a00602c'),
        _buildRow('Driver UUID', '04000000-0100-0000-0100-0\n00000000000'),
        _buildRow('PipelineCache UUID', 'b693c300-4351-0000-0000-00\n0001070000'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Memory', [
        _buildRow('Device-local (shared)', '8 GB'),
        _buildRow('Heap 0', '7.29 GB'),
        _buildRow('Heap 1', '256.00 MB'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Limits', [
        _buildRow('Max 1D image', '16384'),
        _buildRow('Max 2D image', '16384 × 16384'),
        _buildRow('Max 3D image', '2048 × 2048 × 2048'),
        _buildRow('Max cube image', '16384 × 16384'),
        _buildRow('Max array layers', '2048'),
        _buildRow('Uniform buffer range', '64.0 KB'),
        _buildRow('Storage buffer range', '128.0 MB'),
        _buildRow('Max anisotropy', '16'),
        _buildRow('Framebuffer color\nmax samples', '4'),
        _buildRow('Framebuffer depth\nmax samples', '4'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Subgroup', [
        _buildRow('Subgroup size', '64'),
        _buildRow('Max compute\ninvocations', '1024'),
        _buildRow('Supported\noperations', 'basic, vote, arithmetic, ballot,\nshuffle, shuffle_relative, quad'),
        _buildRow('Supported stages', 'fragment, compute'),
        _buildRow('Graphics subgroups', 'Yes'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Core Features', [
        _buildRow('Robust buffer access', 'Yes'),
        _buildRow('Sampler anisotropy', 'Yes'),
        _buildRow('Shader Int16', 'Yes'),
        _buildRow('Shader Float64', 'No'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Vulkan 1.1', [
        _buildRow('Protected memory', 'Yes'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Vulkan 1.2', [
        _buildRow('Timeline semaphore', 'Yes'),
        _buildRow('Descriptor indexing', 'Yes'),
        _buildRow('Buffer device\naddress', 'Yes'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Vulkan 1.3', [
        _buildRow('Dynamic rendering', 'No'),
        _buildRow('Synchronization2', 'No'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Vulkan 1.4', [
        _buildRow('Index type UINT8', 'No'),
        _buildRow('Line rasterization', 'No'),
        _buildRow('Push descriptors', 'Yes (extension)'),
        _buildRow('Global priority query', 'No'),
        _buildRow('Shader float controls\n2', 'No'),
        _buildRow('Max push\ndescriptors', '32'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Highlights', [
        _buildRow('Maintenance5', 'No'),
        _buildRow('Maintenance6', 'No'),
        _buildRow('Maintenance7', 'No'),
        _buildRow('Descriptor buffer', 'No'),
        _buildRow('Graphics pipeline\nlibrary', 'No'),
        _buildRow('Calibrated\ntimestamps', 'No'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Capabilities', [
        _buildRow('Ray tracing', 'No'),
        _buildRow('RT pipeline', 'No'),
        _buildRow('Ray query', 'No'),
        _buildRow('Mesh shaders', 'No'),
        _buildRow('Cooperative matrix', 'No'),
        _buildRow('Acceleration\nstructure', 'No'),
        _buildRow('Portability subset', 'No'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Queues', [
        _buildQueueDetail(0, 'graphics, compute, sparse', '3', '48'),
        const Divider(color: Colors.white10),
        _buildQueueDetail(1, 'sparse', '1', '48'),
      ]),
    ];
  }

  List<Widget> _buildOpenGLContent() {
    return [
      _buildSectionCard('Identity', [
        _buildRow('Vendor', 'Qualcomm'),
        _buildRow('Renderer', 'Adreno (TM) 710'),
        _buildRow(
          'GL Version',
          'OpenGL ES 3.2 V@0615.98 (GIT@0c393b63cf, I94e2bd5684, 1746191168) (Date:05/02/25)',
        ),
        _buildRow('GLSL Version', 'OpenGL ES GLSL ES 3.20'),
        _buildRow('ES Level', '3.2'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('EGL', [
        _buildRow('EGL Version', '1.5 Android META-EGL'),
        _buildRow('EGL Vendor', 'Android'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Limits', [
        _buildRow('Max texture size', '16384'),
        _buildRow('Max cube map size', '16384'),
        _buildRow('Max 3D texture size', '2048'),
        _buildRow('Max renderbuffer size', '16384'),
        _buildRow('Max MSAA samples', '4'),
        _buildRow('Max vertex attribs', '32'),
        _buildRow('Max varying', '124'),
        _buildRow('Max varying\n(components/\nvectors)', '124'),
        _buildRow('Max vertex uniform\nvectors', '256'),
        _buildRow('Max fragment\nuniform vectors', '256'),
        _buildRow('Max texture image\nunits', '16'),
        _buildRow('Max vertex texture\nimage units', '16'),
        _buildRow('Max combined\ntexture image units', '96'),
        _buildRow('Max viewport', '16384 × 16384'),
        _buildRow('Max array texture\nlayers', '2048'),
        _buildRow('Max framebuffer\ncolor attachments', '8'),
        _buildRow('Max vertex uniform\nblocks', '14'),
        _buildRow('Max fragment\nuniform blocks', '14'),
        _buildRow('Max uniform blocks\n(combined)', '84'),
        _buildRow('Max compute\nuniform blocks', '14'),
        _buildRow('Max geometry\nuniform blocks', '14'),
        _buildRow('Max tess control\nuniform blocks', '14'),
        _buildRow('Max tess evaluation\nuniform blocks', '14'),
        _buildRow('Subpixel bits', '4'),
        _buildRow('Aliased line width', '1.0 – 8.0'),
        _buildRow('Compressed texture\nformats', '62'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Highlights', [
        _buildRow('ASTC textures', 'Yes'),
        _buildRow('ETC2 textures', 'Yes'),
        _buildRow('ETC1 textures', 'Yes'),
        _buildRow('sRGB textures/fbos', 'Yes'),
        _buildRow('Texture storage', 'Yes'),
        _buildRow('Timer queries', 'Yes'),
        _buildRow('Compute shaders', 'Yes'),
        _buildRow('Geometry shaders', 'Yes'),
        _buildRow('Tessellation shaders', 'Yes'),
      ]),
      const SizedBox(height: 16),
      _buildSectionCard('Extensions', [
        _buildRow('Extension count', '102'),
        _buildActionRow('All extensions', 'SHOW'),
      ]),
    ];
  }

  Widget _buildSectionCard(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161616),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFFC6FF00),
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionRow(String label, String action) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text(
            action,
            style: const TextStyle(
              color: Color(0xFFC6FF00),
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQueueDetail(int index, String flags, String count, String bits) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Queue $index',
            style: const TextStyle(
              color: Color(0xFFC6FF00),
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 8),
          _buildRow('Flags', flags),
          _buildRow('Count', count),
          _buildRow('Timestamp bits', bits),
        ],
      ),
    );
  }
}
