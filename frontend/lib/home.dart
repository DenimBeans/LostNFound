import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:io';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_dragmarker/flutter_map_dragmarker.dart';
import 'package:latlong2/latlong.dart';
import 'dart:convert';
import 'main.dart';
import 'notifications.dart';
import 'report.dart';
import 'search.dart';

class AppHome extends StatefulWidget {
  final String firstName;
  final String lastName;
  final String email;
  final String userId;

  const AppHome({
    super.key,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.userId,
  });

  @override
  State<AppHome> createState() => _AppHomeState();
}

class _AppHomeState extends State<AppHome> {
  int currentPageIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.mainBackground,
      appBar: AppBar(
        backgroundColor: AppColors.mainBackground,
        centerTitle: true,
        automaticallyImplyLeading: false, // Removes back arrow
        title: Text(
          currentPageIndex == 0
              ? 'Report a Lost Item'
              : currentPageIndex == 1
              ? 'Search for a Lost Item'
              : 'Inbox',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        backgroundColor: AppColors.secondaryBackground,
        onDestinationSelected: (int index) {
          setState(() {
            currentPageIndex = index;
          });
        },
        indicatorColor: Colors.grey,
        selectedIndex: currentPageIndex,
        destinations: const <Widget>[
          NavigationDestination(
            selectedIcon: Icon(Icons.document_scanner),
            icon: Icon(Icons.document_scanner_outlined),
            label: 'Report Lost',
          ),
          NavigationDestination(
            selectedIcon: Icon(Icons.search),
            icon: Icon(Icons.search_outlined),
            label: 'Search',
          ),
          NavigationDestination(
            selectedIcon: Icon(Icons.mail),
            icon: Icon(Icons.mail_outline),
            label: 'Inbox',
          ),
        ],
      ),
      body: <Widget>[
        ItemReport(
          firstName: widget.firstName,
          lastName: widget.lastName,
          email: widget.email,
          userId: widget.userId,
        ),
        ItemSearch(
          firstName: widget.firstName,
          lastName: widget.lastName,
          email: widget.email,
        ),
        InboxDisplay(),
      ][currentPageIndex],
      endDrawer: Drawer(
        backgroundColor: AppColors.secondaryBackground,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const SizedBox(height: 50),
            _buildDrawerButton(context, 'Tracked Items', () {
              // TODO: Navigate to tracked items
            }),
            _buildDrawerButton(context, 'Your Reports', () {
              // TODO: Navigate to your items
            }),
            _buildDrawerButton(context, 'Account Settings', () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => AccountSettings(
                    firstName: widget.firstName,
                    lastName: widget.lastName,
                    email: widget.email,
                  ),
                ),
              );
            }),
            _buildDrawerButton(context, 'About', () {
              showDialog(
                context: context,
                builder: (BuildContext context) => AboutModal(),
              );
            }),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: BoldElevatedButton(
                text: 'Log out',
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                minWidth: double.infinity,
                minHeight: 45,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerButton(
    BuildContext context,
    String title,
    VoidCallback onTap,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.secondaryButton,
          foregroundColor: AppColors.primaryText,
          padding: const EdgeInsets.symmetric(vertical: 16.0),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8.0),
          ),
          elevation: 0,
        ),
        onPressed: onTap,
        child: Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }
}

//  Reusable Map Widgets
class MapUCF extends StatefulWidget {
  const MapUCF({
    super.key,
    required this.pontoCentral,
    this.markers,
    this.dragMarker,
  });

  final LatLng pontoCentral;
  final List<Marker>? markers;
  final List<DragMarker>? dragMarker;

  @override
  State<MapUCF> createState() => _MapUCFState();
}

class _MapUCFState extends State<MapUCF> {
  final MapController _mapController = MapController();

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FlutterMap(
      mapController: _mapController,
      // Map options, such as initial center and zoom
      options: MapOptions(
        initialCenter: widget.pontoCentral,
        initialZoom: 15.0, // Displays all of campus
      ),
      // The map is built in layers
      children: [
        // Layer 1: The base map from OpenStreetMap
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.example.flutter_map_example',
        ),
        // Marker Layer (optionally draggable)
        if (widget.dragMarker != null)
          DragMarkers(markers: widget.dragMarker ?? [])
        else
          MarkerLayer(markers: widget.markers ?? []),
      ],
    );
  }
}

//  Item widgets
class Item {
  final String title;
  final String reporterName;
  final String? description;
  final String? category;
  final String? imageUrl;
  final String? locationText;
  final int? lat;
  final int? long;

