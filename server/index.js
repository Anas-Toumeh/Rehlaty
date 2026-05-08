const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const path = require('path');
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

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("تم الاتصال بـ MongoDB بنجاح"))
  .catch((err) => console.log("فشل الاتصال:", err));

// مسار تجريبي
app.get('/', (req, res) => {
  res.send("السيرفر يعمل بنجاح!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`السيرفر يعمل على المنفذ: ${PORT}`);
});