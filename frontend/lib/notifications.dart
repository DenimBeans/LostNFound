import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'main.dart';
import 'home.dart';

//  Notifications Inbox Widgets
class InboxDisplay extends StatelessWidget {
  const InboxDisplay({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text(
        'No notifications yet',
        style: TextStyle(fontSize: 18, color: Colors.grey),
      ),
    );
  }
}
