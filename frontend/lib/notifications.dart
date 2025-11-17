import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:convert';
import 'main.dart';
import 'home.dart';

class NotificationItem {
  final String itemId;
  final String title;
  final String? description;
  final String? category;
  final String? imageUrl;

  NotificationItem({
    required this.itemId,
    required this.title,
    this.description,
    this.category,
    this.imageUrl,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      itemId: json['_id'] ?? '',
      title: json['title'] ?? 'Unknown Item',
      description: json['description'] ?? '',
      category: json['category'] ?? '',
      imageUrl: (json['imageUrl'] != null && json['imageUrl'] != '')
          ? json['imageUrl']
          : null,
    );
  }
}

class Sender {
  final String id;
  final String firstName;
  final String lastName;

  Sender({required this.id, required this.firstName, required this.lastName});

  factory Sender.fromJson(Map<String, dynamic> json) {
    return Sender(
      id: json['_id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
    );
  }
}

class Notification {
  final String notificationId;
  final String userId;
  final String notifText;
  final bool isRead;
  final bool isMeetup;
  final String location;
  final DateTime? meetTime;
  final Sender? senderId;
  final NotificationItem? itemId;
  final DateTime createdAt;

  Notification({
    required this.notificationId,
    required this.userId,
    required this.notifText,
    required this.isRead,
    required this.isMeetup,
    required this.location,
    this.meetTime,
    this.senderId,
    this.itemId,
    required this.createdAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    // Safely parse userId - could be string or object
    String userIdStr = '';
    if (json['userId'] is String) {
      userIdStr = json['userId'];
    } else if (json['userId'] is Map) {
      userIdStr = json['userId']['_id'] ?? '';
    }

    // Safely parse meetTime
    DateTime? parsedMeetTime;
    if (json['meetTime'] != null) {
      try {
        if (json['meetTime'] is String) {
          parsedMeetTime = DateTime.parse(json['meetTime']);
        } else if (json['meetTime'] is DateTime) {
          parsedMeetTime = json['meetTime'];
        }
      } catch (e) {
        debugPrint('Error parsing meetTime: $e');
      }
    }

    // Safely parse createdAt
    DateTime parsedCreatedAt = DateTime.now();
    if (json['createdAt'] != null) {
      try {
        if (json['createdAt'] is String) {
          parsedCreatedAt = DateTime.parse(json['createdAt']);
        } else if (json['createdAt'] is DateTime) {
          parsedCreatedAt = json['createdAt'];
        }
      } catch (e) {
        debugPrint('Error parsing createdAt: $e');
      }
    }

    // Safely parse senderId
    Sender? parsedSender;
    if (json['senderId'] != null && json['senderId'] is Map) {
      try {
        parsedSender = Sender.fromJson(json['senderId']);
      } catch (e) {
        debugPrint('Error parsing senderId: $e');
      }
    }

    // Safely parse itemId
    NotificationItem? parsedItem;
    if (json['itemId'] != null) {
      if (json['itemId'] is Map) {
        try {
          parsedItem = NotificationItem.fromJson(json['itemId']);
        } catch (e) {
          debugPrint('Error parsing itemId: $e');
        }
      }
    }

    return Notification(
      notificationId: json['_id'] ?? '',
      userId: userIdStr,
      notifText: json['text'] ?? '',
      isRead: json['isRead'] ?? false,
      isMeetup: json['isMeetup'] ?? false,
      location: json['location'] ?? '',
      meetTime: parsedMeetTime,
      senderId: parsedSender,
      itemId: parsedItem,
      createdAt: parsedCreatedAt,
    );
  }
}

class InboxDisplay extends StatefulWidget {
  final String userId;

  const InboxDisplay({super.key, required this.userId});

  @override
  State<InboxDisplay> createState() => _InboxDisplayState();
}

class _InboxDisplayState extends State<InboxDisplay> {
  late Future<List<Notification>> _notifsFuture;
  String _errorMessage = '';

  // Helper function to format DateTime as EST string
  String _formatTimeAsEST(DateTime? dateTime) {
    if (dateTime == null) return '';
    final day = dateTime.day.toString().padLeft(2, '0');
    final month = dateTime.month.toString().padLeft(2, '0');
    final year = dateTime.year;
    final hours = dateTime.hour.toString().padLeft(2, '0');
    final minutes = dateTime.minute.toString().padLeft(2, '0');
    return '$month/$day/$year $hours:$minutes EST';
  }

  @override
  void initState() {
    super.initState();
    _notifsFuture = getNotifs();
  }

