const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const path = require('path');
const bookingRoutes = require('./routes/bookingRoutes');
const cashRoutes = require('./routes/cashRoutes');
require('dotenv').config();

const app = express();



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Middlewares
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes); // Add booking routes
app.use('/api/cash', cashRoutes); // Add cash payment routes
// Connect to the database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((err) => console.log("Connection failed:", err));

// Test route
app.get('/', (req, res) => {
  res.send("Server is running successfully!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});