  Item({
    required this.title,
    required this.reporterName,
    this.description,
    this.category,
    this.imageUrl,
    this.locationText,
    this.lat,
    this.long,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    return Item(
      title: json['title'],
      description: json['description'] ?? 'No item description give.',
      category: json['category'] ?? '---',
      imageUrl: json['imageUrl'] ?? '',
      locationText: json['locationText'] ?? 'No location description given.',
      reporterName: json['repoterName'],
      lat: json['lat'] ?? 28.6024274,
      long: json['long'] ?? -81.2000599,
    );
  }
}

//  Hamburger Menu Contents
class AboutModal extends StatelessWidget {
  const AboutModal({super.key});

  Future<void> _launchURL() async {
    final Uri url = Uri.parse('https://github.com/DenimBeans/LostNFound');
    await launchUrl(url);
  }

  @override
  Widget build(BuildContext context) {
    return SimpleDialog(
      title: const Text('About'),
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Created for COP 4331',
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 16),
              const Text(
                'GitHub:',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              GestureDetector(
                onTap: _launchURL,
                child: const Text(
                  'https://github.com/DenimBeans/LostNFound',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.blue,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

//  Account Settings Widget
class AccountSettings extends StatefulWidget {
  final String firstName;
  final String lastName;
  final String email;

  const AccountSettings({
    super.key,
    required this.firstName,
    required this.lastName,
    required this.email,
  });

  @override
  State<AccountSettings> createState() => _AccountSettingsState();
}

class _AccountSettingsState extends State<AccountSettings> {
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  final TextEditingController _passwordController = TextEditingController();
  bool _isDyslexicFont = false;
  bool _isDarkMode = false;

  @override
  void initState() {
    super.initState();
    // Pre-populate fields with current user data
    _firstNameController = TextEditingController(text: widget.firstName);
    _lastNameController = TextEditingController(text: widget.lastName);
    _emailController = TextEditingController(text: widget.email);
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _updateProfile() async {
    // TODO: Implement API call to update profile
    // For now, just show a success message
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Profile updated!')));
    }
  }

  Future<void> _resetPassword() async {
    if (_passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a new password')),
      );
      return;
    }

    // TODO: Implement API call to reset password
    // For now, just show a success message
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password reset email sent!')),
      );
      _passwordController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.secondaryBackground,
      appBar: ArrowTitleBar(title: 'Account Settings'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section: Profile Information
            _buildSectionHeader('Profile Information'),
            const SizedBox(height: 12),
            InputTextField(
              label: 'First Name',
              isObscure: false,
              controller: _firstNameController,
            ),
            const SizedBox(height: 8),
            InputTextField(
              label: 'Last Name',
              isObscure: false,
              controller: _lastNameController,
            ),
            const SizedBox(height: 8),
            InputTextField(
              label: 'Email Address',
              isObscure: false,
              controller: _emailController,
            ),
            const SizedBox(height: 20),
            Center(
              child: BoldElevatedButton(
                text: 'Update Profile',
                onPressed: _updateProfile,
                minWidth: 180,
                minHeight: 45,
              ),
            ),

            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 20),

            // Section: Security
            _buildSectionHeader('Security'),
            const SizedBox(height: 12),
            InputTextField(
              label: 'New Password',
              isObscure: true,
              controller: _passwordController,
            ),
            const SizedBox(height: 20),
            Center(
              child: BoldElevatedButton(
                text: 'Reset Password',
                onPressed: _resetPassword,
                minWidth: 180,
                minHeight: 45,
              ),
            ),

            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 20),

            // Section: Preferences
            _buildSectionHeader('Preferences'),
            const SizedBox(height: 12),

            // Dyslexic Font Toggle
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(
                'Dyslexic-Friendly Font',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
              subtitle: const Text(
                'Use OpenDyslexic font for better readability',
              ),
              trailing: Switch(
                value: _isDyslexicFont,
                onChanged: (bool newValue) {
                  setState(() {
                    _isDyslexicFont = newValue;
                  });
                  // TODO: Implement font change globally
                },
              ),
            ),
            const SizedBox(height: 8),

            // Dark Mode Toggle
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(
                'Dark Mode',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
              subtitle: const Text('Switch between light and dark theme'),
              trailing: Switch(
                value: _isDarkMode,
                onChanged: (bool newValue) {
                  setState(() {
                    _isDarkMode = newValue;
                  });
                  // TODO: Implement theme change globally
                },
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
    );
  }
}

//  Item Found Meeting Popup
class ItemFound extends StatelessWidget {
  const ItemFound({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold();
  }
}
