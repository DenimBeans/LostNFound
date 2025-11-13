import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_map/flutter_map.dart';
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
    //  Should make the scaffold into its own "Home Page" widget
    //  everything remains the same between the report and search
    //  page except for:
    //  The app bar title
    //  Which icon is shadowed in the bottom navigation
    //  And the actual content in the body
    return Scaffold(
      //  This doesn't actually need an arrow
      //  I'll rewrite the widget later so that the back arrow becomes optional
      //  + rename it from ArrowTitleBar to CenterTitleBar
      appBar: ArrowTitleBar(title: 'Search for Lost Items'),
      bottomNavigationBar: NavigationBar(
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
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            ListTile(
              title: const Text('Tracked Items'),
              onTap: () {
                // Update the state of the app.
                // ...
              },
            ),
            ListTile(
              title: const Text('Your Reports'),
              onTap: () {
                // Update the state of the app.
                // ...
              },
            ),
            ListTile(
              title: const Text('Account Settings'),
              onTap: () {
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
              },
            ),
            ContentPopup(title: 'About', simpleModal: AboutModal()),
            Spacer(),
            BoldElevatedButton(
              text: 'Log Out',
              onPressed: () {
                //  Run log out function
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
              minWidth: 40,
              minHeight: 30,
            ),
          ],
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
            ).showSnackBar(const SnackBar(content: Text('')));
          }
        } else {
          setState(() {
            _errorMessage = data['error'];
          });
        }
      } else {
        setState(() {
          _errorMessage = 'Failed to submit report.';
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
          InputTextField(label: 'Search Item', isObscure: false),
          SizedBox(
            width: 350,
            height: 250,
            //  Container widget is placeholder
            //  As this will be where we output the items, ListView may be better
            child: const SearchMap(),
          ),
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

  /// Helper function to create a custom Marker (pin)
  /// May change this to be more general and have a isItem bool that will be checked to determine how to treat a pin
  Marker _buildItemMarker({
    required LatLng point,
    required String itemName,
    //  Maybe one color for own lost items, another for all others?
    //  Not a requirment
    //  required Color color,
  }) {
    return Marker(
      point: point,
      width: 95, // Fixed width that accommodates the longest name well
      height: 65, // Fixed height for the pin
      child: GestureDetector(
        onTap: () {
          // For item search page: this should open a popup that displays the item's in-depth information
        },
        // The visual content of the pin is a column with the icon and text
        child: Column(
          children: [
            Icon(
              Icons.location_pin,
              //  color: color,
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
      _buildItemMarker(
        point: LatLng(28.6024274, -81.2000599),
        itemName: 'Student Union',
      ),
      //  This is where the item markers will be added
      //  Will be filled with data from the appropiate API
    ];

    return MapUCF(pontoCentral: _pontoCentral, markers: _markers);
  }
}

class MapUCF extends StatefulWidget {
  const MapUCF({super.key, required this.pontoCentral, required this.markers});

  final LatLng pontoCentral;
  final List<Marker> markers;

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
        // Layer 2: Our pins (markers)
        MarkerLayer(markers: widget.markers),
      ],
    );
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
  String _errorMessage = '';
  bool _isLoading = false;

  Future<void> _report() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

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
          'reporterName': widget.firstName,
          'reporterEmail': widget.email,
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
          _errorMessage = 'Failed to submit report.';
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
      child: Form(
        key: _itemReportKey,
        child: Column(
          children: [
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
            DropdownMenu(
              label: Text('Category'),
              onSelected: (String? category) {
                setState(() {
                  _categoryText = category!;
                });
              },
              dropdownMenuEntries: <DropdownMenuEntry<String>>[
                DropdownMenuEntry(value: 'Electronic', label: 'Electronic'),
                DropdownMenuEntry(value: 'Apparel', label: 'Apparel'),
                DropdownMenuEntry(value: 'Container', label: 'Container'),
                DropdownMenuEntry(value: 'Personal', label: 'Personal'),
              ],
            ),
            InputTextField(
              label: 'Image URL',
              isObscure: false,
              controller: _imgController,
            ),
            SizedBox(width: 350, height: 250, child: const ReportMap()),
            BoldElevatedButton(
              text: 'Submit',
              onPressed: () {
                if (_itemReportKey.currentState!.validate()) {
                  _isLoading ? null : _report();
                }
              },
              minWidth: 70,
              minHeight: 60,
            ),
            if (_errorMessage.isNotEmpty)
              Text(
                _errorMessage,
                style: const TextStyle(color: Colors.red, fontSize: 14),
                textAlign: TextAlign.center,
              ),
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
  late final List<Marker> _markers;

  /// Helper function to create a custom Marker (pin)
  /// May change this to be more general and have a isItem bool that will be checked to determine how to treat a pin
  Marker _buildLocationMarker({required LatLng point}) {
    return Marker(
      point: point,
      child: GestureDetector(
        onTap: () {
          // For item report page: this allows the user to move the pin around to signfiy where the item was lost
        },
        child: Icon(
          Icons.location_pin,
          //  color: color,
          size: 40,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    _markers = [
      _buildLocationMarker(point: LatLng(28.6024274, -81.2000599)),
      //  Only marker marker will be the one user can click and drag (similar to web app)
    ];

    return MapUCF(pontoCentral: _pontoCentral, markers: _markers);
  }
}

//  Notifications Inbox Widgets
class InboxDisplay extends StatelessWidget {
  const InboxDisplay({super.key});

  @override
  Widget build(BuildContext context) {
    // return ListView.builder(
    // itemBuilder:
    // );
    return Scaffold();
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
        Padding(
          padding: EdgeInsetsGeometry.all(20),
          //  Might want to find a way to change this so that the text itself is hyperlinked instead of
          //  just a plaintext link
          child: Text(
            'Created for COP 4331\n\nGithub: https://github.com/DenimBeans/LostNFound',
          ),
        ),
      ],
    );
  }
}

//  Moving these to be scrolled down to on the home pages instead of accessed through the hamburger menu
/*
//  User Tracked Items Widget
class TrackedItems extends StatelessWidget {
  const TrackedItems({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold();
  }
}

//  User Reported Items Widget
class SubmittedItems extends StatelessWidget {
  const SubmittedItems({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold();
  }
}
*/

//  Account Settings Widget
// Replace the AccountSettings class in home.dart with this

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
