const User = require('../Modle/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Register a new user (Customer)
exports.register = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;
        
        // ✅ 1. Verify that all required fields exist
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required (full name, email, phone, password)'
            });
        }
        
        // ✅ 2. Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // ✅ 3. Validate phone number (Syrian number: 9 digits starting with 09)
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number. Must be 9 digits starting with 09'
            });
        }
        
        // ✅ 4. Check password strength (at least 6 characters)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }
        
        // ✅ 5. Verify that no user with the same email exists
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        // ✅ 6. Verify that no user with the same phone exists
        const existingUserByPhone = await User.findOne({ phone });
        if (existingUserByPhone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already exists'
            });
        }
        
        // ✅ 7. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // ✅ 8. Set the role (Customer by default)
        const userRole ='Customer';
        
        // ✅ 9. Create the new user
        const user = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password: hashedPassword,
            role: userRole,
            isActive: true,
            createdAt: new Date()
        });
        
        await user.save();
        
        // ✅ 10. Create JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role,
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // ✅ 11. Return data without password
        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: userResponse
        });
        
    } catch (error) {
        console.error('❌ Register error:', error);
        
        // Handle MongoDB errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 2. User login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid login credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid login credentials" });

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role, companyId: user.companyId },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                role: user.role,
                companyId: user.companyId
            }
        });

    } catch (err) {
        res.status(500).send("Server error");
    }
};

// @desc    Customer login (Customers only)
// @route   POST /api/auth/customer-login
// @access  Public
exports.customerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please enter email and password'
            });
        }
        
        // Search for user by email
        const user = await User.findOne({ email });
        
        // Verify user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // ✅ Verify that the role is Customer only
        if (user.role !== 'Customer') {
            return res.status(403).json({
                success: false,
                message: 'This account is not authorized to log in as a customer. Please use the appropriate login portal'
            });
        }
        
        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Verify that account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is not active. Please contact support'
            });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role,
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Return data without password
        const userResponse = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
        };
        
        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: userResponse
        });
        
    } catch (error) {
        console.error('Error in customerLogin:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};