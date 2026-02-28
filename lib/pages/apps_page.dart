import 'package:flutter/material.dart';
import 'package:installed_apps/installed_apps.dart';
import 'package:installed_apps/app_info.dart';

class AppsPage extends StatefulWidget {
  const AppsPage({super.key});

  @override
  State<AppsPage> createState() => _AppsPageState();
}

enum _AppsFilter {
  all,
  user,
  system,
}

class _AppsPageState extends State<AppsPage> {
  List<AppInfo> _allApps = [];
  bool _loading = true;
  String? _error;
  _AppsFilter _filter = _AppsFilter.all;

  @override
  void initState() {
    super.initState();
    _loadApps();
  }

  Future<void> _loadApps() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final apps = await InstalledApps.getInstalledApps(true, true);

      apps.sort(
        (a, b) => (a.name ?? '')
            .toLowerCase()
            .compareTo((b.name ?? '').toLowerCase()),
      );

      if (!mounted) return;

      setState(() {
        _allApps = apps;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  bool _isSystemApp(AppInfo app) {
    final package = app.packageName ?? '';

    return package.startsWith('com.android') ||
        package.startsWith('com.google.android') ||
        package.startsWith('android');
  }

  @override
  Widget build(BuildContext context) {
    Iterable<AppInfo> visible = _allApps;

    if (_filter == _AppsFilter.user) {
      visible = _allApps.where((a) => !_isSystemApp(a));
    } else if (_filter == _AppsFilter.system) {
      visible = _allApps.where((a) => _isSystemApp(a));
    }

    final visibleList = visible.toList();

    final totalUser =
        _allApps.where((a) => !_isSystemApp(a)).length;
    final totalSystem =
        _allApps.where((a) => _isSystemApp(a)).length;

    return Column(
      children: [
        Padding(
          padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Installed Apps',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'User: $totalUser  •  System: $totalSystem',
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 12),

              /// 🔥 Stable Segmented Button (no resizing)
              SizedBox(
                height: 38,
                child: SegmentedButton<_AppsFilter>(
                  style: const ButtonStyle(
                    visualDensity: VisualDensity.compact,
                  ),
                  segments: const [
                    ButtonSegment(
                      value: _AppsFilter.all,
                      label: SizedBox(
                        width: 70,
                        child: Center(child: Text('All')),
                      ),
                    ),
                    ButtonSegment(
                      value: _AppsFilter.user,
                      label: SizedBox(
                        width: 70,
                        child: Center(child: Text('User')),
                      ),
                    ),
                    ButtonSegment(
                      value: _AppsFilter.system,
                      label: SizedBox(
                        width: 80,
                        child: Center(child: Text('System')),
                      ),
                    ),
                  ],
                  selected: {_filter},
                  onSelectionChanged: (selection) {
                    if (selection.isEmpty) return;
                    setState(() {
                      _filter = selection.first;
                    });
                  },
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadApps,
            child: Builder(
              builder: (context) {
                if (_loading) {
                  return const Center(
                      child: CircularProgressIndicator());
                }

                if (_error != null) {
                  return ListView(
                    physics:
                        const AlwaysScrollableScrollPhysics(),
                    children: [
                      const SizedBox(height: 80),
                      Center(
                        child: Text(
                          'Failed to load apps\n$_error',
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  );
                }

                if (visibleList.isEmpty) {
                  return ListView(
                    physics:
                        const AlwaysScrollableScrollPhysics(),
                    children: const [
                      SizedBox(height: 80),
                      Center(child: Text('No apps found')),
                    ],
                  );
                }

                return ListView.builder(
                  physics:
                      const AlwaysScrollableScrollPhysics(),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8),
                  itemCount: visibleList.length,
                  itemBuilder: (context, index) {
                    final app = visibleList[index];

                    return Card(
                      margin:
                          const EdgeInsets.symmetric(vertical: 4),
                      child: ListTile(
                        leading: app.icon != null
                            ? Image.memory(
                                app.icon!,
                                width: 40,
                                height: 40,
                              )
                            : const Icon(Icons.android),
                        title: Text(app.name ?? 'Unknown'),
                        subtitle: Text(
                          app.packageName ?? '',
                          style:
                              const TextStyle(fontSize: 11),
                        ),
                        onTap: () {
                          if (app.packageName != null) {
                            InstalledApps.startApp(
                                app.packageName!);
                          }
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}