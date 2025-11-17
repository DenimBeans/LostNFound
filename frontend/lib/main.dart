import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import './register.dart';
import './home.dart';

void main() {
  runApp(const MyApp());
}

// ============================================
// App Color Palette
// ============================================
class AppColors {
  // Backgrounds
  static const Color mainBackground = Color(0xFFFFF4D9); // Cream
  static const Color secondaryBackground = Color(0xFFD9D9D9); // Light gray
  static const Color indexBackground = Color(0xFFB8860B); // Dark Goldenrod

  // Buttons
  static const Color primaryButton = Color(0xFF000000); // Black
  static const Color secondaryButton = Color(0xFFA9A9A9); // Gray
  static const Color accentButton = Color(0xFFC0504D); // Red/Burgundy
  static const Color successButton = Color(0xFFA3D977); // Green/Lime

  // Text
  static const Color primaryText = Color(0xFF000000); // Black
  static const Color secondaryText = Color(
    0xFF514D08,
  ); // Dark olive (for links)

  // Input Fields
  static const Color inputBackground = Color(0xFFFFFFFF); // White
  static const Color inputBorder = Color(0xFF000000); // Black
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.mainBackground),
      ),
      home: Scaffold(
        resizeToAvoidBottomInset: true,
        backgroundColor: AppColors.indexBackground,
        appBar: PreferredSize(
          preferredSize: Size.fromHeight(120.0),
          child: Padding(
            padding: const EdgeInsets.only(top: 35.0),
            child: Image.asset(
              'flutter-assets/knightfindlogo.png',
              fit: BoxFit.contain,
            ),
          ),
        ),
        body: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextHeading(),
            SizedBox(height: 300),
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
  const TextHeading({super.key});

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      TextSpan(
        text: 'A dedicated community\n',
        style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        children: <InlineSpan>[
          TextSpan(
            text: 'for finding lost items at UCF ',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.normal),
          ),
        ],
      ),
    );
  }
}

class JoinButton extends StatelessWidget {
  const JoinButton({super.key});

  @override
  Widget build(BuildContext context) {
    return BoldElevatedButton(
      text: 'Join Now',
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => Register()),
        );
      },
      minWidth: 130,
      minHeight: 50,
    );
  }
}

class LoginText extends StatelessWidget {
  const LoginText({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 35.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Already have an account?',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
          ),
          TextButton(
            child: const Text(
              'Log in',
              style: TextStyle(
                color: AppColors.secondaryText,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            onPressed: () {
              showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                builder: (BuildContext context) {
                  return LoginModal();
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

class LoginModal extends StatelessWidget {
  const LoginModal({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        height: 380,
        color: AppColors.mainBackground,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              const Text(
                'Login',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),
              LoginForm(),
            ],
          ),
        ),
      ),
    );
  }
}

class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

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
        Uri.parse('http://knightfind.xyz:4000/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': _loginController.text,
          'password': _passwordController.text,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['error'] == null || data['error'].isEmpty) {
          // Login successful, navigate to home page
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => AppHome(
                  firstName: data['firstName'],
                  lastName: data['lastName'],
                  email: _loginController.text,
                  userId: data['userId'],
                ),
              ),
            );
          }
        } else {
          setState(() {
            _errorMessage = data['error'];
          });
        }
      } else if (response.statusCode == 403) {
        // Email not verified
        final data = jsonDecode(response.body);
        setState(() {
          _errorMessage =
              data['error'] ?? 'Please verify your email before logging in';
        });
      } else if (response.statusCode == 401) {
        // Invalid credentials
        final data = jsonDecode(response.body);
        setState(() {
          _errorMessage = data['error'] ?? 'Incorrect email or password';
        });
      } else {
        // Other errors
        try {
          final data = jsonDecode(response.body);
          setState(() {
            _errorMessage = data['error'] ?? 'Login failed. Please try again.';
          });
        } catch (e) {
          setState(() {
            _errorMessage = 'Login failed. Please try again.';
          });
        }
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
          EmailField(controller: _loginController),
          InputTextField(
            label: 'Password',
            controller: _passwordController,
            isObscure: true,
            validator: (String? value) {
              return (value == null || value.isEmpty)
                  ? 'Please enter valid password'
                  : null;
            },
          ),
          const SizedBox(height: 12),
          BoldElevatedButton(
            text: 'Next',
            onPressed: () {
              if (_loginFormKey.currentState!.validate()) {
                _isLoading ? null : _login();
              }
            },
            minWidth: 120,
            minHeight: 45,
          ),
          if (_errorMessage.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Text(
                _errorMessage,
                style: const TextStyle(color: Colors.red, fontSize: 14),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
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
  final Color? backgroundColor;

  const ArrowTitleBar({super.key, required this.title, this.backgroundColor});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: backgroundColor ?? AppColors.secondaryBackground,
      leading: IconButton(
        onPressed: () {
          Navigator.pop(context);
        },
        icon: const Icon(Icons.arrow_back, color: AppColors.primaryText),
      ),
      centerTitle: true,
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: AppColors.primaryText,
        ),
      ),
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
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.primaryText,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            decoration: InputDecoration(
              filled: true,
              fillColor: AppColors.inputBackground,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16.0,
                vertical: 12.0,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.0),
                borderSide: const BorderSide(
                  color: AppColors.inputBorder,
                  width: 1.0,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.0),
                borderSide: const BorderSide(
                  color: AppColors.inputBorder,
                  width: 1.0,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.0),
                borderSide: const BorderSide(
                  color: AppColors.primaryText,
                  width: 2.0,
                ),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.0),
                borderSide: const BorderSide(
                  color: AppColors.accentButton,
                  width: 1.0,
                ),
              ),
            ),
            obscureText: isObscure,
            controller: controller,
            validator: validator,
          ),
        ],
      ),
    );
  }
}

class EmailField extends StatelessWidget {
  final TextEditingController? controller;

  const EmailField({super.key, this.controller});

  @override
  Widget build(BuildContext context) {
    return InputTextField(
      label: 'Email',
      isObscure: false,
      controller: controller,
      validator: (String? value) {
        return (value == null ||
                value.isEmpty ||
                !(RegExp(
                  r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$",
                )).hasMatch(value))
            ? 'Please enter valid email'
            : null;
      },
    );
  }
}

class BoldElevatedButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final double minWidth;
  final double minHeight;
  final Color? backgroundColor;
  final Color? textColor;

  const BoldElevatedButton({
    super.key,
    required this.text,
    this.onPressed,
    required this.minWidth,
    required this.minHeight,
    this.backgroundColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        minimumSize: Size(minWidth, minHeight),
        backgroundColor: backgroundColor ?? AppColors.primaryButton,
        foregroundColor: textColor ?? Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
        elevation: 0,
        textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
      onPressed: onPressed,
      child: Text(text),
    );
  }
}
