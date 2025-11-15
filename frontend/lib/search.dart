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
  Future<List<Item>> get itemsFuture => searchItems();

  Future<List<Item>> searchItems() async {
    final queryParams = {
      //  Using UCF's coordinates for now
      //  Eventually will need to be replaced with user coords
      'lat':  '28.6024274',
      'lng': '-81.2000599',
      'radius': '5'
    };

    final response = await http.get(
      Uri.http('174.138.65.216:4000', '/api/items/nearby', queryParams),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final results = data['results'] as List;
      return results.map((e) =>Item.fromJson(e)).toList();
    } else {
      throw Exception('Failted to load nearby lost items');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [          
          SizedBox(
            height: 250, 
            //  To display items in ListView
            child: FutureBuilder<List<Item>>(
              future: itemsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  // until data is fetched, show loader
                  return const CircularProgressIndicator();
                } else if (snapshot.hasError) {
                  return Text('Error: ${snapshot.error}');
                } else if (snapshot.hasData) {
                  // once data is fetched, display it on screen (call buildPosts())
                  final items = snapshot.data!;
                  return SizedBox(width: 350, height: 250, child: SearchMap(items: items));
                } else {
                  // if no data, show simple Text
                  return const Text("No data available");
                }
              }
            ),
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
  Marker _buildItemMarker({required Item item}) {
    //  Maybe one color for own lost items, another for all others?
    //  Not a requirment
    //  required Color color,
    return Marker(
      point: LatLng(item.lat, item.lng),
      width: 95, // Fixed width that accommodates the longest name well
      height: 65, // Fixed height for the pin
      child: GestureDetector(
        onTap: () {
          // Show item details
          showDialog(
            context: context,
            builder: (BuildContext context) => ItemModal(item: item),
          );
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
                item.title,
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
      for(var i = 0; i < widget.items.length; i++)
        _buildItemMarker(item: widget.items[i]),
    ];

    return MapUCF(pontoCentral: _pontoCentral, markers: _markers, dragMarker: null,);
  }
}

class ItemModal extends StatefulWidget {
  final Item item;
  
  const ItemModal({
    super.key,
    required this.item
  });

  @override
  ItemModalState createState() {
    return ItemModalState();
  }
}

class ItemModalState extends State<ItemModal> {
  String _errorMessage = '';
  bool _isLoading = false;

  Future<void> _track() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final response = await http.post(
        Uri.parse('http://knightfind.xyz:4000/api/users/:userId/tracked-items/:itemId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          //'userId': ,
          //'itemId': widget.item.
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['error'] == null || data['error'].isEmpty) {
          if (mounted) {
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Tracking item!')));
          }
        } else {
          setState(() {
            _errorMessage = data['error'];
          });
        }
      } else {
        setState(() {
          _errorMessage = 'Failed to track item. Error code ${response.statusCode.toString()}';
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
    return SimpleDialog(
      title: Text(widget.item.title),
      children: <Widget>[
      Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.item.description ?? 'No description'),
            BoldElevatedButton(
              text: 'Track',
              onPressed: () {
                _isLoading ? null : _track();
              },
              minWidth: 20,
              minHeight: 30
            )
          ]
        )
      )
      ]
    );
  }
}