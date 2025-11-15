import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'main.dart';
import 'home.dart';

class EditItemPage extends StatefulWidget {
  final Item item;

  const EditItemPage({super.key, required this.item});

  @override
  EditItemPageState createState() => EditItemPageState();
}

class EditItemPageState extends State<EditItemPage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _imageUrlController;
  late String _selectedCategory;
  late LatLng _markerPosition;
  String _errorMessage = '';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Initialize controllers with current item data
    _titleController = TextEditingController(text: widget.item.title);
    _descriptionController = TextEditingController(
      text: widget.item.description ?? '',
    );
    _imageUrlController = TextEditingController(
      text: widget.item.imageUrl ?? '',
    );
    _selectedCategory = widget.item.category ?? 'Electronic';
    _markerPosition = LatLng(widget.item.lat, widget.item.lng);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  Future<void> _updateItem() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final updateData = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'category': _selectedCategory,
        'imageUrl': _imageUrlController.text.trim(),
        'location': {
          'type': 'Point',
          'coordinates': [_markerPosition.longitude, _markerPosition.latitude],
        },
      };

      final response = await http
          .patch(
            Uri.parse(
              'http://knightfind.xyz:4000/api/items/${widget.item.itemId}',
            ),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(updateData),
          )
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              throw Exception('Request timed out');
            },
          );

      print('📡 Response status: ${response.statusCode}');
      print('📦 Response body: ${response.body}');

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Item updated successfully'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true); // Return true to indicate success
        }
      } else {
        final data = jsonDecode(response.body);
        throw Exception(data['error'] ?? 'Failed to update item');
      }
    } catch (e) {
      print('❌ Error: $e');
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.mainBackground,
      appBar: ArrowTitleBar(
        title: 'Edit Item',
        backgroundColor: AppColors.mainBackground,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Error message
            if (_errorMessage.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              ),

            // Map with draggable marker
            const Text(
              'Location',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 250,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: FlutterMap(
                  options: MapOptions(
                    initialCenter: _markerPosition,
                    initialZoom: 17,
                    onTap: (tapPosition, point) {
                      setState(() {
                        _markerPosition = point;
                      });
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.app',
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: _markerPosition,
                          width: 80,
                          height: 80,
                          child: const Icon(
                            Icons.location_pin,
                            size: 50,
                            color: Colors.red,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap on the map to change location',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 20),

            // Item Title
            const Text(
              'Item Name',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _titleController,
              decoration: InputDecoration(
                hintText: 'Enter item name',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Item name is required';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),

            // Description
            const Text(
              'Description',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Enter item description',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Description is required';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),

            // Category
            const Text(
              'Category',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedCategory,
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              items: const [
                DropdownMenuItem(
                  value: 'Electronic',
                  child: Text('Electronic'),
                ),
                DropdownMenuItem(value: 'Apparel', child: Text('Apparel')),
                DropdownMenuItem(value: 'Container', child: Text('Container')),
                DropdownMenuItem(value: 'Personal', child: Text('Personal')),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedCategory = value!;
                });
              },
            ),
            const SizedBox(height: 20),

            // Image URL
            const Text(
              'Image URL (Optional)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _imageUrlController,
              decoration: InputDecoration(
                hintText: 'Enter image URL',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            const SizedBox(height: 30),

            // Save Button
            BoldElevatedButton(
              text: _isLoading ? 'Updating...' : 'Save Changes',
              onPressed: () {
                if (!_isLoading) {
                  _updateItem();
                }
              },
              minWidth: double.infinity,
              minHeight: 50,
            ),
          ],
        ),
      ),
    );
  }
}
