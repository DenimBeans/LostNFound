import 'dart:async';
import 'dart:io';

//import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_dragmarker/flutter_map_dragmarker.dart';
import 'package:latlong2/latlong.dart';
import 'dart:convert';
import 'main.dart';

class AppHome extends StatefulWidget {
  final String firstName;
  final String lastName;
  final String email;

  const AppHome({
    super.key,
    required this.firstName,
    required this.lastName,
    required this.email,
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

//  Item Search Widgets
class ItemSearch extends StatefulWidget {
  final String firstName;
  final String lastName;
  final String email;

  const ItemSearch({
    super.key,
    required this.firstName,
    required this.lastName,
    required this.email,
  });

  @override
  ItemSearchState createState() {
    return ItemSearchState();
  }
}

class ItemSearchState extends State<ItemSearch> {
  final _itemSearchKey = GlobalKey<FormState>();
  String _errorMessage = '';
  bool _isLoading = false;

  Future<void> _search() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final response = await http.post(
        Uri.parse('http://174.138.65.216:4000/api/items'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({}),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);

        if (data['error'] == null || data['error'].isEmpty) {
          if (mounted) {
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Search complete!')));
          }
        } else {
          setState(() {
            _errorMessage = data['error'];
          });
        }
      } else {
        setState(() {
          _errorMessage = 'Failed to search.';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Network error. Please check your connection.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          const SizedBox(height: 20),
          InputTextField(label: 'Search Item', isObscure: false),
          const SizedBox(height: 20),
          SizedBox(width: 350, height: 250, child: const SearchMap()),
          const SizedBox(height: 20),
          // Search results will be populated from API
        ],
      ),
    );
  }
}

class SearchMap extends StatefulWidget {
  const SearchMap({super.key});

  @override
  State<SearchMap> createState() => _SearchMapState();
}

class _SearchMapState extends State<SearchMap> {
  static const LatLng _pontoCentral = LatLng(28.6024274, -81.2000599);

  // A list that will hold our pins (markers)
  late final List<Marker> _markers;

  // Helper function to create a custom Marker (pin)
  // May change this to be more general and have a isItem bool that will be checked to determine how to treat a pin
  Marker _buildItemMarker({required LatLng point, required String itemName}) {
    //  Maybe one color for own lost items, another for all others?
    //  Not a requirment
    //  required Color color,
    return Marker(
      point: point,
      width: 95, // Fixed width that accommodates the longest name well
      height: 65, // Fixed height for the pin
      child: GestureDetector(
        onTap: () {
          // Show item details
        },
        // The visual content of the pin is a column with the icon and text
        child: Column(
          children: [
            const Icon(
              Icons.location_pin,
              //color: color,
              size: 40,
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(204),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                itemName,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    _markers = [
      // Markers will be populated from API
    ];

    return MapUCF(pontoCentral: _pontoCentral, markers: _markers, dragMarker: null,);
  }
}

//  Item Report Widgets
class ItemReport extends StatefulWidget {
  final String firstName;
  final String lastName;
  final String email;

  const ItemReport({
    super.key,
    required this.firstName,
    required this.lastName,
    required this.email,
  });

  @override
  ItemReportState createState() {
    return ItemReportState();
  }
}

class ItemReportState extends State<ItemReport> {
  final _itemReportKey = GlobalKey<FormState>();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descripController = TextEditingController();
  String _categoryText = '';
  final TextEditingController _imgController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  String _reporterName = '';
  String _reporterEmail = '';
  String _errorMessage = '';
  bool _isLoading = false;

  Future<void> _report() async {
    setState(() {
      _reporterName = widget.firstName;
      _reporterEmail = widget.email;
      _isLoading = true;
      _errorMessage = '';
    });

    //printToConsole(_reporterName);
    //printToConsole(_reporterEmail);

    try {
      final response = await http.post(
        Uri.parse('http://174.138.65.216:4000/api/items'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'title': _titleController.text,
          'description': _descripController.text,
          'category': _categoryText,
          'imageUrl': _imgController.text,
          'locationText': _locationController.text,
          'reporterName': _reporterName,
          'reporterEmail': _reporterEmail,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);

        if (data['error'] == null || data['error'].isEmpty) {
          if (mounted) {
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Report uploaded!')));
          }
        } else {
          setState(() {
            _errorMessage = data['error'];
          });
        }
      } else {
        setState(() {
          _errorMessage = 'Failed to submit report. Error code ${response.statusCode.toString()}';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Network error. Please check your connection.';
      });
    }
    finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Form(
        key: _itemReportKey,
        child: Column(
          children: [
            const SizedBox(height: 20),
            InputTextField(
              label: '*Item Name',
              isObscure: false,
              controller: _titleController,
              validator: (String? value) {
                return (value == null || value.isEmpty)
                    ? 'Please enter an item name!'
                    : null;
              },
            ),
            InputTextField(
              label: 'Item Description',
              isObscure: false,
              controller: _descripController,
            ),
            InputTextField(
              label: 'Building / Floor / Classroom Number',
              isObscure: false,
              controller: _locationController,
            ),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 20.0,
                vertical: 8.0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Category',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.primaryText,
                    ),
                  ),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: AppColors.inputBackground,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16.0,
                        vertical: 12.0,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8.0),
                        borderSide: const BorderSide(
                          color: AppColors.inputBorder,
                          width: 1.0,
                        ),
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'Electronic',
                        child: Text('Electronic'),
                      ),
                      DropdownMenuItem(
                        value: 'Apparel',
                        child: Text('Apparel'),
                      ),
                      DropdownMenuItem(
                        value: 'Container',
                        child: Text('Container'),
                      ),
                      DropdownMenuItem(
                        value: 'Personal',
                        child: Text('Personal'),
                      ),
                    ],
                    onChanged: (String? value) {
                      setState(() {
                        _categoryText = value ?? '';
                      });
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(width: 350, height: 250, child: const ReportMap()),
            const SizedBox(height: 20),
            BoldElevatedButton(
              text: 'Submit',
              onPressed: () {
                if (_itemReportKey.currentState!.validate()) {
                  _isLoading ? null : _report();
                }
              },
              minWidth: 200,
              minHeight: 50,
            ),
            if (_errorMessage.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Text(
                  _errorMessage,
                  style: const TextStyle(color: Colors.red, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
              ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class ReportMap extends StatefulWidget {
  const ReportMap({super.key});

  @override
  State<ReportMap> createState() => _ReportMapState();
}

class _ReportMapState extends State<ReportMap> {
  static const LatLng _pontoCentral = LatLng(28.6024274, -81.2000599);

  // A list that will hold our pins (markers)
  late final List<DragMarker> _dragMarkers;

  /// Helper function to create a custom Marker (pin)
  /// May change this to be more general and have a isItem bool that will be checked to determine how to treat a pin
  DragMarker _buildLocationMarker({required LatLng point}) {
    return DragMarker(
      key: GlobalKey<DragMarkerWidgetState>(),
      point: point,
      size: const Size(95, 65),
      builder: (_, pos, ___) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.location_pin,
              //color: color,
              size: 40,
            ),
          ],
        );
      },
      onDragEnd: (details, point) => debugPrint("End point $point"),
    );
  }

  @override
  Widget build(BuildContext context) {
    _dragMarkers = [
      _buildLocationMarker(point: _pontoCentral)
    ];

    return MapUCF(pontoCentral: _pontoCentral, markers: null, dragMarker: _dragMarkers,);
  }
}

//  Reusable Map Widgets
class MapUCF extends StatefulWidget {
  const MapUCF({
    super.key,
    required this.pontoCentral,
    this.markers,
    this.dragMarker
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
        if(widget.dragMarker != null)
          DragMarkers(markers: widget.dragMarker ?? [])
        else
          MarkerLayer(markers: widget.markers ?? [])
      ],
    );
  }
}

//  Notifications Inbox Widgets
class InboxDisplay extends StatelessWidget {
  const InboxDisplay({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text(
        'No notifications yet',
        style: TextStyle(fontSize: 18, color: Colors.grey),
      ),
    );
  }
}

//  Hamburger Menu Contents
class AboutModal extends StatelessWidget {
  const AboutModal({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleDialog(
      title: const Text('About'),
      children: <Widget>[
        const Padding(
          padding: EdgeInsets.all(20.0),
          child: Text(
            'Created for COP 4331\n\nGithub: https://github.com/DenimBeans/LostNFound',
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
