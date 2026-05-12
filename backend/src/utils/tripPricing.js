const PRICING_TABLE = {
  4: { type_name: 'Xe 4 chỗ', base_fare: 25000, per_km_per_person: 10000, min_fare: 25000 },
  7: { type_name: 'Xe 7 chỗ', base_fare: 30000, per_km_per_person: 10000, min_fare: 30000 },
  9: { type_name: 'Xe 9 chỗ', base_fare: 35000, per_km_per_person: 9500, min_fare: 35000 },
  16: { type_name: 'Xe 16 chỗ', base_fare: 50000, per_km_per_person: 9000, min_fare: 50000 },
  29: { type_name: 'Xe 29 chỗ', base_fare: 70000, per_km_per_person: 8500, min_fare: 70000 },
  45: { type_name: 'Xe 45 chỗ', base_fare: 90000, per_km_per_person: 8000, min_fare: 90000 }
};

function getPricingBySeats(seats) {
  return PRICING_TABLE[Number(seats)] || PRICING_TABLE[4];
}

function calculatePriceBreakdown(seats, distance, passengers = 1) {
  const cfg = getPricingBySeats(seats);
  const safeDistance = Math.max(0, Number(distance) || 0);
  const safePassengers = Math.max(1, Math.floor(Number(passengers) || 1));

  const variable = safeDistance * cfg.per_km_per_person * safePassengers;
  const rawTotal = cfg.base_fare + variable;
  const total = Math.max(cfg.min_fare, Math.round(rawTotal));

  return {
    seats: Number(seats),
    passengers: safePassengers,
    distance: safeDistance,
    vehicle_type: cfg.type_name,
    base_fare: cfg.base_fare,
    per_km_per_person: cfg.per_km_per_person,
    min_fare: cfg.min_fare,
    variable_fare: Math.round(variable),
    price: total
  };
}

function calculatePriceBySeats(seats, distance, passengers = 1) {
  return calculatePriceBreakdown(seats, distance, passengers).price;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = { calculatePriceBySeats, calculatePriceBreakdown, getPricingBySeats, haversineKm };
