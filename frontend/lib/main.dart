// import 'dart:ffi';

import 'package:flutter/material.dart';
// import 'package:http/http.dart' as http;
// import 'dart:convert';

//  Form Validation
//  First name and last name should be: 
//  no more than two characters long each
//  only letters
//  Email needs that valid regex you're familiar with already, it's probably been written already
//  Not sure what the password requirements should be beyond not empty

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  static const Color mainCol = Color(0xFFFFF4D9);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        backgroundColor: mainCol,
        appBar: PreferredSize(
          preferredSize: Size.fromHeight(120.0),
          child: Padding(
            padding: const EdgeInsets.only(top: 35.0),
            child: AppBar(
              backgroundColor: mainCol,
              centerTitle: true,
              title: const Text("KnightFind", style:TextStyle(fontSize: 48, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
        body: Column(
          //mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            TextHeading(),
            SizedBox(
              height: 300,
            ),
            JoinButton(),
            Spacer(),
            LoginText(),
          ],
        ),
      ),
    );
  }
}

//  Page 1 Layout Widgets
class TextHeading extends StatelessWidget {
  const TextHeading({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      TextSpan(
        text: 'A dedicated community\n',
        style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        children: <InlineSpan>[
          TextSpan(
            text: 'for finding lost items at UCF ',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

class JoinButton extends StatelessWidget {
  const JoinButton({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return BoldElevatedButton(
      text: 'Join Now!',
      onPressed: () {
        Navigator.push(
          context, 
          MaterialPageRoute(builder: (context) => Register()),
        );
      },
      minWidth: 130,
      minHeight: 60,
    );
  }
}

class LoginText extends StatelessWidget {
  const LoginText({
    super.key,
  });

  @override
  Widget build(BuildContext context) {

    return Padding(
      padding: const EdgeInsets.only(bottom: 35.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        //  crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Already created an account?', style:TextStyle(fontSize: 21, fontWeight: FontWeight.bold)),
          TextButton(
            child: const Text(('Log in'), style:TextStyle(color: Color(0xFF514D08), fontSize: 21, fontWeight: FontWeight.bold)),
            onPressed: () {
              showModalBottomSheet<void>(
                context: context,
                builder: (BuildContext context) {
                  return LoginModal();
                },
              );
            },
          )
        ]
      )
    );
  }
}

class LoginModal extends StatelessWidget {
  const LoginModal({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 250,
      color: Colors.amber,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Text('Login', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            LoginForm(),
          ],
        ),
      ),
    );
  }
}

class LoginForm extends StatefulWidget {
  const LoginForm({
    super.key,
  });

  @override
  LoginFormState createState() {
    return LoginFormState();
  }
}

class LoginFormState extends State<LoginForm> {
  final _loginFormKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _loginFormKey,
      child: Column(
        children: [
          FormField(
            label: 'Email',
            validator: (String? value) {
              return (value == null || value.isEmpty || 
              !(RegExp(r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$")).hasMatch(value))
              ? 'Please enter valid email' : null;
            }
          ),
          FormField(
            label: 'Password',
            validator: (String? value) {
              return (value == null || value.isEmpty) ? 'Please enter valid password' : null;
            }
          ),
          BoldElevatedButton(
            text: 'Next',
            onPressed: () {
              // Validate returns true if the form is valid, or false otherwise.
              if (_loginFormKey.currentState!.validate()) {
                // Run login function
                Navigator.push(
                  context, 
                  MaterialPageRoute(builder: (context) => ItemSearch()),
                );
              }
            },
            minWidth: 70,
            minHeight: 20,
          ),
        ]
      )
    );
  }
}

//  Register Widgets
class Register extends StatelessWidget {
  const Register({super.key});
  static const Color mainCol = Color(0xFFFFF4D9);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: mainCol,
      appBar: ArrowTitleBar(title:  'Register'),
      body: Column(
        //mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          RegisterForm(),
        ],
      ),
    );
  }
}

class RegisterForm extends StatefulWidget {
  const RegisterForm({
    super.key,
  });

  @override
  RegisterFormState createState() {
    return RegisterFormState();
  }
}

class RegisterFormState extends State<RegisterForm> {
  final _registerFormKey = GlobalKey<FormState>();
  final passwordController = TextEditingController();

  @override
  void dispose() {
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _registerFormKey,
      child: Column(
        children: [
          FormField(
            label: 'First Name',            
            validator: (String? value) {
              return (value == null || value.isEmpty) ? 'Please enter valid first name' : null;
            }
          ),
          FormField(
            label: 'Last Name',
            validator: (String? value) {
              return (value == null || value.isEmpty) ? 'Please enter valid last name' : null;
            }
          ),
          FormField(
            label: 'Email',
            validator: (String? value) {
              return (value == null || value.isEmpty || 
              !(RegExp(r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$")).hasMatch(value))
              ? 'Please enter valid email' : null;
            }
          ),
          FormField(
            label: 'Password',
            controller: passwordController,
            validator: (String? value) {
              return (value == null || value.isEmpty) ? 'Please enter valid password' : null;
            }
          ),
          FormField(
            label: 'Re-type Password',
            validator: (String? value) {
              return (value != passwordController.text) ? 'Passwords should match' : null;
            }
          ),
          BoldElevatedButton(
            text: 'Next', 
            onPressed: () {
              // Validate returns true if the form is valid, or false otherwise.
              if (_registerFormKey.currentState!.validate()) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Processing Data')),
                );
              }
            }, 
            minWidth: 100, 
            minHeight: 46,
          )
        ]
      ),
    );
  }
}

//  Email Verification Popup

//  Search for Items Widgets
class ItemSearch extends StatelessWidget {
  const ItemSearch({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold();
  }
}

//  Report a Lost Item Widgets
class ItemReport extends StatelessWidget {
  const ItemReport({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold();
  }
}

//  Notification Settings Menu
//  Should be a popup, not a new page (swap out navigator for overlay toggle?)
class Notifications extends StatelessWidget {
  const Notifications({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: ArrowTitleBar(title: 'Notifcations'),
      //  Item Tracked - Switch 1
      //  Item Found - Switch 2
      //  Return Meeting Schedule - Switch 3
    );
  }
}

//  About Section Popup
//  Should be a popup, not a new page (swap out navigator for overlay toggle?)
class About extends StatelessWidget {
  const About({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold();
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
    return Scaffold();
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

//  App-Wide Reusable Widgets
class ArrowTitleBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;

  const ArrowTitleBar({
    super.key, 
    required this.title
  });

  static const Color mainCol = Color(0xFFFFF4D9);
  //  static const double defaultSize = 56.0;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: mainCol,
      leading: IconButton(
        onPressed: () {
          Navigator.pop(
            context
            
          );
        },
        icon: Icon(Icons.arrow_back),
      ),
      centerTitle: true,
      title: Text(title, style:TextStyle(fontSize: 36, fontWeight: FontWeight.bold)),
    );
  }
}

class FormField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final String? Function(String?)? validator;

  const FormField({
    super.key,
    required this.label,
    this.controller,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12.0),
      child: TextFormField(  
        decoration: InputDecoration(
          labelText: label,
        ),
        controller: controller,
        validator: validator,
      )
    );
  }
}

class BoldElevatedButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final double minWidth;
  final double minHeight;

  const BoldElevatedButton({
    super.key,
    required this.text,
    required this.onPressed,
    required this.minWidth,
    required this.minHeight,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        //  minimumSize: Size(140, 50), 
        minimumSize: Size(minWidth, minHeight),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12.0),
        ),
        textStyle: const TextStyle(
          color: Colors.white,
          fontSize: 34,
          fontWeight: FontWeight.bold,
        ),
      ),
      onPressed: onPressed,
      child: Text(text),
    );
  }
}