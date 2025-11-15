import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'main.dart';
import 'home.dart';

//  Notifications Inbox Widgets
class Notification {
  final String userId;
  final String notifText;
  final bool isRead;
  final bool isMeetup;
  final String location;
  final DateTime meetTime;
  final String? senderId;
  final int? itemId;

  Notification({
    required this.userId,
    required this.notifText,
    required this.isRead,
    required this.isMeetup,
    required this.location,
    required this.meetTime,
    this.senderId,
    this.itemId,
  });

  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
      userId: json['userId'],
      notifText: json['text'],
      isRead: json['isRead'],
      isMeetup: json['isMeetup'],
      location: json['location'],
      meetTime: json['meetTime'],
      senderId: json['senderId'],
      itemId: json['itemId'],
    );
  }
}

class InboxDisplay extends StatelessWidget {
  final String userId;

  const InboxDisplay({super.key, required this.userId});

  Future<List<Notification>> get notifsFuture => getNotifs();

  Future<List<Notification>> getNotifs() async {
    final response = await http.get(
      Uri.parse('http://knightfind.xyz:4000/api/users/${userId}/notifications'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data.map((e) => Notification.fromJson(e)).toList();
    } else {
      throw Exception('Failed to load user notifications');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: FutureBuilder<List<Notification>>(
        future: notifsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            // until data is fetched, show loader
            return const CircularProgressIndicator();
          } else if (snapshot.hasData) {
            // once data is fetched, display it on screen (call buildPosts())
            final notifs = snapshot.data!;
            return tempBuildList(notifs);
          } else {
            // if no data, show simple Text
            return const Text(
              'No notifications yet',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            );
          }
        },
      ),
    );
  }

  // function to display fetched data on screen
  Widget tempBuildList(List<Notification> notifs) {
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
