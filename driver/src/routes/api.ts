import { Router } from 'express';
import { initDB } from '../db/database';

const router = Router();

// Get vehicle types for booking form
router.get('/vehicle-types', async (req, res) => {
  const db = await initDB();
  const types = await db.all('SELECT * FROM vehicle_types');
  res.json(types);
});

// Create a new booking
router.post('/bookings', async (req, res) => {
  const { customer, booking } = req.body;
  const db = await initDB();

  try {
    // 1. Create or get customer
    let customerId;
    const existingCustomer = await db.get('SELECT id FROM customers WHERE phone = ?', [customer.phone]);
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const result = await db.run(
        'INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)',
        [customer.name, customer.phone, customer.email]
      );
      customerId = result.lastID;
    }

    // 2. Create booking
    const bookingResult = await db.run(
      `INSERT INTO bookings (customer_id, pickup_location, dropoff_location, trip_date, passengers, vehicle_type_id, price, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerId, booking.pickup, booking.dropoff, booking.date, booking.passengers, booking.vehicleTypeId, booking.price, 'pending']
    );
    const bookingId = bookingResult.lastID;

    // 3. Create payment record
    await db.run(
      'INSERT INTO payments (booking_id, payment_method, amount, payment_status) VALUES (?, ?, ?, ?)',
      [bookingId, booking.paymentMethod, booking.price, 'pending']
    );

    res.status(201).json({ bookingId, message: 'Booking created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get bookings by customer phone
router.get('/bookings/customer/:phone', async (req, res) => {
  const db = await initDB();
  const { phone } = req.params;

  try {
    const bookings = await db.all(`
      SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.email, vt.type_name as vehicle_type, ta.low_occupancy_reason
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN vehicle_types vt ON b.vehicle_type_id = vt.id
      LEFT JOIN trip_assignments ta ON b.id = ta.booking_id
      WHERE c.phone = ?
      ORDER BY b.created_at DESC
    `, [phone]);
    
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get all bookings (Staff)
router.get('/bookings', async (req, res) => {
  const db = await initDB();
  const bookings = await db.all(`
    SELECT b.*, c.name as customer_name, c.phone as customer_phone, vt.type_name as vehicle_type, ta.low_occupancy_reason
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN vehicle_types vt ON b.vehicle_type_id = vt.id
    LEFT JOIN trip_assignments ta ON b.id = ta.booking_id
    ORDER BY b.created_at DESC
  `);
  res.json(bookings);
});

// Confirm booking (Staff)
router.put('/bookings/:id/confirm', async (req, res) => {
  const db = await initDB();
  await db.run('UPDATE bookings SET status = ? WHERE id = ?', ['confirmed', req.params.id]);
  res.json({ message: 'Booking confirmed' });
});

// Assign driver and vehicle (Staff)
router.post('/assign-driver', async (req, res) => {
  const { bookingId, driverId, vehicleId, staffId } = req.body;
  const db = await initDB();

  try {
    // Check if this booking is already assigned
    const existing = await db.get('SELECT id FROM trip_assignments WHERE booking_id = ?', [bookingId]);
    if (existing) {
      await db.run(
        'UPDATE trip_assignments SET driver_id = ?, vehicle_id = ?, staff_id = ? WHERE booking_id = ?',
        [driverId, vehicleId, staffId, bookingId]
      );
    } else {
      await db.run(
        'INSERT INTO trip_assignments (booking_id, driver_id, vehicle_id, staff_id) VALUES (?, ?, ?, ?)',
        [bookingId, driverId, vehicleId, staffId]
      );
    }
    
    await db.run('UPDATE bookings SET status = ? WHERE id = ?', ['assigned', bookingId]);
    // We don't mark vehicle as 'busy' anymore because it can be shared
    // await db.run('UPDATE vehicles SET status = ? WHERE id = ?', ['busy', vehicleId]);
    
    res.json({ message: 'Driver assigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Assignment failed' });
  }
});

// Get trips for driver
router.get('/driver/:driverId/trips', async (req, res) => {
  const db = await initDB();
  const trips = await db.all(`
    SELECT 
      ta.*, 
      b.pickup_location, 
      b.dropoff_location, 
      b.trip_date, 
      b.status as booking_status, 
      b.passengers as booking_passengers,
      v.license_plate, 
      vt.seats as vehicle_seats,
      (
        SELECT SUM(b2.passengers)
        FROM trip_assignments ta2
        JOIN bookings b2 ON ta2.booking_id = b2.id
        WHERE ta2.vehicle_id = ta.vehicle_id AND DATE(b2.trip_date) = DATE(b.trip_date)
      ) as total_occupancy
    FROM trip_assignments ta
    JOIN bookings b ON ta.booking_id = b.id
    JOIN vehicles v ON ta.vehicle_id = v.id
    JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
    WHERE ta.driver_id = ?
    ORDER BY ta.assigned_at DESC
  `, [req.params.driverId]);
  res.json(trips);
});

// Get vehicle occupancy for a specific date
router.get('/vehicles/occupancy', async (req, res) => {
  const { date } = req.query;
  const db = await initDB();
  
  try {
    // Get all assignments for this date and sum passengers per vehicle
    const occupancy = await db.all(`
      SELECT ta.vehicle_id, SUM(b.passengers) as total_passengers
      FROM trip_assignments ta
      JOIN bookings b ON ta.booking_id = b.id
      WHERE DATE(b.trip_date) = DATE(?)
      GROUP BY ta.vehicle_id
    `, [date]);
    
    res.json(occupancy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch occupancy' });
  }
});

// Driver confirm trip with optional reason
router.put('/driver/confirm-trip', async (req, res) => {
  const { assignmentId, bookingId, reason } = req.body;
  const db = await initDB();
  try {
    // Get vehicle and date for this assignment
    const assignment = await db.get(`
      SELECT ta.vehicle_id, b.trip_date 
      FROM trip_assignments ta 
      JOIN bookings b ON ta.booking_id = b.id 
      WHERE ta.id = ?
    `, [assignmentId]);

    if (assignment) {
      // Update all assignments for this vehicle on this day with the same reason
      await db.run(`
        UPDATE trip_assignments 
        SET low_occupancy_reason = ? 
        WHERE vehicle_id = ? AND booking_id IN (
          SELECT id FROM bookings WHERE DATE(trip_date) = DATE(?)
        )
      `, [reason, assignment.vehicle_id, assignment.trip_date]);
    }

    await db.run('UPDATE trip_assignments SET driver_confirm = 1 WHERE id = ?', [assignmentId]);
    await db.run('UPDATE bookings SET status = ? WHERE id = ?', ['in-progress', bookingId]);
    res.json({ message: 'Trip confirmed by driver' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm trip' });
  }
});

// Complete trip
router.put('/bookings/:id/complete', async (req, res) => {
  const db = await initDB();
  const bookingId = req.params.id;
  
  await db.run('UPDATE bookings SET status = ? WHERE id = ?', ['completed', bookingId]);
  
  // Free the vehicle
  const assignment = await db.get('SELECT vehicle_id FROM trip_assignments WHERE booking_id = ?', [bookingId]);
  if (assignment) {
    await db.run('UPDATE vehicles SET status = ? WHERE id = ?', ['available', assignment.vehicle_id]);
  }
  
  res.json({ message: 'Trip completed' });
});

// Management resources
router.get('/drivers', async (req, res) => {
  const db = await initDB();
  res.json(await db.all('SELECT * FROM drivers'));
});

router.get('/vehicles', async (req, res) => {
  const db = await initDB();
  res.json(await db.all('SELECT v.*, vt.type_name FROM vehicles v JOIN vehicle_types vt ON v.vehicle_type_id = vt.id'));
});

router.get('/customers', async (req, res) => {
  const db = await initDB();
  res.json(await db.all('SELECT * FROM customers ORDER BY created_at DESC'));
});

// Driver registration
router.post('/drivers/register', async (req, res) => {
  const { name, phone, license_number } = req.body;
  const db = await initDB();

  try {
    const result = await db.run(
      'INSERT INTO drivers (name, phone, license_number, status) VALUES (?, ?, ?, ?)',
      [name, phone, license_number, 'active']
    );
    res.status(201).json({ id: result.lastID, message: 'Driver registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register driver' });
  }
});

// Driver registration
router.post('/drivers/register', async (req, res) => {
  const { name, phone, license_number } = req.body;
  const db = await initDB();

  try {
    const result = await db.run(
      'INSERT INTO drivers (name, phone, license_number, status) VALUES (?, ?, ?, ?)',
      [name, phone, license_number, 'active']
    );
    res.status(201).json({ id: result.lastID, message: 'Driver registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register driver' });
  }
});

// Get driver stats
router.get('/driver/:driverId/stats', async (req, res) => {
  const db = await initDB();
  const driverId = req.params.driverId;
  
  const totalTrips = await db.get('SELECT COUNT(*) as count FROM trip_assignments WHERE driver_id = ?', [driverId]);
  const completedTrips = await db.get(`
    SELECT COUNT(*) as count FROM trip_assignments ta 
    JOIN bookings b ON ta.booking_id = b.id 
    WHERE ta.driver_id = ? AND b.status = 'completed'`, [driverId]);
  
  const earnings = await db.get(`
    SELECT SUM(b.price) as total FROM trip_assignments ta 
    JOIN bookings b ON ta.booking_id = b.id 
    WHERE ta.driver_id = ? AND b.status = 'completed'`, [driverId]);

  res.json({
    totalTrips: totalTrips.count,
    completedTrips: completedTrips.count,
    earnings: earnings.total || 0,
    rating: 4.9 // Mock rating
  });
});

// STAFF AUTHENTICATION ROUTES
// Staff registration
router.post('/staff/register', async (req, res) => {
  const { name, phone, email, username, password } = req.body;
  const db = await initDB();

  try {
    // Check if username exists
    const existing = await db.get('SELECT id FROM staff WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    // Simple password hashing (in production, use bcrypt)
    const hashedPassword = Buffer.from(password).toString('base64');
    
    const result = await db.run(
      'INSERT INTO staff (name, phone, email, username, password) VALUES (?, ?, ?, ?, ?)',
      [name, phone, email, username, hashedPassword]
    );
    
    res.status(201).json({ 
      id: result.lastID,
      message: 'Đăng ký thành công'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi đăng ký' });
  }
});

// Staff login
router.post('/staff/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await initDB();

  try {
    const staff = await db.get('SELECT * FROM staff WHERE username = ?', [username]);
    
    if (!staff) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Simple password verification (in production, use bcrypt)
    const hashedPassword = Buffer.from(password).toString('base64');
    if (staff.password !== hashedPassword) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${staff.id}:${Date.now()}`).toString('base64');

    res.json({
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        email: staff.email,
        username: staff.username
      },
      message: 'Đăng nhập thành công'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi đăng nhập' });
  }
});

