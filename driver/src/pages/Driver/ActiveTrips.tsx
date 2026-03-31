import React, { useState } from 'react';
import { DriverTrip } from '../../types/DriverTrip.types';
import TripCard from './TripCard';
import { Navigation} from 'lucide-react';

interface ActiveTripsProps {
  trips: DriverTrip[];
  onConfirm: (assignmentId: string, bookingId: string, reason?: string) => void;
  onComplete: (bookingId: string) => void;
  loading?: boolean;
}

export default function ActiveTrips({ trips, onConfirm, onComplete, loading }: ActiveTripsProps) {
  const [confirmingTripId, setConfirmingTripId] = useState<string | null>(null);
  const [lowOccupancyReason, setLowOccupancyReason] = useState<Record<string, string>>({});
  const [showReasonModal, setShowReasonModal] = useState<string | null>(null);

  const handleConfirmClick = (trip: DriverTrip) => {
    const occupancyRate = trip.total_occupancy / trip.vehicle_seats;
    if (occupancyRate < 0.8) {
      setShowReasonModal(trip.id);
    } else {
      onConfirm(trip.id, trip.booking_id);
    }
  };

  const handleConfirmWithReason = (tripId: string, bookingId: string) => {
    const reason = lowOccupancyReason[tripId];
    onConfirm(tripId, bookingId, reason);
    setShowReasonModal(null);
    setLowOccupancyReason(prev => {
      const newState = { ...prev };
      delete newState[tripId];
      return newState;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-4xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="bg-white p-16 rounded-4xl text-center border border-dashed border-gray-200 shadow-sm">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Navigation className="text-gray-300" size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có chuyến đi nào</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Khi có chuyến đi mới được phân công, chúng sẽ xuất hiện tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {trips.map(trip => (
        <TripCard
          key={trip.id}
          trip={trip}
          onConfirm={() => handleConfirmClick(trip)}
          onComplete={() => onComplete(trip.booking_id)}
          isConfirming={confirmingTripId === trip.id}
          showReasonModal={showReasonModal === trip.id}
          reason={lowOccupancyReason[trip.id] || ''}
          onReasonChange={(reason) => setLowOccupancyReason(prev => ({ ...prev, [trip.id]: reason }))}
          onConfirmWithReason={() => handleConfirmWithReason(trip.id, trip.booking_id)}
          onCancelReason={() => setShowReasonModal(null)}
        />
      ))}
    </div>
  );
}