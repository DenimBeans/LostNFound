import 'dart:async';
import 'package:flutter/gestures.dart';
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
      var queryParams = <String, String>{
        'userId': widget.userId,
      };

      final uri = Uri.http(
        'knightfind.xyz:4000',
        '/api/users/${widget.userId}/tracked-items',
        queryParams,
      );

      debugPrint('🔍 Fetching items from: $uri'); // Debug log

      final response = await http
          .get(uri, headers: {'Content-Type': 'application/json'})
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              throw Exception('Request timed out');
            },
          );

      debugPrint('📡 Response status: ${response.statusCode}'); // Debug log
      debugPrint('📦 Response body: ${response.body}'); // Debug log

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final results = data['results'] as List;
        debugPrint('✅ Found ${results.length} items'); // Debug log
        return results.map((e) => Item.fromJson(e)).toList();
      } else {
        throw Exception(
          'Server returned ${response.statusCode}: ${response.body}',
        );
      }
    } catch (e) {
      debugPrint('❌ Error: $e'); // Debug log
      setState(() {
        _errorMessage = 'Error loading items: ${e.toString()}';
      });
      return []; // Return empty list instead of rethrowing
    }
  }

  Future<void> _removeTracking(String userId, String itemId) async {
    try {
      final response = await http.delete(
        Uri.parse('http://knightfind.xyz:4000/api/users/$userId/tracked-items/$itemId'),
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
          content: Text('Are you sure you want to stop tracking "${item.title}"?'),
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
              child: const Text('Stop Tracking', style: TextStyle(color: Colors.red)),
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
                            text: 'Found!',
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder: (BuildContext context) => MeetupModal(),
                              );
                            },
                            minWidth: double.infinity,
                            minHeight: 45,
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
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                     // decoration: BoxDecoration(
                     //   color: _getStatusColor(item.status),
                     //   borderRadius: BorderRadius.circular(12),
                     // ),
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

class MeetupModal extends StatefulWidget {
  const MeetupModal({super.key});

  @override
  State<MeetupModal> createState() => _MeetupModalState();
}

class _MeetupModalState extends State<MeetupModal> {
  //String? _selectedLocation;

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
              DatePicker(),
              TimePicker(),
              LocationPicker(),
              /* LocationPicker(
                onLocationSelected: (String location) {
                  _selectedLocation = location;
                }
              )*/
              BoldElevatedButton(
                text: 'Done!',
                minWidth: 60,
                minHeight: 30,
                onPressed: () {

                },
              )
            ]
          ),
        ),
      ],
    );
  }
}

class DatePicker extends StatefulWidget {
  const DatePicker({
    super.key,
  });

  @override
  State<DatePicker> createState() => _DatePickerState();
}

class _DatePickerState extends State<DatePicker> {
  DateTime? selectedDate;

  Future<void> _selectDate() async {
    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: DateTime(2025, 11, 17),
      firstDate: DateTime(2025),
      lastDate: DateTime(2026),
    );

    setState(() {
      selectedDate = pickedDate;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      spacing: 20,
      children: <Widget>[
        Text(
          selectedDate != null
              ? '${selectedDate!.day}/${selectedDate!.month}'
              : 'Select a date!',
        ),
        OutlinedButton(onPressed: _selectDate, child: const Text('Select Date')),
      ],
    );
  }
}

class TimePicker extends StatefulWidget {
  const TimePicker({
    super.key,
  });

  @override
  State<TimePicker> createState() => _TimePickerState();
}

class _TimePickerState extends State<TimePicker> {
  TimeOfDay? selectedTime;
  TimePickerEntryMode entryMode = TimePickerEntryMode.inputOnly;
  Orientation? orientation;
  TextDirection textDirection = TextDirection.ltr;
  MaterialTapTargetSize tapTargetSize = MaterialTapTargetSize.padded;
  bool use24HourTime = false;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      spacing: 20,
      children: <Widget>[
        Text(
          selectedTime != null
              ? selectedTime!.format(context)
              : 'Select a time!',
        ),
        ElevatedButton(
          child: const Text('Select time'),
          onPressed: () async {
            final TimeOfDay? time = await showTimePicker(
              context: context,
              initialTime: selectedTime ?? TimeOfDay.now(),
              initialEntryMode: entryMode,
              orientation: orientation,
              builder: (BuildContext context, Widget? child) {
                // We just wrap these environmental changes around the
                // child in this builder so that we can apply the
                // options selected above. In regular usage, this is
                // rarely necessary, because the default values are
                // usually used as-is.
                return Theme(
                  data: Theme.of(context).copyWith(materialTapTargetSize: tapTargetSize),
                  child: Directionality(
                    textDirection: textDirection,
                    child: MediaQuery(
                      data: MediaQuery.of(
                        context,
                      ).copyWith(alwaysUse24HourFormat: use24HourTime),
                      child: child!,
                    ),
                  ),
                );
              },
            );
            setState(() {
              selectedTime = time;
            });
          },
        ),
      ],
    );
  }
}

class LocationPicker extends StatefulWidget {
  //final Function(String location)? onLocationSelected;

  const LocationPicker({
    super.key,
    //this.onLocationSelected,
  });

  @override
  State<LocationPicker> createState() => _LocationPickerState();
}

