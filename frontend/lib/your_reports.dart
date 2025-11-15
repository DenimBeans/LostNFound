import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'main.dart';
import 'home.dart';
import 'edit_item_page.dart';

class YourReports extends StatefulWidget {
  final String userId;
  final String firstName;
  final String lastName;

  const YourReports({
    super.key,
    required this.userId,
    required this.firstName,
    required this.lastName,
  });

  @override
  YourReportsState createState() => YourReportsState();
}

class YourReportsState extends State<YourReports> {
  String _selectedFilter = 'all';
  String _selectedCategory = 'all';
  String _errorMessage = '';
  late Future<List<Item>> _itemsFuture;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _itemsFuture = getUserItems();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<List<Item>> getUserItems() async {
    try {
      // Build query parameters
      var queryParams = <String, String>{
        'userId': widget.userId, // Filter by current user's items
      };

      // Add status filter if not 'all'
      if (_selectedFilter != 'all') {
        queryParams['status'] = _selectedFilter;
      }

      // Add category filter if not 'all'
      if (_selectedCategory != 'all') {
        queryParams['category'] = _selectedCategory;
      }

      // Add search query if not empty
      if (_searchQuery.isNotEmpty) {
        queryParams['search'] = _searchQuery;
      }

      final uri = Uri.http('knightfind.xyz:4000', '/api/items', queryParams);

      print('🔍 Fetching items from: $uri'); // Debug log

      final response = await http
          .get(uri, headers: {'Content-Type': 'application/json'})
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              throw Exception('Request timed out');
            },
          );