  Future<List<Notification>> getNotifs() async {
    try {
      final response = await http
          .get(
            Uri.parse(
              'http://knightfind.xyz:4000/api/users/${widget.userId}/notifications',
            ),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              throw Exception('Request timed out');
            },
          );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final results = data['results'] as List;
        return results.map((e) => Notification.fromJson(e)).toList();
      } else {
        throw Exception('Failed to load user notifications');
      }
    } catch (e) {
      debugPrint('❌ Error: $e');
      setState(() {
        _errorMessage = 'Error loading notifications: ${e.toString()}';
      });
      return [];
    }
  }

  Future<void> _markAsRead(String notificationId) async {
    try {
      final response = await http.patch(
        Uri.parse(
          'http://knightfind.xyz:4000/api/notifications/$notificationId/read',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        setState(() {
          _notifsFuture = getNotifs();
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Marked as read'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        throw Exception('Failed to mark as read');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _deleteNotification(String notificationId) async {
    try {
      final response = await http.delete(
        Uri.parse(
          'http://knightfind.xyz:4000/api/notifications/$notificationId',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        setState(() {
          _notifsFuture = getNotifs();
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Notification deleted'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        throw Exception('Failed to delete notification');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      final response = await http.patch(
        Uri.parse(
          'http://knightfind.xyz:4000/api/users/${widget.userId}/notifications/read-all',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        setState(() {
          _notifsFuture = getNotifs();
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('All notifications marked as read'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _deleteAll() async {
    try {
      final response = await http.delete(
        Uri.parse(
          'http://knightfind.xyz:4000/api/users/${widget.userId}/notifications',
        ),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        setState(() {
          _notifsFuture = getNotifs();
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('All notifications deleted'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showNotificationDetails(Notification notif) {
    // Automatically mark as read when opening the notification
    if (!notif.isRead) {
      _markAsRead(notif.notificationId);
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.secondaryBackground,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.75,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Expanded(
                          child: Text(
                            'Notification Details',
                            style: TextStyle(
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

                    // Notification Text
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: Text(
                        notif.notifText,
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Sender Info (if available)
                    if (notif.senderId != null) ...[
                      const Text(
                        'From',
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
                          '${notif.senderId!.firstName} ${notif.senderId!.lastName}',
                          style: const TextStyle(fontSize: 16),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Meetup Info (if it's a meetup notification)
                    if (notif.isMeetup) ...[
                      const Text(
                        'Meeting Location',
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
                          notif.location.isNotEmpty
                              ? notif.location
                              : 'Not specified',
                          style: const TextStyle(fontSize: 16),
                        ),
                      ),
                      const SizedBox(height: 16),

                      if (notif.meetTime != null) ...[
                        const Text(
                          'Meeting Time',
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
                            '${notif.meetTime!.month}/${notif.meetTime!.day}/${notif.meetTime!.year} at ${notif.meetTime!.hour}:${notif.meetTime!.minute.toString().padLeft(2, '0')}',
                            style: const TextStyle(fontSize: 16),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ],

                    // Item Info (if available)
                    if (notif.itemId != null) ...[
                      const Text(
                        'Related Item',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              notif.itemId!.title,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            if (notif.itemId!.description != null &&
                                notif.itemId!.description!.isNotEmpty)
                              Text(
                                notif.itemId!.description!,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                              ),
                            const SizedBox(height: 8),
                            if (notif.itemId!.category != null &&
                                notif.itemId!.category!.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.blue[100],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  notif.itemId!.category!,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.blue[900],
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            if (notif.itemId!.imageUrl != null &&
                                notif.itemId!.imageUrl!.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  notif.itemId!.imageUrl!,
                                  height: 150,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Container(
                                      height: 150,
                                      color: Colors.grey[300],
                                      child: const Center(
                                        child: Icon(
                                          Icons.broken_image,
                                          size: 50,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Meetup Response Buttons (only for meetup notifications)
                    if (notif.isMeetup && notif.senderId != null) ...[
                      const Text(
                        'Meetup Response',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: BoldElevatedButton(
                              text: 'Accept',
                              onPressed: () {
                                Navigator.pop(context);
                                _respondToMeetup(notif, 'Accept');
                              },
                              minWidth: double.infinity,
                              minHeight: 45,
                              backgroundColor: AppColors.successButton,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: BoldElevatedButton(
                              text: 'Contest',
                              onPressed: () {
                                Navigator.pop(context);
                                _showContestMeetupDialog(notif);
                              },
                              minWidth: double.infinity,
                              minHeight: 45,
                              backgroundColor: Colors.orange,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: BoldElevatedButton(
                              text: 'Deny',
                              onPressed: () {
                                Navigator.pop(context);
                                _respondToMeetup(notif, 'Deny');
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

                    // Standard Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: BoldElevatedButton(
                            text: 'Delete',
                            onPressed: () {
                              Navigator.pop(context);
                              _deleteNotification(notif.notificationId);
                            },
                            minWidth: double.infinity,
                            minHeight: 45,
                            backgroundColor: AppColors.secondaryButton,
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

  Future<void> _respondToMeetup(Notification notif, String responseType) async {
    try {
      // 1. Send notification to the other person
      String textToSender;
      String formattedTime = _formatTimeAsEST(notif.meetTime);

      if (responseType == 'Accept') {
        textToSender =
            'Meeting accepted, Location at ${notif.location} and the meeting will take place at $formattedTime';
      } else if (responseType == 'Deny') {
        textToSender = 'Your meetup request has been rejected.';
      } else {
        textToSender = '$responseType - ${notif.notifText}';
      }

      final notificationToSender = {
        'userId': notif.senderId!.id,
        'text': textToSender,
        'isMeetup': notif.isMeetup,
        'location': notif.location,
        'meetTime': notif.meetTime?.toIso8601String(),
        'senderId': widget.userId,
        'itemId': notif.itemId?.itemId ?? '',
      };

      final responseToSender = await http.post(
        Uri.parse('http://knightfind.xyz:4000/api/notifications'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(notificationToSender),
      );

      if (responseToSender.statusCode != 201) {
        throw Exception('Failed to send response to sender');
      }

      // 2. Send confirmation notification back to current user
      String confirmationText;
      if (responseType == 'Accept') {
        confirmationText =
            'You have accepted this meeting at Location at ${notif.location} and the meeting will take place at $formattedTime';
      } else if (responseType == 'Deny') {
        confirmationText =
            'You have denied this meeting at the location ${notif.location} at the time of $formattedTime';
      } else {
        // This shouldn't happen for Accept/Deny, but just in case
        confirmationText = 'You responded: $responseType';
      }

      final confirmationNotification = {
        'userId': widget.userId,
        'text': confirmationText,
        'isMeetup': false,
        'location': notif.location,
        'meetTime': notif.meetTime?.toIso8601String(),
        'senderId': widget.userId,
        'itemId': notif.itemId?.itemId ?? '',
      };

      final confirmationResponse = await http.post(
        Uri.parse('http://knightfind.xyz:4000/api/notifications'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(confirmationNotification),
      );

      if (confirmationResponse.statusCode != 201) {
        throw Exception('Failed to send confirmation notification');
      }

      // 3. Delete the original notification
      await _deleteNotification(notif.notificationId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Response sent: $responseType'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error sending response: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showContestMeetupDialog(Notification notif) {
    final TextEditingController locationController = TextEditingController(
      text: notif.location,
    );
    DateTime selectedDate = notif.meetTime ?? DateTime.now();
    TimeOfDay selectedTime = TimeOfDay.fromDateTime(selectedDate);

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Contest Meeting Details'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Location input
                    TextField(
                      controller: locationController,
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
                          setDialogState(() {
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
                          setDialogState(() {
                            selectedTime = picked;
                            selectedDate = DateTime(
                              selectedDate.year,
                              selectedDate.month,
                              selectedDate.day,
                              picked.hour,
                              picked.minute,
                            );
                          });
                        }
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () async {
                    Navigator.of(context).pop();

                    // Send contest notification with new details
                    try {
                      // 1. Send notification to the other person
                      String formattedOriginalTime = _formatTimeAsEST(
                        notif.meetTime,
                      );
                      final notificationToSender = {
                        'userId': notif.senderId!.id,
                        'text':
                            'The meetup at ${notif.location} at the time $formattedOriginalTime was contested.',
                        'isMeetup': true,
                        'location': locationController.text,
                        'meetTime': selectedDate.toIso8601String(),
                        'senderId': widget.userId,
                        'itemId': notif.itemId?.itemId ?? '',
                      };

                      final responseToSender = await http.post(
                        Uri.parse(
                          'http://knightfind.xyz:4000/api/notifications',
                        ),
                        headers: {'Content-Type': 'application/json'},
                        body: jsonEncode(notificationToSender),
                      );

                      if (responseToSender.statusCode != 201) {
                        throw Exception('Failed to send contest to sender');
                      }

                      // 2. Send confirmation notification back to current user
                      String formattedContestTime = _formatTimeAsEST(
                        selectedDate,
                      );
                      final confirmationText =
                          'You contested the meetup with new information, Location: ${locationController.text} Time: $formattedContestTime';

                      final confirmationNotification = {
                        'userId': widget.userId,
                        'text': confirmationText,
                        'isMeetup': false,
                        'location': locationController.text,
                        'meetTime': selectedDate.toIso8601String(),
                        'senderId': widget.userId,
                        'itemId': notif.itemId?.itemId ?? '',
                      };

                      final confirmationResponse = await http.post(
                        Uri.parse(
                          'http://knightfind.xyz:4000/api/notifications',
                        ),
                        headers: {'Content-Type': 'application/json'},
                        body: jsonEncode(confirmationNotification),
                      );

                      if (confirmationResponse.statusCode != 201) {
                        throw Exception(
                          'Failed to send confirmation notification',
                        );
                      }

                      // 3. Delete the original notification
                      await _deleteNotification(notif.notificationId);

                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Contest sent with new meeting details',
                            ),
                            backgroundColor: Colors.green,
                          ),
                        );
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Error: ${e.toString()}'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    }
                  },
                  child: const Text('Send Contest'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Action Buttons Bar
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Expanded(
                child: BoldElevatedButton(
                  text: 'Mark All Read',
                  onPressed: _markAllAsRead,
                  minWidth: double.infinity,
                  minHeight: 40,
                  backgroundColor: AppColors.secondaryButton,
                  textColor: AppColors.primaryText,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: BoldElevatedButton(
                  text: 'Delete All',
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (BuildContext context) {
                        return AlertDialog(
                          title: const Text('Delete All Notifications'),
                          content: const Text(
                            'Are you sure you want to delete all notifications?',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.of(context).pop(),
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                                _deleteAll();
                              },
                              child: const Text(
                                'Delete All',
                                style: TextStyle(color: Colors.red),
                              ),
                            ),
                          ],
                        );
                      },
                    );
                  },
                  minWidth: double.infinity,
                  minHeight: 40,
                  backgroundColor: AppColors.accentButton,
                ),
              ),
            ],
          ),
        ),

        // Error Message
        if (_errorMessage.isNotEmpty)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              _errorMessage,
              style: const TextStyle(color: Colors.red),
            ),
          ),

        // Notifications List
        Expanded(
          child: FutureBuilder<List<Notification>>(
            future: _notifsFuture,
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
                            _notifsFuture = getNotifs();
                          });
                        },
                        minWidth: 120,
                        minHeight: 45,
                      ),
                    ],
                  ),
                );
              } else if (snapshot.hasData) {
                final notifs = snapshot.data!;
                if (notifs.isEmpty) {
                  return RefreshIndicator(
                    onRefresh: () async {
                      setState(() {
                        _notifsFuture = getNotifs();
                      });
                      await _notifsFuture;
                    },
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.5,
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.notifications_none,
                                  size: 80,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 16),
                                const Text(
                                  'No notifications',
                                  style: TextStyle(
                                    fontSize: 18,
                                    color: Colors.grey,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Pull down to refresh',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[500],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async {
                    setState(() {
                      _notifsFuture = getNotifs();
                    });
                    await _notifsFuture;
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: notifs.length,
                    itemBuilder: (context, index) {
                      return _buildNotificationCard(notifs[index]);
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
    );
  }

  Widget _buildNotificationCard(Notification notif) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      color: notif.isRead ? Colors.white : Colors.blue[50],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => _showNotificationDetails(notif),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row with Status Badge
              Row(
                children: [
                  if (notif.isMeetup)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.purple,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.event, size: 14, color: Colors.white),
                          SizedBox(width: 4),
                          Text(
                            'MEETUP',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const Spacer(),
                  if (!notif.isRead)
                    Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Colors.blue,
                        shape: BoxShape.circle,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),

              // Notification Text
              Text(
                notif.notifText,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: notif.isRead
                      ? FontWeight.normal
                      : FontWeight.bold,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),

              // Sender and Time Info
              Row(
                children: [
                  if (notif.senderId != null) ...[
                    Icon(Icons.person, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      '${notif.senderId!.firstName} ${notif.senderId!.lastName}',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    _formatTimestamp(notif.createdAt),
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),

              // Action Buttons Row
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (!notif.isRead)
                    TextButton.icon(
                      onPressed: () => _markAsRead(notif.notificationId),
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Mark Read'),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.green,
                      ),
                    ),
                  TextButton.icon(
                    onPressed: () => _deleteNotification(notif.notificationId),
                    icon: const Icon(Icons.delete, size: 16),
                    label: const Text('Delete'),
                    style: TextButton.styleFrom(foregroundColor: Colors.red),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${timestamp.month}/${timestamp.day}/${timestamp.year}';
    }
  }
}
