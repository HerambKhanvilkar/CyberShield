import 'package:flutter/material.dart';
import 'pages/dashboard_page.dart';
import 'pages/feed_page.dart';
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
              centerTitle: true,
              titleTextStyle: TextStyle(
                letterSpacing: 2,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            bottomNavigationBarTheme: const BottomNavigationBarThemeData(
              selectedItemColor: neonGreen,
              unselectedItemColor: Colors.grey,
              backgroundColor: Colors.white,
              type: BottomNavigationBarType.fixed,
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
              centerTitle: true,
              titleTextStyle: TextStyle(
                letterSpacing: 2,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            bottomNavigationBarTheme: const BottomNavigationBarThemeData(
              selectedItemColor: neonGreen,
              unselectedItemColor: Colors.white24,
              backgroundColor: Color(0xFF0A0A0A),
              type: BottomNavigationBarType.fixed,
            ),
          ),
          home: const MainScreen(),
        );
      },
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const DashboardPage(),
    const FeedPage(),
    const SettingsPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CYBER SHIELD'),
        leading: const Padding(
          padding: EdgeInsets.all(12.0),
          child: CircleAvatar(
            backgroundColor: Color(0xFFC6FF00),
            child: Icon(Icons.shield, size: 16, color: Colors.black),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.rss_feed_outlined),
            activeIcon: Icon(Icons.rss_feed),
            label: 'Feed',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
