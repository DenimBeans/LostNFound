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

//  Item Report Widgets
class ItemReport extends StatefulWidget {
  final String firstName;
  final String lastName;
  final String email;
  final String userId;

  const ItemReport({
    super.key,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.userId
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
  final TextEditingController _imgURLController = TextEditingController();
  String _categoryText = '';
  final TextEditingController _imgController = TextEditingController();
  LatLng _itemPosition = LatLng(28.6024274, -81.2000599);  //  Initial value UCF center
  String _errorMessage = '';
  bool _isLoading = false;

  //  Update the stored position after the marker is moved
  void _updateMarkerPosition(LatLng draggedTo) {
    _itemPosition = draggedTo;
  }

  Future<void> _report() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    debugPrint("End point $_itemPosition");

    try {
      final response = await http.post(
        Uri.parse('http://knightfind.xyz:4000/api/items'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'title': _titleController.text,
          'description': _descripController.text,
          'category': _categoryText,
          'imageUrl': _imgURLController.text,
          //'locationText': _locationController.text,
          'userId' : widget.userId,
          //'reporterName': widget.firstName,
          //'reporterEmail': widget.email,
          'lat': _itemPosition.latitude,
          'lng': _itemPosition.longitude
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
              label: 'Image URL',
              isObscure: false,
              controller: _imgURLController,
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
            SizedBox(
              width: 350,
              height: 250,
              child: ReportMap(positionedItem: _updateMarkerPosition)
            ),
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
  ReportMap({
    super.key,
    required this.positionedItem
  });
  final ValueChanged<LatLng> positionedItem;

  @override
  State<ReportMap> createState() => _ReportMapState();
}

class _ReportMapState extends State<ReportMap> {
  static const LatLng _pontoCentral = LatLng(28.6024274, -81.2000599);

  //  late final List<DragMarker> _dragMarkers;

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
      onDragEnd: (details, point) => widget.positionedItem(point), //debugPrint("End point $point"),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dragMarkers = [
      _buildLocationMarker(point: _pontoCentral)
    ];

    return MapUCF(pontoCentral: _pontoCentral, markers: null, dragMarker: dragMarkers,);
  }
}