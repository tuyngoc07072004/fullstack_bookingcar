class RevenueData {
  constructor(date, revenue) {
    this.date = date;
    this.revenue = revenue;
  }

  static async getRevenueLastDays(days, Booking) {
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const revenue = await Booking.aggregate([
        {
          $match: {
            status: 'completed',
            trip_date: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]);

      result.push(new RevenueData(
        startOfDay.toISOString().split('T')[0],
        revenue[0]?.total || 0
      ));
    }

    return result;
  }

  static async getRevenueByMonth(year, month, Booking) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const revenue = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          trip_date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    return revenue[0]?.total || 0;
  }
}

module.exports = RevenueData;