// Get vehicle occupancy details with bookings
router.get('/vehicles/:vehicleId/occupancy/:date', async (req, res) => {
  const db = await initDB();
  const { vehicleId, date } = req.params;

  try {
    const vehicle = await db.get(`
      SELECT v.*, vt.type_name, vt.seats
      FROM vehicles v
      JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
      WHERE v.id = ?
    `, [vehicleId]);

    if (!vehicle) {
      return res.status(404).json({ error: 'Xe không tồn tại' });
    }

    const bookings = await db.all(`
      SELECT 
        ta.id,
        b.id as booking_id,
        b.passengers,
        b.pickup_location,
        b.dropoff_location,
        c.name as customer_name,
        c.phone as customer_phone
      FROM trip_assignments ta
      JOIN bookings b ON ta.booking_id = b.id
      JOIN customers c ON b.customer_id = c.id
      WHERE ta.vehicle_id = ? AND DATE(b.trip_date) = DATE(?)
      ORDER BY b.trip_date
    `, [vehicleId, date]);

    const totalPassengers = bookings.reduce((sum, b) => sum + b.passengers, 0);
    const availableSeats = vehicle.seats - totalPassengers;

    res.json({
      vehicle: {
        id: vehicle.id,
        license_plate: vehicle.license_plate,
        type_name: vehicle.type_name,
        total_seats: vehicle.seats,
        occupied_seats: totalPassengers,
        available_seats: availableSeats,
        occupancy_rate: ((totalPassengers / vehicle.seats) * 100).toFixed(1)
      },
      bookings,
      message: 'Occupancy retrieved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch occupancy' });
  }
});

export default router;