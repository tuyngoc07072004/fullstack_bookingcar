class OccupancyData {
  constructor(vehicle, bookings = []) {
    this.vehicle_id = vehicle._id;
    this.vehicle_license = vehicle.license_plate;
    this.vehicle_type = vehicle.type_name;
    this.vehicle_seats = vehicle.seats;
    this.total_passengers = bookings.reduce((sum, b) => sum + b.passengers, 0);
    this.bookings = bookings.map(b => ({
      booking_id: b._id,
      passengers: b.passengers,
      pickup: b.pickup_location,
      dropoff: b.dropoff_location,
      customer_name: b.customer_name,
      customer_phone: b.customer_phone
    }));
  }

  static async fromVehicleAndDate(vehicle, date, Booking, Customer, TripAssignment) {
    const assignments = await TripAssignment.find({ 
      vehicle_id: vehicle._id,
      date: { $gte: new Date(date).setHours(0,0,0), $lt: new Date(date).setHours(23,59,59) }
    }).populate('booking_id');

    const bookings = await Promise.all(assignments.map(async a => {
      const booking = a.booking_id;
      const customer = await Customer.findById(booking.customer_id);
      return {
        ...booking.toObject(),
        customer_name: customer?.name,
        customer_phone: customer?.phone
      };
    }));

    return new OccupancyData(vehicle, bookings);
  }
}

module.exports = OccupancyData;