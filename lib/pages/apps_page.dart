import 'package:flutter/material.dart';
import 'package:installed_apps/installed_apps.dart';
import 'package:installed_apps/app_info.dart';

class AppsPage extends StatefulWidget {
  const AppsPage({super.key});

  @override
  State<AppsPage> createState() => _AppsPageState();
}

class _AppsPageState extends State<AppsPage> {
  bool _showSystemApps = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Installed Apps',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  const Text('System Apps', style: TextStyle(fontSize: 12)),
                  Switch(
                    value: _showSystemApps,
                    onChanged: (value) {
                      setState(() {
                        _showSystemApps = value;
                      });
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: FutureBuilder<List<AppInfo>>(
            future: InstalledApps.getInstalledApps(
              _showSystemApps,
              true,
            ),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              } else if (snapshot.hasError) {
                return Center(child: Text('Error: ${snapshot.error}'));
              } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return const Center(child: Text('No apps found'));
              }

              List<AppInfo> apps = snapshot.data!;
              apps.sort((a, b) => a.name!.toLowerCase().compareTo(b.name!.toLowerCase()));

              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                itemCount: apps.length,
                itemBuilder: (context, index) {
                  AppInfo app = apps[index];
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    child: ListTile(
                      leading: app.icon != null
                          ? Image.memory(app.icon!, width: 40)
                          : const Icon(Icons.android),
                      title: Text(app.name ?? 'Unknown'),
                      subtitle: Text(app.packageName ?? '', style: const TextStyle(fontSize: 11)),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => InstalledApps.startApp(app.packageName!),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
