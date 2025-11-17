
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_dragmarker/flutter_map_dragmarker.dart';
import 'package:latlong2/latlong.dart';
import 'dart:convert';
import 'main.dart';
import 'notifications.dart';
import 'report.dart';
import 'search.dart';
import 'your_reports.dart';
import 'tracking.dart';

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
        automaticallyImplyLeading: false,
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
          userId: widget.userId,
        ),
        InboxDisplay(userId: widget.userId),
      ][currentPageIndex],
      endDrawer: Drawer(
        backgroundColor: AppColors.secondaryBackground,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const SizedBox(height: 50),
            _buildDrawerButton(context, 'Tracked Items', () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => TrackedItems(
                    userId: widget.userId,
                    firstName: widget.firstName,
                    lastName: widget.lastName,
                  ),
                ),
              );
            }),
            _buildDrawerButton(context, 'Your Reports', () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => YourReports(
                    userId: widget.userId,
                    firstName: widget.firstName,
                    lastName: widget.lastName,
                  ),
                ),
              );
            }),
            _buildDrawerButton(context, 'Account Settings', () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => AccountSettings(
                    firstName: widget.firstName,
                    lastName: widget.lastName,
                    email: widget.email,
                    userId: widget.userId,
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
        initialZoom: 16.0, // Displays all of campus
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
  final String itemId;
  final String title;
  final String? description;
  final String? category;
  final String status;
  final double lat;
  final double lng;
  final String reporterUserId;
  final String reporterFName;
  final String reporterLName;
  final String reporterEmail;
  final String? imageUrl;

  Item({
    required this.itemId,
    required this.title,
    this.description,
    this.category,
    required this.status,
    required this.lat,
    required this.lng,
    required this.reporterUserId,
    required this.reporterFName,
    required this.reporterLName,
    required this.reporterEmail,
    this.imageUrl,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    //  Extract data from userId as Map
    String? firstName;
    String? lastName;
    String? email;
    String userId = '';

    if (json['userId'] is Map) {
      final user = json['userId'] as Map<String, dynamic>;
      userId = user['_id'] ?? '';
      firstName = user['firstName'];
      lastName = user['lastName'];
      email = user['email'];
    } else if (json['userId'] is String) {
      userId = json['userId'] as String;
    }

    //  Return complete item
    return Item(
      itemId: json['_id'],
      title: json['title'],
      description: json['description'] ?? 'No item description give.',
      category: json['category'] ?? '---',
      status: json['status'],
      lat: json['location']['coordinates'][1],
      lng: json['location']['coordinates'][0],
      reporterUserId: userId,
      reporterFName: firstName ?? '',
      reporterLName: lastName ?? '',
      reporterEmail: email ?? '',
      imageUrl: json['imageUrl'] ?? '',
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
  final String userId;

  const AccountSettings({
    super.key,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.userId,
  });

  @override
  State<AccountSettings> createState() => _AccountSettingsState();
}

class _AccountSettingsState extends State<AccountSettings> {
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  final TextEditingController _currentPasswordController =
      TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _isDyslexicFont = false;
  bool _isDarkMode = false;
  bool _isLoadingProfile = false;
  bool _isLoadingPassword = false;
  String _profileError = '';
  String _passwordError = '';

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
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _updateProfile() async {
    setState(() {
      _isLoadingProfile = true;
      _profileError = '';
    });

    try {
      // Prepare update data
      final Map<String, dynamic> updateData = {
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'email': _emailController.text.trim().toLowerCase(),
      };

      final response = await http.patch(
        Uri.parse('http://knightfind.xyz:4000/api/users/${widget.userId}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(updateData),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['error'] == null || data['error'].isEmpty) {
          if (mounted) {
            // Check if email was changed (requires verification)
            final message = data['message'] ?? 'Profile updated successfully';

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(message),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 4),
              ),
            );

            // If email changed, show additional info
            if (_emailController.text.trim().toLowerCase() !=
                widget.email.toLowerCase()) {
              Future.delayed(const Duration(seconds: 4), () {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Please check your new email to verify the change.',
                      ),
                      backgroundColor: Colors.orange,
                      duration: Duration(seconds: 5),
                    ),
                  );
                }
              });
            }
          }
        } else {
          setState(() {
            _profileError = data['error'];
          });
        }
      } else {
        final data = jsonDecode(response.body);
        setState(() {
          _profileError = data['error'] ?? 'Failed to update profile';
        });
      }
    } catch (e) {
      setState(() {
        _profileError = 'Network error. Please check your connection.';
      });
    } finally {
      setState(() {
        _isLoadingProfile = false;
      });
    }
  }

  Future<void> _resetPassword() async {
    // Validate inputs
    if (_currentPasswordController.text.isEmpty) {
      setState(() {
        _passwordError = 'Please enter your current password';
      });
      return;
    }

    if (_newPasswordController.text.isEmpty) {
      setState(() {
        _passwordError = 'Please enter a new password';
      });
      return;
    }

    if (_newPasswordController.text != _confirmPasswordController.text) {
      setState(() {
        _passwordError = 'New passwords do not match';
      });
      return;
    }

    if (_currentPasswordController.text == _newPasswordController.text) {
      setState(() {
        _passwordError = 'New password must be different from current password';
      });
      return;
    }

    setState(() {
      _isLoadingPassword = true;
      _passwordError = '';
    });

    try {
      final response = await http.patch(
        Uri.parse('http://knightfind.xyz:4000/api/users/${widget.userId}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'currentPassword': _currentPasswordController.text,
          'newPassword': _newPasswordController.text,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['error'] == null || data['error'].isEmpty) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Password updated successfully!'),
                backgroundColor: Colors.green,
              ),
            );

            // Clear password fields
            _currentPasswordController.clear();
            _newPasswordController.clear();
            _confirmPasswordController.clear();
          }
        } else {
          setState(() {
            _passwordError = data['error'];
          });
        }
      } else {
        final data = jsonDecode(response.body);
        setState(() {
          _passwordError = data['error'] ?? 'Failed to update password';
        });
      }
    } catch (e) {
      setState(() {
        _passwordError = 'Network error. Please check your connection.';
      });
    } finally {
      setState(() {
        _isLoadingPassword = false;
      });
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
            // ========== PROFILE INFORMATION SECTION ==========
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

            if (_profileError.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 12.0),
                child: Text(
                  _profileError,
                  style: const TextStyle(color: Colors.red, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
              ),

            const SizedBox(height: 20),
            Center(
              child: _isLoadingProfile
                  ? const CircularProgressIndicator()
                  : BoldElevatedButton(
                      text: 'Update Profile',
                      onPressed: _updateProfile,
                      minWidth: 180,
                      minHeight: 45,
                    ),
            ),

            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 20),

            // ========== SECURITY SECTION ==========
            _buildSectionHeader('Security'),
            const SizedBox(height: 12),

            InputTextField(
              label: 'Current Password',
              isObscure: true,
              controller: _currentPasswordController,
            ),
            const SizedBox(height: 8),

            InputTextField(
              label: 'New Password',
              isObscure: true,
              controller: _newPasswordController,
            ),
            const SizedBox(height: 8),

            InputTextField(
              label: 'Confirm New Password',
              isObscure: true,
              controller: _confirmPasswordController,
            ),

            if (_passwordError.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 12.0),
                child: Text(
                  _passwordError,
                  style: const TextStyle(color: Colors.red, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
              ),

            const SizedBox(height: 20),
            Center(
              child: _isLoadingPassword
                  ? const CircularProgressIndicator()
                  : BoldElevatedButton(
                      text: 'Update Password',
                      onPressed: _resetPassword,
                      minWidth: 180,
                      minHeight: 45,
                    ),
            ),
            /*
            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 20),

            // ========== PREFERENCES SECTION ==========
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
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        newValue
                            ? 'Dyslexic font enabled (feature coming soon)'
                            : 'Dyslexic font disabled',
                      ),
                    ),
                  );
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
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        newValue
                            ? 'Dark mode enabled (feature coming soon)'
                            : 'Dark mode disabled',
                      ),
                    ),
                  );
                },
              ),
            ),*/

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
