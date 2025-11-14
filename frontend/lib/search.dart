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

  Future<List<Item>> get itemsFuture => searchItems();

  Future<List<Item>> searchItems() async {
    final queryParams = {
      //  Using UCF's coordinates for now
      //  Eventually will need to be replaced with user coords
      'queryLat':  28.6024274,
      'queryLong': -81.2000599,
      'queryRad': 5
    };

    final response = await http.get(
      Uri.http('http://174.138.65.216:4000', '/api/items', queryParams),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return data.map((e) =>Item.fromJson(e)).toList();
    } else {
      throw Exception('Failted to load nearby lost items');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          FutureBuilder<List<Item>>(
            future: itemsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                // until data is fetched, show loader
                return const CircularProgressIndicator();
              } else if (snapshot.hasData) {
                // once data is fetched, display it on screen (call buildPosts())
                final items = snapshot.data!;
                return tempBuildList(items);
              } else {
                // if no data, show simple Text
                return const Text("No data available");
              }
            }
          ),
          
          const SizedBox(height: 20),
          InputTextField(label: 'Search Item', isObscure: false),
          const SizedBox(height: 20),
          //SizedBox(width: 350, height: 250, child: const SearchMap()),
          const SizedBox(height: 20),
          // Search results will be populated from API
        ],
      ),
    );
  }
  // function to display fetched data on screen
  Widget tempBuildList(List<Item> items) {
    // ListView Builder to show data in a list
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Container(
          color: Colors.grey.shade300,
          margin: EdgeInsets.symmetric(vertical: 5, horizontal: 10),
          padding: EdgeInsets.symmetric(vertical: 5, horizontal: 5),
          height: 100,
          width: double.maxFinite,
          child: Row(
            children: [
              Expanded(flex: 1, child: Text(item.title!)),
              SizedBox(width: 10),
            ],
          ),
        );
      },
    );
  }
}

class SearchMap extends StatefulWidget {
  const SearchMap({
    super.key,
    required this.items
  });
  final List<Item> items;

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