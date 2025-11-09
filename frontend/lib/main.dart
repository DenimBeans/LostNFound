import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import './register.dart';
import './home.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  static const Color mainCol = Color(0xFFFFF4D9);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.amber,
        )
      ),
      home: Scaffold(
        resizeToAvoidBottomInset: true,
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
          mainAxisAlignment: MainAxisAlignment.center,
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
                isScrollControlled: true,
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
    return Padding (
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom,), 
      child: Container(
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
      )
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
        Uri.parse('http://174.138.65.216:4000/api/auth/login'), //  For Android emulator only
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
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => AppHome(
                  firstName: data['firstName'], 
                  lastName: data['lastName'],
                ),
              ),
            );
          }
        } else { 
          setState(() { 
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
          InputTextField(
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

//  App-Wide Reusable Widgets
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

class InputTextField extends StatelessWidget {
  final String label;
  final bool isObscure;
  final TextEditingController? controller;
  final String? Function(String?)? validator;

  const InputTextField({
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

class EmailField extends StatelessWidget {
  final TextEditingController? controller;

  const EmailField({
    super.key,
    this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return InputTextField(
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