      print('📡 Response status: ${response.statusCode}'); // Debug log
      print('📦 Response body: ${response.body}'); // Debug log

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final results = data['results'] as List;
        print('✅ Found ${results.length} items'); // Debug log
        return results.map((e) => Item.fromJson(e)).toList();
      } else {
        throw Exception(
          'Server returned ${response.statusCode}: ${response.body}',
        );
      }
    } catch (e) {
      print('❌ Error: $e'); // Debug log
      setState(() {
        _errorMessage = 'Error loading items: ${e.toString()}';
      });
      return []; // Return empty list instead of rethrowing
    }
  }

  Future<void> _deleteItem(String itemId) async {
    try {
      final response = await http.delete(
        Uri.parse('http://knightfind.xyz:4000/api/items/$itemId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Item deleted successfully'),
              backgroundColor: Colors.green,
            ),
          );
          setState(() {
            _itemsFuture = getUserItems(); // Refresh the list
          });
        }
      } else {
        throw Exception('Failed to delete item');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error deleting item: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showDeleteConfirmation(Item item) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Delete Item'),
          content: Text('Are you sure you want to delete "${item.title}"?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _deleteItem(item.itemId);
              },
              child: const Text('Delete', style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }

  void _showItemDetails(Item item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.secondaryBackground,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.9,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header with title and close button
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            item.title,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Map showing item location
                    SizedBox(
                      height: 250,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: MapUCF(
                          pontoCentral: LatLng(item.lat, item.lng),
                          markers: [
                            Marker(
                              point: LatLng(item.lat, item.lng),
                              width: 95,
                              height: 65,
                              child: Column(
                                children: [
                                  const Icon(
                                    Icons.location_pin,
                                    size: 40,
                                    color: Colors.red,
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 5,
                                      vertical: 2,
                                    ),
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
                          ],
                          dragMarker: null,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Description section
                    const Text(
                      'Description',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Text(
                        item.description ?? 'No description provided.',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Category section
                    const Text(
                      'Category',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Text(
                        item.category ?? '---',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Status badge
                    Row(
                      children: [
                        const Text(
                          'Status: ',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: _getStatusColor(item.status),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            item.status.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Image if available
                    if (item.imageUrl != null && item.imageUrl!.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Image',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              item.imageUrl!,
                              height: 200,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  height: 200,
                                  color: Colors.grey[300],
                                  child: const Center(
                                    child: Icon(Icons.broken_image, size: 50),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),

                    // Action buttons
                    Row(
                      children: [
                        Expanded(
                          child: BoldElevatedButton(
                            text: 'Edit',
                            onPressed: () {
                              Navigator.pop(
                                context,
                              ); // Close the bottom sheet first

                              // Navigate to edit page and wait for result
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      EditItemPage(item: item),
                                ),
                              ).then((result) {
                                // If edit was successful, refresh the list
                                if (result == true) {
                                  setState(() {
                                    _itemsFuture = getUserItems();
                                  });
                                }
                              });
                            },
                            minWidth: double.infinity,
                            minHeight: 45,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: BoldElevatedButton(
                            text: 'Delete',
                            onPressed: () {
                              Navigator.pop(context);
                              _showDeleteConfirmation(item);
                            },
                            minWidth: double.infinity,
                            minHeight: 45,
                            backgroundColor: AppColors.accentButton,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'lost':
        return Colors.orange;
      case 'found':
        return Colors.green;
      case 'pending':
        return Colors.blue;
      case 'claimed':
        return Colors.purple;
      case 'returned':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _getEmptyMessage() {
    if (_searchQuery.isNotEmpty) {
      return 'No items found matching "$_searchQuery"';
    }

    if (_selectedFilter != 'all' && _selectedCategory != 'all') {
      return 'No $_selectedFilter ${_selectedCategory} items';
    }

    if (_selectedFilter != 'all') {
      return 'No $_selectedFilter items';
    }

    if (_selectedCategory != 'all') {
      return 'No $_selectedCategory items';
    }

    return 'No items reported yet';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.mainBackground,
      appBar: ArrowTitleBar(
        title: 'Your Reports',
        backgroundColor: AppColors.mainBackground,
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by item name...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                            _itemsFuture =
                                getUserItems(); // Refresh when cleared
                          });
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                  _itemsFuture = getUserItems(); // Refresh on search
                });
              },
            ),
          ),

          // Status filter buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Status',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All', 'all', true),
                      const SizedBox(width: 8),
                      _buildFilterChip('Lost', 'lost', true),
                      const SizedBox(width: 8),
                      _buildFilterChip('Found', 'found', true),
                      const SizedBox(width: 8),
                      _buildFilterChip('Pending', 'pending', true),
                      const SizedBox(width: 8),
                      _buildFilterChip('Claimed', 'claimed', true),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Category filter buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Category',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All', 'all', false),
                      const SizedBox(width: 8),
                      _buildFilterChip('Electronic', 'Electronic', false),
                      const SizedBox(width: 8),
                      _buildFilterChip('Apparel', 'Apparel', false),
                      const SizedBox(width: 8),
                      _buildFilterChip('Container', 'Container', false),
                      const SizedBox(width: 8),
                      _buildFilterChip('Personal', 'Personal', false),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Error message
          if (_errorMessage.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                _errorMessage,
                style: const TextStyle(color: Colors.red),
              ),
            ),

          // Items list
          Expanded(
            child: FutureBuilder<List<Item>>(
              key: ValueKey(
                _selectedFilter,
              ), // Force rebuild when filter changes
              future: _itemsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 60,
                          color: Colors.red,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Error: ${snapshot.error}',
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        BoldElevatedButton(
                          text: 'Retry',
                          onPressed: () {
                            setState(() {
                              _itemsFuture = getUserItems();
                            });
                          },
                          minWidth: 120,
                          minHeight: 45,
                        ),
                      ],
                    ),
                  );
                } else if (snapshot.hasData) {
                  final items = snapshot.data!;
                  if (items.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.inventory_2_outlined,
                            size: 80,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _getEmptyMessage(),
                            style: const TextStyle(
                              fontSize: 18,
                              color: Colors.grey,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () async {
                      setState(() {
                        _itemsFuture = getUserItems();
                      });
                      await _itemsFuture;
                    },
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        return _buildItemCard(items[index]);
                      },
                    ),
                  );
                } else {
                  return const Center(child: Text("No data available"));
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, bool isStatusFilter) {
    final isSelected = isStatusFilter
        ? _selectedFilter == value
        : _selectedCategory == value;

    return GestureDetector(
      onTap: () {
        setState(() {
          if (isStatusFilter) {
            _selectedFilter = value;
          } else {
            _selectedCategory = value;
          }
          _itemsFuture = getUserItems(); // Refresh for any filter change
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryButton : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primaryButton : Colors.grey[300]!,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildItemCard(Item item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => _showItemDetails(item),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Item image or placeholder
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          item.imageUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const Icon(
                              Icons.image_not_supported,
                              size: 40,
                            );
                          },
                        ),
                      )
                    : const Icon(Icons.inventory_2, size: 40),
              ),
              const SizedBox(width: 16),

              // Item details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    if (item.category != null && item.category!.isNotEmpty)
                      Text(
                        item.category!,
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(item.status),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        item.status.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Arrow icon
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
