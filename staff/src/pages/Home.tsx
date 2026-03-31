import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Users, ChevronRight, Star, Shield, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="relative h-600 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1920" 
            alt="Hero Background" 
            className="w-full h-full object-cover brightness-50"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Hành Trình An Toàn, <br />
              Dịch Vụ Tận Tâm
            </h1>
            <p className="text-xl mb-8 text-gray-200">
              Đặt xe đưa đón sân bay, liên tỉnh và du lịch với đội ngũ tài xế chuyên nghiệp và xe đời mới.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/book-ride" 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center gap-2"
              >
                Đặt Xe Ngay <ChevronRight size={20} />
              </Link>
              <Link 
                to="/my-trips" 
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-full font-semibold text-lg transition-all"
              >
                Lịch Sử Chuyến Đi
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Tại Sao Chọn Chúng Tôi?</h2>
            <div className="w-20 h-1 bg-emerald-500 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Shield className="text-emerald-500" size={32} />}
              title="An Toàn Tuyệt Đối"
              description="Tài xế được tuyển chọn kỹ lưỡng, xe luôn được bảo dưỡng định kỳ để đảm bảo an toàn cho bạn."
            />
            <FeatureCard 
              icon={<Clock className="text-emerald-500" size={32} />}
              title="Đúng Giờ & Nhanh Chóng"
              description="Cam kết đón khách đúng giờ, lộ trình tối ưu giúp bạn tiết kiệm thời gian quý báu."
            />
            <FeatureCard 
              icon={<Star className="text-emerald-500" size={32} />}
              title="Giá Cả Minh Bạch"
              description="Giá cước được hiển thị rõ ràng ngay khi đặt xe, không phát sinh chi phí ẩn."
            />
          </div>
        </div>
      </section>

      {/* Vehicle Types */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Đội Xe Đa Dạng</h2>
              <p className="text-gray-600">Phù hợp với mọi nhu cầu di chuyển của bạn</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <VehicleTypeCard 
              image="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800"
              name="9 Chỗ (Limousine)"
              seats="9 Chỗ"
              price="Từ 2.600.000đ/100km"
            />
            <VehicleTypeCard 
              image="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800"
              name="16 Chỗ (Transit)"
              seats="16 Chỗ"
              price="Từ 2.000.000đ/100km"
            />
            <VehicleTypeCard 
              image="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"
              name="29 Chỗ (County)"
              seats="29 Chỗ"
              price="Từ 3.000.000đ/100km"
            />
            <VehicleTypeCard 
              image="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800"
              name="45 Chỗ (Universe)"
              seats="45 Chỗ"
              price="Từ 5.700.000đ/100km"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function VehicleTypeCard({ image, name, seats, price }: { image: string, name: string, seats: string, price: string }) {
  return (
    <div className="group rounded-2xl overflow-hidden border border-gray-200 hover:border-emerald-500 transition-colors">
      <div className="h-48 overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="flex items-center gap-4 text-gray-600 mb-4">
          <span className="flex items-center gap-1"><Users size={16} /> {seats}</span>
        </div>
        <p className="text-emerald-600 font-semibold">{price}</p>
      </div>
    </div>
  );
}