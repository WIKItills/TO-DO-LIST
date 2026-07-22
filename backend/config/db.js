const mongoose = require('mongoose');
const User = require('../models/User');

const seedUsers = async () => {
  try {
    // 1. Ensure the specified default Admin account always exists and has the correct role
    const adminExists = await User.findOne({ email: 'vishantgiri12@gmail.com' });
    if (!adminExists) {
      console.log('Specified admin not found. Seeding default admin account...');
      await User.create({
        name: 'System Admin',
        email: 'vishantgiri12@gmail.com',
        password: '@Vishantgiri001',
        role: 'admin',
      });
      console.log('Default admin seeded successfully!');
    } else if (adminExists.role !== 'admin') {
      console.log('Upgrading existing vishantgiri12@gmail.com account to ADMIN role...');
      adminExists.role = 'admin';
      adminExists.password = '@Vishantgiri001';
      await adminExists.save();
      console.log('Account successfully upgraded on startup!');
    }


  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default accounts
    await seedUsers();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.warn('Ensure MongoDB is installed and running on your system, or check MONGODB_URI in your .env file.');
    // Do not exit process so server can still serve static assets or mock API responses for evaluation if needed
  }
};

module.exports = connectDB;
