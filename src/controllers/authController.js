const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

const register = async (req, res) => {
  try {
    const { username, email, password, role, school_id } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return errorResponse(
        res, 
        HTTP_STATUS.CONFLICT, 
        'User with this email or username already exists'
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'school_admin',
      school_id
    });

    await user.save();

    logger.info('User registered successfully', { userId: user._id, email });

    return successResponse(
      res, 
      HTTP_STATUS.CREATED, 
      'User created successfully', 
      { userId: user._id }
    );
  } catch (error) {
    logger.error('Registration failed', { error: error.message, email: req.body.email });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Registration failed', error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
    }

    if (!user.is_active) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Account is deactivated');
    }

    const token = jwt.sign(
      { 
        email: user.email, 
        sub: user._id, 
        role: user.role, 
        school_id: user.school_id 
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    logger.info('User logged in successfully', { userId: user._id, email });

    return successResponse(res, HTTP_STATUS.OK, 'Login successful', {
      access_token: token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        school_id: user.school_id
      }
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message, email: req.body.email });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Login failed', error.message);
  }
};

const getProfile = async (req, res) => {
  try {
    return successResponse(res, HTTP_STATUS.OK, 'Profile retrieved successfully', req.user);
  } catch (error) {
    logger.error('Failed to get profile', { error: error.message, userId: req.user?.sub });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get profile', error.message);
  }
};

module.exports = {
  register,
  login,
  getProfile
};
