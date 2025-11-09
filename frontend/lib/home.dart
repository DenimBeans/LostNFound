import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'main.dart';
import 'register.dart';

class AppHome extends StatefulWidget {
  final String firstName;
  final String lastName;
  
  const AppHome({
    super.key, 
    required this.firstName, 
    required this.lastName, 
    }
  );

  @override
  State<AppHome> createState() => _AppHomeState();
}

class _AppHomeState extends State<AppHome> {
  int currentPageIndex = 0;

  @override
  Widget build(BuildContext context) {
    //  Should make the scaffold into its own "Home Page" widget
    //  everything remains the same between the report and search
    //  page except for:
    //  The app bar title
    //  Which icon is shadowed in the bottom navigation
    //  And the actual content in the body
    return Scaffold(
      //  This doesn't actually need an arrow
      //  I'll rewrite the widget later so that the back arrow becomes optional
      //  + rename it from ArrowTitleBar to CenterTitleBar
      appBar: ArrowTitleBar(title: 'Search for Lost Items'),
      bottomNavigationBar: NavigationBar(
        onDestinationSelected: (int index) {
          setState(() {
            currentPageIndex = index;
          });
        },
        indicatorColor: Colors.grey,
        selectedIndex: currentPageIndex,
        destinations: const <Widget>[
          NavigationDestination(
            selectedIcon: Icon(Icons.document_scanner),
            icon: Icon(Icons.document_scanner_outlined),
            label: 'Report Lost'
          ),
          NavigationDestination(
            selectedIcon: Icon(Icons.search),
            icon: Icon(Icons.search_outlined),
            label: 'Search'
          ),
          NavigationDestination(
            selectedIcon: Icon(Icons.mail),
            icon: Icon(Icons.mail_outline),
            label: 'Inbox'
          ),
        ]
      ),
      body: <Widget>[
        SearchDisplay(),
        ReportDisplay(),
        InboxDisplay(),
      ][currentPageIndex],
      endDrawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            ContentPopup(title: 'Notifications', simpleModal: NotificationsModal(),),
            ListTile(
              title: const Text('Tracked Items'),
              onTap: () {
                // Update the state of the app.
                // ...
              },
            ),
            ListTile(
              title: const Text('Your Reports'),
              onTap: () {
                // Update the state of the app.
                // ...
              },
            ),
            ListTile(
              title: const Text('Account Settings'),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AccountSettings(),
                  )
                );
              },
            ),
            ContentPopup(title: 'About', simpleModal: AboutModal(),),
            Spacer(),
            BoldElevatedButton(
              text: 'Log Out', 
              onPressed: () { 
                //  Run log out function
                Navigator.of(context).popUntil((route) => route.isFirst);
              }, 
              minWidth: 40, 
              minHeight: 30,
            ),
          ],
        ),
      ),
    );
  }
}

//  Item Search Widgets
class SearchDisplay extends StatelessWidget {
  const SearchDisplay({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InputTextField(label: 'Search Item', isObscure: false,),
        SizedBox(
          width: 350,
          height: 250,
          //  Container widget is placeholder
          //  As this will be where we output the items, ListView may be better
          child: Container(
            color: Colors.grey,
          ),
        ),
      ],
    );
  }
}

//  Item Report Widgets
class ReportDisplay extends StatelessWidget {
  const ReportDisplay({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InputTextField(label: 'Item Name', isObscure: false,),
        InputTextField(label: 'Item Description', isObscure: false,),
        InputTextField(label: 'Last Known Location', isObscure: false,),
      ],
    );
  }
}

class InboxDisplay extends StatelessWidget {
  const InboxDisplay({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
   // return ListView.builder(
     // itemBuilder:
   // );
   return Scaffold();
  }
}

//  Hamburger Menu Contents
class NotificationsModal extends StatelessWidget {
  const NotificationsModal({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return SimpleDialog(
      title: const Text('Notifications'),
      children: <Widget>[
        SwitchListTile(
          title: const Text('Reported items tracked'),
          value: true,
          onChanged: (bool newVal) {},
        ),
        //  Honestly would probably get rid of this one as I cannot see a linear way for us
        //  to direct the user to retrieve their found item without at least notifying them
        //  it's been found
        SwitchListTile(
          title: const Text('Reported items found'),
          value: true,
          onChanged: (bool newVal) {},
        ),
        SwitchListTile(
          title: const Text('Item return meeting'),
          value: true,
          onChanged: (bool newVal) {},
        ),
      ],
    );
  }
}

class AboutModal extends StatelessWidget {
  const AboutModal({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return SimpleDialog(
      title: const Text('About'),
      children: <Widget>[
        Padding(
          padding: EdgeInsetsGeometry.all(20),
          //  Might want to find a way to change this so that the text itself is hyperlinked instead of
          //  just a plaintext link
          child: Text('Created for COP 4331\n\nGithub: https://github.com/DenimBeans/LostNFound'),
        )
      ]
    );
  }
}

//  User Tracked Items Widget
class TrackedItems extends StatelessWidget {
  const TrackedItems({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold();
  }
}

//  User Reported Items Widget
class SubmittedItems extends StatelessWidget {
  const SubmittedItems({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold();
  }
}

//  Account Settings Widget
class AccountSettings extends StatelessWidget {
  const AccountSettings({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: ArrowTitleBar(title: 'Account Settings'),
      body: SizedBox(
        height: 600,
        width: 300,
        child: GridView.count(
          crossAxisCount: 2,
          children: [
            Text('Change name'),
            InputTextField(label: 'Rename User', isObscure: false),
            Text('Change email'),
            InputTextField(label: 'Change Email', isObscure: false),
            Text('Dsylexic font'),
            Switch(value: false, onChanged: (bool newVal) {},),
            Text('Light/Dark mode'),
            Switch(value: false, onChanged: (bool newVal) {},),
          ],
        )
      )
      /*Column(
          children: [
            Text('Change name'),
            Text('Change email'),
            Text('Dsylexic font'),
            Text('Light/Dark mode'),
            InputTextField(label: 'Rename User', isObscure: false),
            InputTextField(label: 'Change Email', isObscure: false),
            Switch(value: false, onChanged: (bool newVal) {},),
            Switch(value: false, onChanged: (bool newVal) {},),
          ],
        )*/
    );
  }
}

//  Item Found Meeting Popup
class ItemFound extends StatelessWidget {
  const ItemFound({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold();
  }
}