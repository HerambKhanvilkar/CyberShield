import 'package:flutter/material.dart';
import 'pages/dashboard_page.dart';
import 'pages/device_info_page.dart';
import 'pages/hardware_page.dart';
import 'pages/battery_page.dart';
import 'pages/network_page.dart';
import 'pages/apps_page.dart';
import 'pages/camera_page.dart';
import 'pages/sensors_page.dart';
import 'pages/settings_page.dart';

final ValueNotifier<ThemeMode> themeNotifier = ValueNotifier(ThemeMode.dark);

void main() {
  runApp(const CyberShieldApp());
}

class CyberShieldApp extends StatelessWidget {
  const CyberShieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    const neonGreen = Color(0xFFC6FF00);

    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeNotifier,
      builder: (_, ThemeMode currentMode, __) {
        return MaterialApp(
          title: 'Cyber Shield',
          debugShowCheckedModeBanner: false,
          themeMode: currentMode,
          theme: ThemeData(
            brightness: Brightness.light,
            scaffoldBackgroundColor: const Color(0xFFF5F5F5),
            primaryColor: neonGreen,
            useMaterial3: true,
            colorScheme: ColorScheme.fromSeed(
              seedColor: neonGreen,
              brightness: Brightness.light,
            ),
            appBarTheme: const AppBarTheme(
              backgroundColor: Color(0xFFF5F5F5),
              foregroundColor: Colors.black,
              elevation: 0,
            ),
            tabBarTheme: const TabBarThemeData(
              labelColor: Colors.black,
              indicatorColor: neonGreen,
            ),
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            scaffoldBackgroundColor: const Color(0xFF0A0A0A),
            primaryColor: neonGreen,
            useMaterial3: true,
            colorScheme: const ColorScheme.dark(
              primary: neonGreen,
              surface: Color(0xFF161616),
            ),
            appBarTheme: const AppBarTheme(
              backgroundColor: Color(0xFF0A0A0A),
              elevation: 0,
            ),
            tabBarTheme: const TabBarThemeData(
              labelColor: neonGreen,
              indicatorColor: neonGreen,
            ),
          ),
          home: const MainDashboard(),
        );
      },
    );
  }
}

class MainDashboard extends StatelessWidget {
  const MainDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 8,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('CYBER SHIELD', style: TextStyle(letterSpacing: 2, fontWeight: FontWeight.bold)),
          leading: const Icon(Icons.shield, color: Color(0xFFC6FF00)),
          actions: [
            IconButton(
              icon: const Icon(Icons.settings),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SettingsPage())),
            ),
          ],
          bottom: const TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            tabs: [
              Tab(text: 'DASHBOARD'),
              Tab(text: 'SYSTEM'),
              Tab(text: 'HARDWARE'),
              Tab(text: 'BATTERY'),
              Tab(text: 'NETWORK'),
              Tab(text: 'APPS'),
              Tab(text: 'CAMERA'),
              Tab(text: 'SENSORS'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            DashboardPage(),
            DeviceInfoPage(),
            HardwarePage(),
            BatteryPage(),
            NetworkPage(),
            AppsPage(),
            CameraPage(),
            SensorsPage(),
          ],
        ),
      ),
    );
  }
}
