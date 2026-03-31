class DashboardStats {
  constructor(data = {}) {
    this.total_bookings = data.total_bookings || 0;
    this.pending_bookings = data.pending_bookings || 0;
    this.confirmed_bookings = data.confirmed_bookings || 0;
    this.in_progress_bookings = data.in_progress_bookings || 0;
    this.completed_bookings = data.completed_bookings || 0;
    this.total_customers = data.total_customers || 0;
    this.total_drivers = data.total_drivers || 0;
    this.total_vehicles = data.total_vehicles || 0;
    this.revenue_today = data.revenue_today || 0;
    this.revenue_week = data.revenue_week || 0;
    this.revenue_month = data.revenue_month || 0;
  }

  static async generate(Booking, Customer, Driver, Vehicle) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - 7));
    const startOfMonth = new Date(today.setDate(1));

    const [
      total_bookings,
      pending_bookings,
      confirmed_bookings,
      in_progress_bookings,
      completed_bookings,
      total_customers,
      total_drivers,
      total_vehicles,
      revenue_today,
      revenue_week,
      revenue_month
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'in-progress' }),
      Booking.countDocuments({ status: 'completed' }),
      Customer.countDocuments(),
      Driver.countDocuments(),
      Vehicle.countDocuments(),
      Booking.aggregate([
        { $match: { status: 'completed', trip_date: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      Booking.aggregate([
        { $match: { status: 'completed', trip_date: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      Booking.aggregate([
        { $match: { status: 'completed', trip_date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    return new DashboardStats({
      total_bookings,
      pending_bookings,
      confirmed_bookings,
      in_progress_bookings,
      completed_bookings,
      total_customers,
      total_drivers,
      total_vehicles,
      revenue_today: revenue_today[0]?.total || 0,
      revenue_week: revenue_week[0]?.total || 0,
      revenue_month: revenue_month[0]?.total || 0
    });
  }
}

module.exports = DashboardStats;