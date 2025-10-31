// import 'dart:ffi';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

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

//  Title Page Widgets
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
      height: 300,
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
  final TextEditingController _loginController = TextEditingController(); 
  final TextEditingController _passwordController = TextEditingController(); 
  String _errorMessage = ''; 
  bool _isLoading = false; 

  Future<void> _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final response = await http.post(
        Uri.parse('http://10.0.2.2:4000/api/auth/login'), //  For Android emulator only
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': _loginController.text,
          'password': _passwordController.text,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data['error'] == null || data['error'].isEmpty) {
          // Login successful, navigate to second page
          if (mounted) {
            AlertDialog(title: Text('Login successful'));
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => ItemSearch( 
                  firstName: data['firstName'], 
                  lastName: data['lastName'],
                ),
              ),
            );
          }
        } else { 
          setState(() { 
            AlertDialog(title: Text('err'));
            _errorMessage = data['error']; 
          }); 
        } 
      } else { 
        setState(() {
          _errorMessage = 'Login failed. Please try again.'; 
        }); 
      } 
    } catch (e) { 
      setState(() { 
        _errorMessage = 'Network error. Please check your connection.'; 
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _loginFormKey,
      child: Column(
        children: [
          //  Pass email controller to EmailField
          EmailField(controller: _loginController,),
          FormField(
            label: 'Password',
            controller: _passwordController,
            isObscure: true,
            validator: (String? value) {
              return (value == null || value.isEmpty) ? 'Please enter valid password' : null;
            }
          ),
          BoldElevatedButton(
            text: 'Next',
            onPressed: () {
              if (_loginFormKey.currentState!.validate()) {
                _isLoading ? null : _login();
              }
            },
            minWidth: 70,
            minHeight: 20,
          ),
          if (_errorMessage.isNotEmpty) Text(
            _errorMessage,
            style: const TextStyle( 
              color: Colors.red, 
              fontSize: 14, 
            ), 
            textAlign: TextAlign.center, 
          ),
        ]
      )
    );
  }

  @override 
  void dispose() { 
    _loginController.dispose(); 
    _passwordController.dispose(); 
    super.dispose(); 
  }
}

//  Register Page Widgets
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
  final TextEditingController _fnameController = TextEditingController(); 
  final TextEditingController _lnameController = TextEditingController(); 
  final TextEditingController _emailController = TextEditingController(); 
  final TextEditingController _passwordController = TextEditingController(); 
  String _errorMessage = '';
  bool _isLoading = false;

  @override
  void dispose() {
    _passwordController.dispose();
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
            isObscure: false,       
            controller: _fnameController, 
            validator: (String? value) {
              return (value == null || value.isEmpty) ? 'Please enter valid first name' : null;
            }
          ),
          FormField(
            label: 'Last Name',
            isObscure: false,
            controller: _lnameController,
            validator: (String? value) {
              return (value == null || value.isEmpty) ? 'Please enter valid last name' : null;
            }
          ),
          EmailField(controller: _emailController,),
          FormField(
            label: 'Password',
            isObscure: false,
            controller: _passwordController,
            validator: (String? value) {
              return (value == null || value.isEmpty) ? 'Please enter valid password' : null;
            }
          ),
          FormField(
            label: 'Re-type Password',
            isObscure: false,
            validator: (String? value) {
              return (value != _passwordController.text) ? 'Passwords should match' : null;
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

class EmailField extends StatelessWidget {
  final TextEditingController? controller;

  const EmailField({
    super.key,
    this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return FormField(
      label: 'Email',
      isObscure: false,
      controller: controller,
      validator: (String? value) {
        return (value == null || value.isEmpty || 
        !(RegExp(r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$")).hasMatch(value))
        ? 'Please enter valid email' : null;
      }
    );
  }
}

//  Email Verification Popup

//  Search for Items Widgets
class ItemSearch extends StatelessWidget {
  final String firstName;
  final String lastName;
  //final int userID;
  
  const ItemSearch({
    super.key, 
    required this.firstName, 
    required this.lastName, 
    //required this.userID
    }
  );

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
      body: Column(
        children: [
          FormField(label: 'Search Item', isObscure: false,),
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
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.document_scanner_rounded),
            label: 'Report Lost',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            label: 'Search',
          ),
        ]
      ),
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
                // Update the state of the app.
                // ...
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

class ContentPopup extends StatelessWidget {
  final String title;
  final Widget simpleModal;

  const ContentPopup({
    super.key,
    required this.title,
    required this.simpleModal,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(title),
      onTap: () => showDialog<String>(
        context: context,
        builder: (BuildContext context) => simpleModal,            
      ),
    );
  }
}

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
          child: Text('Created in X weeks for COP 4331\n\nGithub: https://github.com/DenimBeans/LostNFound'),
        )
      ]
    );
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
  final bool isObscure;
  final TextEditingController? controller;
  final String? Function(String?)? validator;

  const FormField({
    super.key,
    required this.label,
    required this.isObscure,
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
        obscureText: isObscure,
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