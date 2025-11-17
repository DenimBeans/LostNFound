import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'dart:convert';
import 'main.dart';
import 'home.dart';

//  Item Search Widgets
class ItemSearch extends StatefulWidget {
  final String firstName;
  final String lastName;
  final String email;
  final String userId;

  const ItemSearch({
    super.key,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.userId,
  });

  @override
  ItemSearchState createState() {
    return ItemSearchState();
  }
}

class ItemSearchState extends State<ItemSearch> {
  //  Retrieve user coords

  /*
  /// When the location services are not enabled or permissions
  /// are denied the `Future` will return an error.
  Future<Position> _determinePosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Test if location services are enabled.
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      // Location services are not enabled don't continue
      // accessing the position and request users of the 
      // App to enable the location services.
      return Future.error('Location services are disabled.');
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        // Permissions are denied, next time you could try
        // requesting permissions again (this is also where
        // Android's shouldShowRequestPermissionRationale 
        // returned true. According to Android guidelines
        // your App should show an explanatory UI now.
        return Future.error('Location permissions are denied');
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      // Permissions are denied forever, handle appropriately. 
      return Future.error(
        'Location permissions are permanently denied, we cannot request permissions.');
    } 

    // When we reach here, permissions are granted and we can
    // continue accessing the position of the device.
    return await Geolocator.getCurrentPosition();
  }
  */

  Future<List<Item>> get itemsFuture => searchItems();

  Future<List<Item>> searchItems() async {
    //Position userPos = await _determinePosition();

    final queryParams = {
      //  Hardcoded UCF coordinates
      'lat': '28.6024274',
      'lng': '-81.2000599',
      /*
      'lat': userPos.latitude, // ?? '28.6024274',
      'lng': userPos.longitude, // ?? '-81.2000599',
      */
      'radius': '5',
    };

    final response = await http.get(
      Uri.http('knightfind.xyz:4000', '/api/items/nearby', queryParams),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final results = data['results'] as List;
      return results.map((e) => Item.fromJson(e)).toList();
    } else {
      throw Exception('Failted to load nearby lost items');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Center(
        child: SizedBox(
          height: 250,
          child: FutureBuilder<List<Item>>(
            future: itemsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                // until data is fetched, show loader
                return const CircularProgressIndicator();
              } else if (snapshot.hasError) {
                return Text('Error: ${snapshot.error}');
              } else if (snapshot.hasData) {
                // once data is fetched, pass it to the map
                final items = snapshot.data!;
                return SizedBox(
                  width: 350,
                  height: 250,
                  child: SearchMap(items: items, userId: widget.userId),
                );
              } else {
                // if no data, show simple Text
                return const Text("No data available");
              }
            },
          )
        )
      /*
      child: FutureBuilder<Position>(
        future: _determinePosition(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            debugPrint('error with user position future');
            return Text('Error: ${snapshot.error}');
          } else {
            Position userPos = snapshot.data!;
            return SizedBox(
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
                    // once data is fetched, pass it to the map
                    final items = snapshot.data!;
                    return SizedBox(
                      width: 350,
                      height: 250,
                      child: SearchMap(items: items, userId: widget.userId) //, userPos: userPos),
                    );
                  } else {
                    // if no data, show simple Text
                    return const Text("No data available");
                  }
                },
              ),
            );
          }
        }*/
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
              Expanded(flex: 1, child: Text(item.title)),
              SizedBox(width: 10),
            ],
          ),
        );
      },
    );
  }
}

class SearchMap extends StatefulWidget {
  const SearchMap({super.key, required this.items, required this.userId}); //, required this.userPos});
  final List<Item> items;
  final String userId;
  //final Position userPos;

  @override
  State<SearchMap> createState() => _SearchMapState();
}

class _SearchMapState extends State<SearchMap> {
  //  Hardcoded UCF coordinates for center
  static const LatLng _pontoCentral = LatLng(28.6024274, -81.2000599);

  //late final LatLng _pontoCentral = LatLng(widget.userPos.latitude, widget.userPos.longitude);

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
            builder: (BuildContext context) => ItemModal(item: item, userId: widget.userId),
          );
        },
        // Marker represented by icon on map
        child: Icon(
          Icons.location_pin,
          //color: color,
          size: 40,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    _markers = [
      // Markers will be populated from API
      for (var i = 0; i < widget.items.length; i++)
        _buildItemMarker(item: widget.items[i]),
    ];

    return MapUCF(
      pontoCentral: _pontoCentral,
      markers: _markers,
      dragMarker: null,
    );
  }
}

class ItemModal extends StatefulWidget {
  final Item item;
  final String userId;
  
  const ItemModal({
    super.key,
    required this.item,
    required this.userId
  });

  @override
  ItemModalState createState() {
    return ItemModalState();
  }
}

class ItemModalState extends State<ItemModal> {
  String _errorMessage = '';
  bool _isLoading = false;

  String itemId = '';
  String userId = '';

  Future<void> _track() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
      itemId = widget.item.itemId;
      userId = widget.userId;
    });

    try {
      final response = await http.post(
        Uri.parse('http://knightfind.xyz:4000/api/users/$userId/tracked-items/$itemId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': widget.userId,
          'itemId': widget.item.itemId
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