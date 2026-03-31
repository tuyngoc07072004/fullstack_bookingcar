import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { debounce } from 'lodash';
import { ArrowLeft, Loader, MapPin, Navigation, Users, Car, DollarSign } from 'lucide-react';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { updateDriverInfo } from '../../redux/Driver/Driver.Slice';
import { fetchMyVehicle, submitDriverSelfBooking } from '../../redux/DriverSelfTrip/DriverSelfTrip.Slice';
import { getApiUrl } from '../../utils/dbUrl';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
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

function MapClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function DriverCreateTrip() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentDriver, token } = useAppSelector((s) => s.driver);
  const { myVehicle, loading: vehicleLoading, createLoading, error } = useAppSelector(
    (s) => s.driverSelfTrip
  );

  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [pickupLabel, setPickupLabel] = useState<string>('Vị trí hiện tại');
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [dropoff, setDropoff] = useState('');
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [searchingDropoff, setSearchingDropoff] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [tripDate, setTripDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [distance, setDistance] = useState<number | null>(null);
  const [priceEstimate, setPriceEstimate] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('driverToken');
    const info = localStorage.getItem('driverInfo');
    if (!t || !info) {
      navigate('/driver-login', { replace: true });
      return;
    }
    if (!currentDriver?._id) {
      try {
        dispatch(updateDriverInfo(JSON.parse(info)));
      } catch {
        navigate('/driver-login', { replace: true });
      }
    }
  }, [currentDriver, dispatch, navigate]);

  useEffect(() => {
    if (token || localStorage.getItem('driverToken')) {
      dispatch(fetchMyVehicle());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ định vị');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPickupCoords([lat, lng]);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data.display_name) setPickupLabel(data.display_name);
        } catch {
          /* ignore */
        }
      },
      () => setGeoError('Không lấy được vị trí. Vui lòng cho phép truy cập vị trí.'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      const d = haversineKm(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]);
      setDistance(d);
    } else {
      setDistance(null);
      setPriceEstimate(null);
    }
  }, [pickupCoords, dropoffCoords]);

  useEffect(() => {
    const seats = myVehicle?.vehicle?.seats;
    if (!distance || !seats || distance <= 0) {
      setPriceEstimate(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl('/bookings')}/calculate-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seats, distance })
        });
        const json = await res.json();
        if (!cancelled && json.success && json.data?.price != null) {
          setPriceEstimate(json.data.price);
        }
      } catch {
        if (!cancelled) setPriceEstimate(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [distance, myVehicle?.vehicle?.seats]);

  const fetchDropoffSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setDropoffSuggestions([]);
        return;
      }
      setSearchingDropoff(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=vn`
        );
        const data = await res.json();
        setDropoffSuggestions(data);
      } catch {
        setDropoffSuggestions([]);
      } finally {
        setSearchingDropoff(false);
      }
    }, 400),
    []
  );

  const handleDropoffSuggestion = (s: any) => {
    setDropoff(s.display_name);
    setDropoffCoords([parseFloat(s.lat), parseFloat(s.lon)]);
    setDropoffSuggestions([]);
  };

  const handleMapDropoff = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      setDropoff(data.display_name || 'Điểm đến');
      setDropoffCoords([lat, lng]);
    } catch {
      setDropoffCoords([lat, lng]);
    }
  };

  const handleSubmit = async () => {
    if (!pickupCoords || !dropoffCoords || !customerName.trim() || !customerPhone.trim()) {
      alert('Vui lòng điền đủ thông tin và chọn điểm đến trên bản đồ hoặc tìm kiếm.');
      return;
    }
    if (!myVehicle?.vehicle) {
      alert('Chưa có thông tin xe. Vui lòng được nhân viên phân công trước.');
      return;
    }
    if (passengers > myVehicle.vehicle.seats) {
      alert(`Số khách không được vượt quá ${myVehicle.vehicle.seats} chỗ.`);
      return;
    }
    try {
      await dispatch(
        submitDriverSelfBooking({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          pickupCoords: { lat: pickupCoords[0], lng: pickupCoords[1] },
          pickupAddressLabel: pickupLabel,
          dropoff: dropoff.trim(),
          dropoffCoords: { lat: dropoffCoords[0], lng: dropoffCoords[1] },
          tripDate: new Date(tripDate).toISOString(),
          passengers
        })
      ).unwrap();
      alert('Tạo chuyến thành công!');
      navigate('/driver-dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  const seats = myVehicle?.vehicle?.seats ?? 0;
  const mapCenter = pickupCoords || [21.0285, 105.8542];
  const lineCoords = pickupCoords && dropoffCoords ? [pickupCoords, dropoffCoords] : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/driver-dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-semibold mb-6"
        >
          <ArrowLeft size={20} />
          Quay lại bảng điều khiển
        </button>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Tạo chuyến mới</h1>
        <p className="text-gray-500 mb-8">
          Điểm đón là vị trí hiện tại của bạn. Loại xe theo xe bạn đang gắn với tài khoản.
        </p>

        {vehicleLoading && (
          <div className="flex items-center gap-2 text-emerald-600 mb-4">
            <Loader className="animate-spin" size={20} />
            <span>Đang tải...</span>
          </div>
        )}

        {geoError && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
            {geoError}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {myVehicle && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Car className="text-emerald-600" size={24} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-gray-400 tracking-wider">Xe của bạn</div>
                <div className="text-lg font-bold text-gray-900">{myVehicle.vehicle.type_name}</div>
                <div className="text-sm text-gray-600">
                  {myVehicle.vehicle.vehicle_name} · {myVehicle.vehicle.license_plate} · {myVehicle.vehicle.seats}{' '}
                  chỗ
                </div>
                <div className="text-xs text-gray-400 mt-1">Nguồn: {myVehicle.source === 'profile' ? 'Hồ sơ' : 'Phân công gần nhất'}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 uppercase tracking-widest mb-2">
                <MapPin className="text-emerald-500" size={18} />
                Điểm đón (hiện tại)
              </label>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                {pickupLabel}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm relative">
              <label className="flex items-center gap-2 text-sm font-black text-gray-700 uppercase tracking-widest mb-2">
                <MapPin className="text-red-500" size={18} />
                Điểm đến
              </label>
              <input
                type="text"
                placeholder="Tìm địa chỉ đến..."
                className="w-full py-3 px-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                value={dropoff}
                onChange={(e) => {
                  setDropoff(e.target.value);
                  fetchDropoffSuggestions(e.target.value);
                }}
              />
              {searchingDropoff && (
                <p className="text-xs text-gray-400 mt-2">Đang tìm...</p>
              )}
              {dropoffSuggestions.length > 0 && (
                <ul className="absolute z-50 left-6 right-6 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-auto">
                  {dropoffSuggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 border-b border-gray-50 last:border-0"
                        onClick={() => handleDropoffSuggestion(s)}
                      >
                        {s.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-gray-400 mt-2">Hoặc click trên bản đồ để chọn điểm đến.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Họ tên khách</label>
                <input
                  type="text"
                  className="mt-1 w-full py-3 px-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-emerald-500"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Số điện thoại khách</label>
                <input
                  type="tel"
                  className="mt-1 w-full py-3 px-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-emerald-500"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0912345678"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Users size={16} /> Số khách
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={seats || 45}
                    className="mt-1 w-full py-3 px-4 bg-gray-50 border border-gray-100 rounded-2xl"
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Thời gian đón</label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full py-3 px-4 bg-gray-50 border border-gray-100 rounded-2xl"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {distance != null && priceEstimate != null && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Navigation className="text-emerald-600" />
                  <div>
                    <div className="text-xs text-emerald-700 font-bold uppercase">Khoảng cách</div>
                    <div className="text-xl font-black text-emerald-800">{distance.toFixed(1)} km</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="text-emerald-600" />
                  <div>
                    <div className="text-xs text-emerald-700 font-bold uppercase">Giá dự kiến</div>
                    <div className="text-xl font-black text-emerald-800">{priceEstimate.toLocaleString('vi-VN')}đ</div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={createLoading || !myVehicle || !pickupCoords || !dropoffCoords}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
            >
              {createLoading ? <Loader className="animate-spin" size={20} /> : null}
              Xác nhận tạo chuyến
            </button>
          </div>

          <div className="h-105 min-h-80 rounded-4xl overflow-hidden border border-gray-100 shadow-inner">
            <MapContainer center={mapCenter as [number, number]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {pickupCoords && (
                <Marker position={pickupCoords}>
                </Marker>
              )}
              {dropoffCoords && (
                <Marker position={dropoffCoords}>
                </Marker>
              )}
              {lineCoords.length === 2 && <Polyline positions={lineCoords} color="#10b981" weight={4} />}
              <MapClickPicker onPick={handleMapDropoff} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
