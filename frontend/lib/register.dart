import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'main.dart';
import 'home.dart';

class Register extends StatelessWidget {
  const Register({super.key});
  static const Color mainCol = Color(0xFFFFF4D9);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: mainCol,
      appBar: ArrowTitleBar(title: 'Register'),
      body: Column(
        //mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [RegisterForm()],
      ),
    );
  }
}

class RegisterForm extends StatefulWidget {
  const RegisterForm({super.key});

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

  Future<void> _register() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final response = await http.post(
        Uri.parse('http://174.138.65.216:4000/api/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'firstName': _fnameController.text,
          'lastName': _lnameController.text,
          'email': _emailController.text,
          'password': _passwordController.text,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);

        if (data['error'] == null || data['error'].isEmpty) {
          if (mounted) {
            //  After verification, user must return to the start page and login
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Verfication email sent!')),
            );
          }
        } else {
          setState(() {
            _errorMessage = data['error'];
          });
        }
      } else {
        setState(() {
          _errorMessage =
              'Registration failed. Please check your email for verification.';
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
      key: _registerFormKey,
      child: Column(
        children: [
          InputTextField(
            label: 'First Name',
            isObscure: false,
            controller: _fnameController,
            validator: (String? value) {
              return (value == null || value.isEmpty)
                  ? 'Please enter valid first name'
                  : null;
            },
          ),
          InputTextField(
            label: 'Last Name',
            isObscure: false,
            controller: _lnameController,
            validator: (String? value) {
              return (value == null || value.isEmpty)
                  ? 'Please enter valid last name'
                  : null;
            },
          ),
          EmailField(controller: _emailController),
          InputTextField(
            label: 'Password',
            isObscure: true,
            controller: _passwordController,
            validator: (String? value) {
              return (value == null || value.isEmpty)
                  ? 'Please enter valid password'
                  : null;
            },
          ),
          InputTextField(
            label: 'Re-type Password',
            isObscure: true,
            validator: (String? value) {
              return (value != _passwordController.text)
                  ? 'Passwords should match'
                  : null;
            },
          ),
          BoldElevatedButton(
            text: 'Next',
            onPressed: () {
              // Validate returns true if the form is valid, or false otherwise.
              if (_registerFormKey.currentState!.validate()) {
                _isLoading ? null : _register();
              }
            },
            minWidth: 100,
            minHeight: 46,
          ),
          if (_errorMessage.isNotEmpty)
            Text(
              _errorMessage,
              style: const TextStyle(color: Colors.red, fontSize: 14),
              textAlign: TextAlign.center,
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _fnameController.dispose();
    _lnameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
