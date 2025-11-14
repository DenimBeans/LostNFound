import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:io';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_dragmarker/flutter_map_dragmarker.dart';
import 'package:latlong2/latlong.dart';
import 'dart:convert';
import 'main.dart';
import 'home.dart';

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