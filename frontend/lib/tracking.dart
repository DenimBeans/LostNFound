import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'main.dart';
import 'home.dart';

class TrackedItems extends StatefulWidget {
  final String userId;
  final String firstName;
  final String lastName;

  const TrackedItems({
    super.key,
    required this.userId,
    required this.firstName,
    required this.lastName,
  });

  @override
  TrackedItemsState createState() => TrackedItemsState();
}

class TrackedItemsState extends State<TrackedItems> {
  String _errorMessage = '';
  late Future<List<Item>> _itemsFuture;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _itemsFuture = getTrackedItems();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<List<Item>> getTrackedItems() async {
    try {
      // Build query parameters
      var queryParams = <String, String>{'userId': widget.userId};

      final uri = Uri.http(
        'knightfind.xyz:4000',
        '/api/users/${widget.userId}/tracked-items',
        queryParams,
      );

      debugPrint('🔍 Fetching items from: $uri');

      final response = await http
          .get(uri, headers: {'Content-Type': 'application/json'})
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              throw Exception('Request timed out');
            },
          );

      debugPrint('📡 Response status: ${response.statusCode}');
      debugPrint('📦 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final results = data['results'] as List;
        debugPrint('✅ Found ${results.length} items');
        return results.map((e) => Item.fromJson(e)).toList();
      } else {
        throw Exception(
          'Server returned ${response.statusCode}: ${response.body}',
        );
      }
    } catch (e) {
      debugPrint('❌ Error: $e');
      setState(() {
        _errorMessage = 'Error loading items: ${e.toString()}';
      });
      return []; // Return empty list instead of rethrowing
    }
  }

  Future<void> _removeTracking(String userId, String itemId) async {
    try {
      final response = await http.delete(
        Uri.parse(
          'http://knightfind.xyz:4000/api/users/$userId/tracked-items/$itemId',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Stopped tracking item!'),
              backgroundColor: Colors.green,
            ),
          );
          setState(() {
            _itemsFuture = getTrackedItems(); // Refresh the list
          });
        }
      } else {
        throw Exception('Failed to remove item');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error removing tracked item: ${e.toString()}'),
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
          title: const Text('Remove Tracking'),
          content: Text(
            'Are you sure you want to stop tracking "${item.title}"?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _removeTracking(widget.userId, item.itemId);
              },
              child: const Text(
                'Stop Tracking',
                style: TextStyle(color: Colors.red),
              ),
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
                                  /* Container(
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
                                  ),*/
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
                            text: item.status == 'found'
                                ? 'Already Found'
                                : 'Found!',
                            onPressed: item.status == 'found'
                                ? null
                                : () {
                                    showDialog(
                                      context: context,
                                      builder: (BuildContext context) =>
                                          MeetupModal(
                                            userId: widget.userId,
                                            item: item,
                                            finderFirstName: widget.firstName,
                                            finderLastName: widget.lastName,
                                            onMeetupScheduled: () {
                                              // Refresh the tracked items list after scheduling
                                              setState(() {
                                                _itemsFuture =
                                                    getTrackedItems();
                                              });
                                            },
                                          ),
                                    );
                                  },
                            minWidth: double.infinity,
                            minHeight: 45,
                            backgroundColor: item.status == 'found'
                                ? Colors.grey
                                : AppColors.primaryButton,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: BoldElevatedButton(
                            text: 'Remove',
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.mainBackground,
      appBar: ArrowTitleBar(
        title: 'Your Tracked Items',
        backgroundColor: AppColors.mainBackground,
      ),
      body: Column(
        children: [
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
                              _itemsFuture = getTrackedItems();
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
                            'Not tracking any items',
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
                        _itemsFuture = getTrackedItems();
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

class MeetupModal extends StatefulWidget {
  final String userId;
  final Item item;
  final String finderFirstName;
  final String finderLastName;
  final Function(DateTime)? onDateSelected;
  final Function(TimeOfDay)? onTimeSelected;
  final Function(String)? onLocationSelected;
  final VoidCallback? onMeetupScheduled;

  const MeetupModal({
    super.key,
    required this.userId,
    required this.item,
    required this.finderFirstName,
    required this.finderLastName,
    this.onDateSelected,
    this.onTimeSelected,
    this.onLocationSelected,
    this.onMeetupScheduled,
  });

  @override
  State<MeetupModal> createState() => _MeetupModalState();
}

class _MeetupModalState extends State<MeetupModal> {
  @override
  Widget build(BuildContext context) {
    return SimpleDialog(
      title: const Text('Schedule Meeting'),
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Congratulations on finding a lost item!',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              const Text(
                'Now it\'s time to schedule a time and place to return it',
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 4),
              MeetingRequest(
                userId: widget.userId,
                item: widget.item,
                finderFirstName: widget.finderFirstName,
                finderLastName: widget.finderLastName,
                onMeetupScheduled: widget.onMeetupScheduled,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class MeetingRequest extends StatefulWidget {
  final String userId;
  final Item item;
  final String finderFirstName;
  final String finderLastName;
  final VoidCallback? onMeetupScheduled;

  const MeetingRequest({
    super.key,
    required this.userId,
    required this.item,
    required this.finderFirstName,
    required this.finderLastName,
    this.onMeetupScheduled,
  });

  @override
  State<MeetingRequest> createState() => _MeetingRequestState();
}

class _MeetingRequestState extends State<MeetingRequest> {
  late String userId;
  late String text;
  final bool isMeetup = true;
  final TextEditingController _locationController = TextEditingController();
  late String meetLocation = '';
  late Item item = widget.item;
  late String senderId;
  String? itemId;

  late DateTime selectedDate;
  late TimeOfDay selectedTime;

  // Helper to convert EST local time to UTC for backend
  String _convertESTToUTC(DateTime estLocalTime) {
    // The selectedDate is device-local time which we're treating as "EST time"
    // To convert EST to UTC: add 5 hours (EST is UTC-5)
    // We create a NEW DateTime in UTC with the adjusted time
    final utcTime = DateTime.utc(
      estLocalTime.year,
      estLocalTime.month,
      estLocalTime.day,
      estLocalTime.hour + 5,
      estLocalTime.minute,
      estLocalTime.second,
    );
    return utcTime.toIso8601String();
  }

  @override
  void initState() {
    super.initState();
    senderId = widget.userId;
    item = widget.item;
    userId = item.reporterUserId;
    itemId = item.itemId;

    selectedDate = DateTime.now().add(Duration(hours: 1));
    selectedTime = TimeOfDay(
      hour: selectedDate.hour,
      minute: selectedDate.minute,
    );

    debugPrint('Initialized: senderId=$senderId, itemId=$itemId');
  }

  @override
  void dispose() {
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _updateItemStatus(String itemId) async {
    try {
      final response = await http.patch(
        Uri.parse('http://knightfind.xyz:4000/api/items/$itemId/status'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'status': 'found'}),
      );

      if (response.statusCode != 200) {
        debugPrint('Failed to update item status: ${response.statusCode}');
      } else {
        debugPrint('Item status updated to found');
      }
    } catch (e) {
      debugPrint('Error updating item status: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Location input
        TextField(
          controller: _locationController,
          decoration: const InputDecoration(
            labelText: 'Location',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),

        // Date picker
        ListTile(
          title: const Text('Date'),
          subtitle: Text(
            '${selectedDate.month}/${selectedDate.day}/${selectedDate.year}',
          ),
          trailing: const Icon(Icons.calendar_today),
          onTap: () async {
            final DateTime? picked = await showDatePicker(
              context: context,
              initialDate: selectedDate,
              firstDate: DateTime.now(),
              lastDate: DateTime(2026),
            );
            if (picked != null) {
              setState(() {
                selectedDate = DateTime(
                  picked.year,
                  picked.month,
                  picked.day,
                  selectedTime.hour,
                  selectedTime.minute,
                );
              });
            }
          },
        ),

        // Time picker
        ListTile(
          title: const Text('Time'),
          subtitle: Text(
            '${selectedTime.hour}:${selectedTime.minute.toString().padLeft(2, '0')}',
          ),
          trailing: const Icon(Icons.access_time),
          onTap: () async {
            final TimeOfDay? picked = await showTimePicker(
              context: context,
              initialTime: selectedTime,
            );
            if (picked != null) {
              setState(() {
                selectedTime = picked;
                selectedDate = DateTime(
                  selectedDate.year,
                  selectedDate.month,
                  selectedDate.day,
                  picked.hour,
                  picked.minute,
                );
                debugPrint('After time picker - selectedDate: $selectedDate');
              });
            }
          },
        ),

        BoldElevatedButton(
          text: 'Done!',
          minWidth: 60,
          minHeight: 30,
          onPressed: () async {
            // Validate fields
            if (_locationController.text.isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Please enter a location')),
              );
              return;
            }
            if (!selectedDate.isAfter(DateTime.now())) {
              debugPrint(
                'selected date not in future. selected date: $selectedDate cur ${DateTime.now()}',
              );
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Please select a future date and time'),
                ),
              );
              return;
            }

            try {
              debugPrint('selectedDate before payload: $selectedDate');
              debugPrint(
                'selectedDate hour: ${selectedDate.hour}, minute: ${selectedDate.minute}',
              );

              // Create the notification text with finder's name
              String notificationText =
                  '${widget.finderFirstName} ${widget.finderLastName} has found your item and wants to meet up!';

              final notificationToSender = {
                'userId': userId,
                'text': notificationText,
                'isMeetup': isMeetup,
                'location': _locationController.text,
                'meetTime': _convertESTToUTC(selectedDate),
                'senderId': senderId,
                'itemId': itemId ?? '',
              };

              final responseToSender = await http.post(
                Uri.parse('http://knightfind.xyz:4000/api/notifications'),
                headers: {'Content-Type': 'application/json'},
                body: jsonEncode(notificationToSender),
              );

              if (responseToSender.statusCode != 201) {
                throw Exception(
                  'Failed to send meet request ${responseToSender.statusCode}',
                );
              }

              // Update item status to "found"
              await _updateItemStatus(itemId!);

              // Show success message
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Meeting request sent successfully!'),
                    backgroundColor: Colors.green,
                  ),
                );

                // Call the callback to refresh the list
                widget.onMeetupScheduled?.call();

                // Close the dialog
                Navigator.of(context).pop();
              }
            } catch (e) {
              debugPrint('err: ${e.toString()}');
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Error: ${e.toString()}'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            }
          },
        ),
      ],
    );
  }
}
