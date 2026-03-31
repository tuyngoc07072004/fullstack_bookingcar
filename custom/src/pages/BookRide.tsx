import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Car, CreditCard, Banknote, ArrowRight, CheckCircle2, Navigation, Search, MousePointer2, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { debounce } from 'lodash';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { useAppDispatch, useAppSelector } from '../redux/store';
import { 
  calculatePrice, 
  createBooking, 
  clearPriceCalculation,
  selectPriceCalculation,
  selectBookingLoading,
  selectBookingError
} from '../redux/Booking/Booking.Slice';

import {
  createPaymentForBooking,
} from '../redux/Payment/Payment.Slice';

import { VEHICLE_TYPE_OPTIONS, VehicleType } from '../types/VehicleType.types';
import { BookingFormData, CreateBookingRequest } from '../types/Booking.types';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function BookRide() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1);
  const [vehicleTypes] = useState<VehicleType[]>(VEHICLE_TYPE_OPTIONS);
  
  const priceCalculation = useAppSelector(selectPriceCalculation);
  const loading = useAppSelector(selectBookingLoading);
  const error = useAppSelector(selectBookingError);

  const [formData, setFormData] = useState<BookingFormData>({
    customer: {
      name: '',
      phone: '',
      email: ''
    },
    booking: {
      pickup: '',
      dropoff: '',
      date: '',
      passengers: 1,
      seats: 9,
      paymentMethod: 'cash',
      price: 0
    }
  });

  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Payment state (không hiển thị QR form)
  const [paymentCreating, setPaymentCreating] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [selectingFor, setSelectingFor] = useState<'pickup' | 'dropoff' | null>(null);
  const [isSearching, setIsSearching] = useState({ pickup: false, dropoff: false });

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate distance when coordinates change
  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      const d = calculateDistance(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]);
      setDistance(d);
    } else {
      setDistance(null);
    }
  }, [pickupCoords, dropoffCoords]);

  // Calculate price when distance or seats change
  useEffect(() => {
    if (distance && formData.booking.seats && distance > 0) {
      dispatch(calculatePrice({
        seats: formData.booking.seats,
        distance: distance,
        passengers: formData.booking.passengers
      }));
    } else {
      dispatch(clearPriceCalculation());
    }
  }, [distance, formData.booking.seats, formData.booking.passengers, dispatch]);

  // Update form price when calculation is done
  useEffect(() => {
    if (priceCalculation) {
      setFormData(prev => ({
        ...prev,
        booking: {
          ...prev.booking,
          price: priceCalculation.price
        }
      }));
    }
  }, [priceCalculation]);

  // Debounced fetch suggestions from OpenStreetMap
  const fetchSuggestions = useCallback(
    debounce(async (query: string, type: 'pickup' | 'dropoff') => {
      if (query.length < 3) {
        if (type === 'pickup') setPickupSuggestions([]);
        else setDropoffSuggestions([]);
        return;
      }
      
      setIsSearching(prev => ({ ...prev, [type]: true }));
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=vn`
        );
        const data = await res.json();
        if (type === 'pickup') setPickupSuggestions(data);
        else setDropoffSuggestions(data);
      } catch (e) {
        console.error('Error fetching suggestions:', e);
      } finally {
        setIsSearching(prev => ({ ...prev, [type]: false }));
      }
    }, 500),
    []
  );

  // Handle click on suggestion
  const handleSuggestionClick = (suggestion: any, type: 'pickup' | 'dropoff') => {
    const coords: [number, number] = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    const address = suggestion.display_name;
    
    setFormData(prev => ({
      ...prev,
      booking: { ...prev.booking, [type]: address }
    }));
    
    if (type === 'pickup') {
      setPickupCoords(coords);
      setPickupSuggestions([]);
    } else {
      setDropoffCoords(coords);
      setDropoffSuggestions([]);
    }
  };

  // Handle map click for location selection
  const handleMapClick = async (lat: number, lon: number) => {
    if (!selectingFor) return;
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      
      if (data.address && data.address.country_code !== 'vn') {
        alert("Vui lòng chọn vị trí trong lãnh thổ Việt Nam.");
        setSelectingFor(null);
        return;
      }

      const address = data.display_name;
      
      setFormData(prev => ({
        ...prev,
        booking: { ...prev.booking, [selectingFor]: address }
      }));
      
      if (selectingFor === 'pickup') {
        setPickupCoords([lat, lon]);
      } else {
        setDropoffCoords([lat, lon]);
      }
      
      setSelectingFor(null);
    } catch (e) {
      console.error('Error reverse geocoding:', e);
    }
  };

  // Manual search for location
  const performManualSearch = async (type: 'pickup' | 'dropoff') => {
    const query = formData.booking[type];
    if (!query) return;
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=vn`
      );
      const data = await res.json();
      if (data && data[0]) {
        const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        if (type === 'pickup') {
          setPickupCoords(coords);
          setPickupSuggestions([]);
        } else {
          setDropoffCoords(coords);
          setDropoffSuggestions([]);
        }
      }
    } catch (e) {
      console.error('Error manual search:', e);
    }
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  // Handle submit with proper email handling
  const handleSubmit = async () => {
    try {
      let emailValue: string | undefined = undefined;
      const selectedPaymentMethod = formData.booking.paymentMethod;
      if (formData.customer.email && formData.customer.email.trim() !== '') {
        emailValue = formData.customer.email.trim();
      }

      const bookingData: CreateBookingRequest = {
        customer: {
          name: formData.customer.name.trim(),
          phone: formData.customer.phone.trim(),
          email: emailValue
        },
        booking: {
          pickup: formData.booking.pickup.trim(),
          dropoff: formData.booking.dropoff.trim(),
          pickupCoords: pickupCoords ? { lat: pickupCoords[0], lng: pickupCoords[1] } : undefined,
          dropoffCoords: dropoffCoords ? { lat: dropoffCoords[0], lng: dropoffCoords[1] } : undefined,
          date: formData.booking.date,
          passengers: formData.booking.passengers,
          seats: formData.booking.seats,
          distance: distance || undefined,
          price: formData.booking.price || 0,
          paymentMethod: formData.booking.paymentMethod,
          notes: formData.booking.notes || undefined
        }
      };

      const result = await dispatch(createBooking(bookingData)).unwrap();

      const bookingId = result?.bookingId;
      if (!bookingId) return;

      if (selectedPaymentMethod === 'transfer') {
        setPaymentError(null);
        setPaymentCreating(true);

        const payRes = await dispatch(createPaymentForBooking(bookingId)).unwrap();
        setPaymentCreating(false);

        if (!payRes?.payUrl) {
          setPaymentError('Không lấy được link thanh toán MoMo. Vui lòng thử lại.');
          return;
        }

        // Chuyển thẳng sang cổng thanh toán MoMo.
        // Sau khi thanh toán xong, MoMo sẽ redirect về backend (/api/payments/momo/return),
        // backend tiếp tục redirect về trang /confirmation?id=...
        window.location.href = payRes.payUrl;
      } else {
        navigate(`/confirmation?id=${bookingId}`);
      }
    } catch (err) {
      console.error('Error booking:', err);
      setPaymentCreating(false);
      setPaymentError((err as any)?.message || 'Thanh toán thất bại');
    }
  };

  const allCoords = [pickupCoords, dropoffCoords].filter((c): c is [number, number] => c !== null);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Progress Steps */}
        <div className="mb-12 flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`h-1 w-12 rounded ${step > s ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-8 md:p-12">
            {/* Step 1: Trip Information */}
            {step === 1 && (
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h2 className="text-3xl font-black text-gray-900 leading-none">Thông Tin Chuyến Đi</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Pickup Location */}
                    <div className="relative">
                      <InputGroup label="Điểm Đón" icon={<MapPin className="text-emerald-500" size={20} />}>
                        <div className="relative group">
                          <input 
                            type="text" 
                            placeholder="Nhập địa chỉ đón"
                            className={`w-full py-4 pl-5 pr-24 bg-gray-50 border rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium ${
                              selectingFor === 'pickup' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-gray-100'
                            }`}
                            value={formData.booking.pickup}
                            onChange={e => {
                              setFormData({...formData, booking: {...formData.booking, pickup: e.target.value}});
                              fetchSuggestions(e.target.value, 'pickup');
                            }}
                            onFocus={() => setSelectingFor('pickup')}
                            onKeyDown={e => e.key === 'Enter' && performManualSearch('pickup')}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {formData.booking.pickup && (
                              <button 
                                onClick={() => {
                                  setFormData({...formData, booking: {...formData.booking, pickup: ''}});
                                  setPickupCoords(null);
                                  setPickupSuggestions([]);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Search size={16} className="rotate-45" />
                              </button>
                            )}
                            <button 
                              onClick={() => setSelectingFor(selectingFor === 'pickup' ? null : 'pickup')}
                              className={`p-2 rounded-xl transition-all ${
                                selectingFor === 'pickup' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title="Chọn trên bản đồ"
                            >
                              <MousePointer2 size={18} />
                            </button>
                          </div>
                        </div>
                      </InputGroup>
                      
                      {isSearching.pickup && (
                        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center justify-center">
                          <Loader className="animate-spin" size={20} />
                          <span className="ml-2 text-sm text-gray-500">Đang tìm kiếm...</span>
                        </div>
                      )}
                      
                      {!isSearching.pickup && pickupSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                          {pickupSuggestions.map((s, i) => (
                            <button 
                              key={i}
                              onClick={() => handleSuggestionClick(s, 'pickup')}
                              className="w-full text-left px-5 py-4 hover:bg-emerald-50 transition-colors flex items-start gap-4 border-b border-gray-50 last:border-0"
                            >
                              <div className="mt-1 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <MapPin size={16} className="text-emerald-500" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900 line-clamp-1">
                                  {s.address?.name || s.display_name.split(',')[0]}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-1">{s.display_name}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dropoff Location */}
                    <div className="relative">
                      <InputGroup label="Điểm Đến" icon={<MapPin className="text-red-500" size={20} />}>
                        <div className="relative group">
                          <input 
                            type="text" 
                            placeholder="Nhập địa chỉ đến"
                            className={`w-full py-4 pl-5 pr-24 bg-gray-50 border rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-medium ${
                              selectingFor === 'dropoff' ? 'border-red-500 ring-4 ring-red-500/10' : 'border-gray-100'
                            }`}
                            value={formData.booking.dropoff}
                            onChange={e => {
                              setFormData({...formData, booking: {...formData.booking, dropoff: e.target.value}});
                              fetchSuggestions(e.target.value, 'dropoff');
                            }}
                            onFocus={() => setSelectingFor('dropoff')}
                            onKeyDown={e => e.key === 'Enter' && performManualSearch('dropoff')}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {formData.booking.dropoff && (
                              <button 
                                onClick={() => {
                                  setFormData({...formData, booking: {...formData.booking, dropoff: ''}});
                                  setDropoffCoords(null);
                                  setDropoffSuggestions([]);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Search size={16} className="rotate-45" />
                              </button>
                            )}
                            <button 
                              onClick={() => setSelectingFor(selectingFor === 'dropoff' ? null : 'dropoff')}
                              className={`p-2 rounded-xl transition-all ${
                                selectingFor === 'dropoff' ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title="Chọn trên bản đồ"
                            >
                              <MousePointer2 size={18} />
                            </button>
                          </div>
                        </div>
                      </InputGroup>
                      
                      {isSearching.dropoff && (
                        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center justify-center">
                          <Loader className="animate-spin" size={20} />
                          <span className="ml-2 text-sm text-gray-500">Đang tìm kiếm...</span>
                        </div>
                      )}
                      
                      {!isSearching.dropoff && dropoffSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                          {dropoffSuggestions.map((s, i) => (
                            <button 
                              key={i}
                              onClick={() => handleSuggestionClick(s, 'dropoff')}
                              className="w-full text-left px-5 py-4 hover:bg-red-50 transition-colors flex items-start gap-4 border-b border-gray-50 last:border-0"
                            >
                              <div className="mt-1 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <MapPin size={16} className="text-red-500" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900 line-clamp-1">
                                  {s.address?.name || s.display_name.split(',')[0]}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-1">{s.display_name}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Date & Time */}
                    <InputGroup label="Ngày & Giờ" icon={<Calendar className="text-blue-500" size={20} />}>
                      <input 
                        type="datetime-local" 
                        className="w-full py-4 px-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        value={formData.booking.date}
                        onChange={e => setFormData({...formData, booking: {...formData.booking, date: e.target.value}})}
                      />
                    </InputGroup>

                    {/* Passengers */}
                    <InputGroup label="Số người" icon={<Users className="text-purple-500" size={20} />}>
                      <input 
                        type="number" 
                        min="1"
                        max="100"
                        className="w-full py-4 px-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        value={formData.booking.passengers}
                        onChange={e => setFormData({...formData, booking: {...formData.booking, passengers: parseInt(e.target.value) || 1}})}
                      />
                    </InputGroup>
                  </div>

                  {/* Distance and Price Preview */}
                  {distance && priceCalculation && (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                          <Navigation size={20} />
                        </div>
                        <div>
                          <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Khoảng cách ước tính</div>
                          <div className="text-xl font-black text-emerald-700">{distance.toFixed(1)} km</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Giá dự kiến</div>
                        <div className="text-xl font-black text-emerald-700">{priceCalculation.price.toLocaleString('vi-VN')}đ</div>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Type Selection */}
                  <div className="space-y-4">
                    <label className="block text-sm font-black text-gray-700 uppercase tracking-widest">Loại Xe</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {vehicleTypes.map(type => (
                        <button
                          key={type.seats}
                          onClick={() => setFormData({
                            ...formData, 
                            booking: {
                              ...formData.booking, 
                              seats: type.seats
                            }
                          })}
                          className={`p-5 rounded-3xl border-2 text-left transition-all ${
                            formData.booking.seats === type.seats 
                              ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' 
                              : 'border-gray-50 hover:border-gray-200 bg-white'
                          }`}
                        >
                          <Car size={28} className={formData.booking.seats === type.seats ? 'text-emerald-500' : 'text-gray-300'} />
                          <div className="mt-3 font-black text-gray-900">{type.type_name}</div>
                          <div className="text-xs text-gray-400 font-bold">Tối đa {type.seats} chỗ</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Validation Warning */}
                  {formData.booking.passengers > formData.booking.seats && (
                    <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                      <p className="text-red-600 text-sm font-medium">
                        ⚠️ Số hành khách ({formData.booking.passengers}) vượt quá số ghế ({formData.booking.seats} chỗ)
                      </p>
                    </div>
                  )}

                  {/* Next Button */}
                  <button 
                    onClick={handleNext}
                    disabled={
                      !formData.booking.pickup || 
                      !formData.booking.dropoff || 
                      !formData.booking.date ||
                      formData.booking.passengers > formData.booking.seats ||
                      loading
                    }
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white py-5 rounded-4xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200"
                  >
                    {loading ? <Loader className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                    {loading ? 'Đang tính giá...' : 'Tiếp Theo'}
                  </button>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                </div>

                {/* Map */}
                <div className="h-96 lg:h-auto min-h-100 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner relative">
                  <MapContainer center={[21.0285, 105.8542]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {pickupCoords && (
                      <Marker position={pickupCoords}>
                        <Popup>Điểm Đón</Popup>
                      </Marker>
                    )}
                    {dropoffCoords && (
                      <Marker position={dropoffCoords}>
                        <Popup>Điểm Đến</Popup>
                      </Marker>
                    )}
                    {pickupCoords && dropoffCoords && (
                      <Polyline positions={[pickupCoords, dropoffCoords]} color="#10b981" weight={4} dashArray="10, 10" />
                    )}
                    <MapUpdater coords={allCoords} />
                    <MapEvents onMapClick={handleMapClick} />
                  </MapContainer>
                  
                  {/* Map Selection Indicator */}
                  {selectingFor && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-white px-6 py-3 rounded-full shadow-2xl border border-emerald-100 flex items-center gap-3 animate-bounce">
                      <MousePointer2 className={selectingFor === 'pickup' ? 'text-emerald-500' : 'text-red-500'} size={20} />
                      <span className="font-black text-sm uppercase tracking-widest text-gray-700">
                        Click vào bản đồ để chọn {selectingFor === 'pickup' ? 'điểm đón' : 'điểm đến'}
                      </span>
                    </div>
                  )}
                  
                  {/* Empty Map Overlay */}
                  {!pickupCoords && !dropoffCoords && !selectingFor && (
                    <div className="absolute inset-0 bg-gray-900/5 backdrop-blur-[2px] z-40 flex items-center justify-center p-8 text-center pointer-events-none">
                      <div className="bg-white p-6 rounded-3xl shadow-xl max-w-xs">
                        <Navigation className="mx-auto text-emerald-500 mb-4" size={32} />
                        <p className="text-gray-500 font-medium">Nhập địa chỉ để xem lộ trình trên bản đồ</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
              <div className="max-w-2xl mx-auto space-y-8">
                <h2 className="text-3xl font-black text-gray-900">Thông Tin Liên Hệ</h2>
                <div className="space-y-6">
                  <InputGroup label="Họ và Tên">
                    <input 
                      type="text" 
                      placeholder="Nhập họ và tên"
                      className="w-full py-4 px-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                      value={formData.customer.name}
                      onChange={e => setFormData({...formData, customer: {...formData.customer, name: e.target.value}})}
                    />
                  </InputGroup>
                  <InputGroup label="Số Điện Thoại">
                    <input 
                      type="tel" 
                      placeholder="Nhập số điện thoại"
                      className="w-full py-4 px-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                      value={formData.customer.phone}
                      onChange={e => setFormData({...formData, customer: {...formData.customer, phone: e.target.value}})}
                    />
                  </InputGroup>
                  <InputGroup label="Email (Không bắt buộc)">
                    <input 
                      type="email" 
                      placeholder="Nhập email"
                      className="w-full py-4 px-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                      value={formData.customer.email ?? ''}
                      onChange={e => setFormData({...formData, customer: {...formData.customer, email: e.target.value}})}
                    />
                  </InputGroup>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(1)} 
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-5 rounded-2xl font-bold transition-all"
                  >
                    Quay Lại
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={!formData.customer.name || !formData.customer.phone}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-emerald-100"
                  >
                    Tiếp Theo
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation & Payment */}
            {step === 3 && (
              <div className="max-w-2xl mx-auto space-y-8">
                <h2 className="text-3xl font-black text-gray-900">Xác Nhận & Thanh Toán</h2>
                
                {/* Booking Summary */}
                <div className="bg-emerald-50 p-8 rounded-4xl border border-emerald-100 shadow-inner">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-emerald-700 font-bold">Tổng cộng:</span>
                    <span className="text-3xl font-black text-emerald-600">{(formData.booking.price || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="space-y-4 text-gray-700">
                    {distance && (
                      <div className="flex gap-3">
                        <Navigation className="text-emerald-500 shrink-0" size={20} />
                        <p><strong>Khoảng cách:</strong> {distance.toFixed(1)} km</p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <MapPin className="text-emerald-500 shrink-0" size={20} />
                      <p><strong>Điểm đón:</strong> {formData.booking.pickup}</p>
                    </div>
                    <div className="flex gap-3">
                      <MapPin className="text-red-500 shrink-0" size={20} />
                      <p><strong>Điểm đến:</strong> {formData.booking.dropoff}</p>
                    </div>
                    <div className="flex gap-3">
                      <Calendar className="text-blue-500 shrink-0" size={20} />
                      <p><strong>Thời gian:</strong> {new Date(formData.booking.date).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="flex gap-3">
                      <Users className="text-purple-500 shrink-0" size={20} />
                      <p><strong>Số người:</strong> {formData.booking.passengers}</p>
                    </div>
                    <div className="flex gap-3">
                      <Car className="text-emerald-500 shrink-0" size={20} />
                      <p><strong>Loại xe:</strong> {vehicleTypes.find(v => v.seats === formData.booking.seats)?.type_name} ({formData.booking.seats} chỗ)</p>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <label className="block text-sm font-black text-gray-700 uppercase tracking-widest">Phương Thức Thanh Toán</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormData({...formData, booking: {...formData.booking, paymentMethod: 'cash'}})}
                      className={`p-5 rounded-3xl border-2 flex items-center gap-3 transition-all ${
                        formData.booking.paymentMethod === 'cash' 
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' 
                          : 'border-gray-50 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <Banknote className={formData.booking.paymentMethod === 'cash' ? 'text-emerald-500' : 'text-gray-300'} />
                      <span className="font-black text-gray-900">Tiền Mặt</span>
                    </button>
                    <button
                      onClick={() => setFormData({...formData, booking: {...formData.booking, paymentMethod: 'transfer'}})}
                      className={`p-5 rounded-3xl border-2 flex items-center gap-3 transition-all ${
                        formData.booking.paymentMethod === 'transfer' 
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' 
                          : 'border-gray-50 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <CreditCard className={formData.booking.paymentMethod === 'transfer' ? 'text-emerald-500' : 'text-gray-300'} />
                      <span className="font-black text-gray-900">Chuyển Khoản</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(2)} 
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-5 rounded-2xl font-bold transition-all"
                    disabled={loading}
                  >
                    Quay Lại
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200"
                  >
                    {loading ? <Loader className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    {loading ? 'Đang xử lý...' : 'Xác Nhận Đặt Xe'}
                  </button>
                </div>

                {paymentError && formData.booking.paymentMethod === 'transfer' && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-3xl p-6">
                    <h3 className="text-sm font-black text-red-700 mb-2">Lỗi thanh toán chuyển khoản</h3>
                    <p className="text-sm text-red-700">{paymentError}</p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-black text-gray-700 uppercase tracking-widest">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