class _LocationPickerState extends State<LocationPicker> {
  final TextEditingController _locationController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return InputTextField(
      label: 'Location',
      isObscure: false,
      controller: _locationController,
      validator: (String? value) {
        return (value == null || value.isEmpty)
            ? 'Please enter a location'
            : null;
      },
    );
  }
  /*
  List<String> _suggestions = [];
  Timer? _debounce;
  final TextEditingController _locationController = TextEditingController();  
  String _errorMessage = '';
  bool _isLoading = false;

  void _onSearchChanged(String search) {
  debugPrint('onSearchChanged called with: $search');
  if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      debugPrint('Debounce finished, calling _searchLocation');  
      _searchLocation(search);
    });
  }

  Future<void> _searchLocation(String search) async {
    debugPrint('_searchLocation called with: $search');
    setState(() {
      _isLoading = true;
      _errorMessage = '';
      _suggestions = [];
    });

    if (search.isEmpty) {
      debugPrint('Search empty, clearing suggestions');
      setState(() => _suggestions = []);
      return;
    }

    debugPrint('Setting loading to true');
    setState(() => _isLoading = true);

    try {
      debugPrint('call api');
      final response = await http.get(
        Uri.parse('https://nominatim.openstreetmap.org/search?q=$search&format=json&limit=5&addressdetails=1'),
        headers: {
          'User-Agent': 'KnightFind/1.0',
        },
      );

      debugPrint('Response status: ${response.statusCode}');
      debugPrint('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        debugPrint('Parsed ${data.length} results');

        setState(() {
          _suggestions = List<String>.from(
            data.map((item) =>
             item['display_name'].toString())
          );
          _isLoading = false;
        });

          debugPrint('Suggestions updated: ${_suggestions.length} items');  
      }
    } catch (e, stackTrace) {
      debugPrint('ERROR in _searchLocation: $e');  
      debugPrint('Stack trace: $stackTrace');
      setState(() {
        _errorMessage = 'Network error. Please check your connection.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('Building LocationPicker, suggestions count: ${_suggestions.length}');  // ADD THIS

    return Column(
      children: [
        TextField(
          controller: _locationController,
          decoration: InputDecoration(
            labelText: 'Meeting Location',
            border: OutlineInputBorder(),
            hintText: 'Search for a location',
            prefixIcon: Icon(Icons.search),
            suffixIcon: _isLoading 
              ? Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : _locationController.text.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.clear),
                      onPressed: () {
                        _locationController.clear();
                        setState(() => _suggestions = []);
                      },
                    )
                  : null,
          ),
          onChanged: _onSearchChanged,
        ),
        if (_suggestions.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 8),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(4),
            ),
            constraints: BoxConstraints(maxHeight: 200),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _suggestions.length,
              itemBuilder: (context, index) {
                final suggestion = _suggestions[index];
                return ListTile(
                  leading: Icon(Icons.location_on, color: Colors.red),
                  title: Text(
                    suggestion,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 14),
                  ),
                  onTap: () {
                    _locationController.text = suggestion;
                    if (widget.onLocationSelected != null) {
                      widget.onLocationSelected!(
                        suggestion,
                      );
                      setState(() => _suggestions = []);
                    }
                  },
                );
              },
            ),
          )
      ],
    );
  }
  
  @override
  void dispose() {
    _locationController.dispose();
    super.dispose();
  }
  */
}

class MeetingRequest extends StatefulWidget {
  final String userId;
  final String notifText;
  final Item item;

  const MeetingRequest({
    super.key,
    required this.userId,
    required this.notifText,
    required this.item,
  });

  @override
  State<MeetingRequest> createState() => _MeetingRequestState();
}

class _MeetingRequestState extends State<MeetingRequest> { 
  late Map<String, dynamic> userId; // Pass this
  late String text; // Pass this
  final bool isMeetup = true;
  late String meetLocation; // Use callback
  late DateTime meetDate; // Use callback
  late TimeOfDay meetHour; // Use callback
  late DateTime meetTime; // Recieve from date and hour
  late Item item = widget.item; // Pass this
  late String senderId; // Recieve from item
  late String itemId; // Recieve from item
  String _errorMessage = '';
  bool _isLoading = false;

  void getDate(DateTime date) {
    meetDate = date;
  }

  void getTime(TimeOfDay time) {
    meetHour = time;
  }

  void getLocation(String location) {
    meetLocation = location;
  }

  @override
  void initState() {
    senderId = widget.userId;
    text = widget.notifText;
    item = widget.item;
    userId = {
      'firstName': item.reporterFName,
      'lastName': item.reporterLName,
      'email': item.reporterEmail
    } as Map<String, dynamic>;
    meetTime = DateTime(
      meetDate.year,
      meetDate.month,
      meetDate.day,
      meetHour.hour,
      meetHour.minute
    );
    itemId = item.itemId;
    debugPrint('userId: $userId\ntext: $text\nlocation $meetLocation\nmeetTime: ${meetTime.year}/${meetTime.month}/${meetTime.day}/${meetTime.hour}/${meetTime.minute}\nsenderId: $senderId\nitemId: $itemId');
  }

  Future<void> _sendFoundNotif(String senderId, Item item) async {
    try {
      final response = await http.post(
        Uri.parse('http://knightfind.xyz:4000/api/notificatoins'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'text': text,
          'isMeetup': isMeetup,
          'location': meetLocation,
          'meetTime': meetTime,
          'senderId': senderId,
          'itemId': itemId
        })
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['error'] == null || data['error'].isEmpty) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Notification sent!')),
            );
          }
        } else {          
          setState(() {
            _errorMessage = data['error'];
          });
        }
      }
      //  More error handling goes here
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error sending meeting notifcation: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox.shrink();
  }
}