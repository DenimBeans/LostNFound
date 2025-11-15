import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:convert';
import 'main.dart';
import 'home.dart';

class Sender {
  final String id;
  final String firstName;
  final String lastName;

  Sender({required this.id, required this.firstName, required this.lastName});
}

//  Notifications Inbox Widgets
class Notification {
  final String userId;
  final String notifText;
  final bool isRead;
  final bool isMeetup;
  final String location;
  final DateTime? meetTime;
  final Sender? senderId;
  final Item? itemId;

  Notification({
    required this.userId,
    required this.notifText,
    required this.isRead,
    required this.isMeetup,
    required this.location,
    this.meetTime,
    this.senderId,
    this.itemId,
  });
  
  factory Notification.fromJson(Map<String, dynamic> json) {
    DateTime notMeeting = DateTime(2025);
    return Notification(
      userId: json['userId'],
      notifText: json['text'],
      isRead: json['isRead'],
      isMeetup: json['isMeetup'],
      location: json['location'],
      meetTime: json['meetTime'] ?? notMeeting,
      senderId: json['senderId'] ?? '',
      itemId: json['itemId'] ?? ''
    );
  }
}

class InboxDisplay extends StatelessWidget {
  final String userId;

  const InboxDisplay({super.key, required this.userId});

  Future<List<Notification>> get notifsFuture => getNotifs();

  Future<List<Notification>> getNotifs() async {
    final response = await http.get(
      Uri.parse('http://knightfind.xyz:4000/api/users/$userId/notifications'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final results = data['results'] as List;
      return results.map((e) => Notification.fromJson(e)).toList();
    } else {
      throw Exception('Failed to load user notifications');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          SizedBox(
            height: 250,
            //  To display notifications in ListView
            child: FutureBuilder<List<Notification>>(
              future: notifsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  // until data is fetched, show loader
                  return const CircularProgressIndicator();
                } else if (snapshot.hasError) {
                  return Text('Error: ${snapshot.error}');
                } else if (snapshot.hasData) {
                  // once data is fetched, display it on screen (call buildPosts())
                  final notifs = snapshot.data!;
                  return buildNotifsList(notifs: notifs);
                } else {
                  // if no data, show simple Text
                  return const Text("No data available");
                }
              },
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
  Widget buildNotifsList({required List<Notification> notifs}) {
    // ListView Builder to show data in a list
    return ListView.builder(
      itemCount: notifs.length,
      itemBuilder: (context, index) {
        final notif = notifs[index];
        return Container(
          color: Colors.grey.shade300,
          margin: EdgeInsets.symmetric(vertical: 5, horizontal: 10),
          padding: EdgeInsets.symmetric(vertical: 5, horizontal: 5),
          height: 100,
          width: double.maxFinite,
          child: Row(
            children: [
              Expanded(flex: 1, child: Text(notif.notifText)),
              SizedBox(width: 10),
            ],
          ),
        );
      },
    );
  }
}
