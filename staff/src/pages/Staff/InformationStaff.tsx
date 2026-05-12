import React, { useMemo, useState } from 'react'
import { Mail, Phone, User, Shield, Lock, Save } from 'lucide-react'
import { staffApi } from '../../redux/Staff/Staff.Api'
import { getApiUrl } from '../../utils/dbUrl'

interface StaffInfo {
  _id?: string
  id?: string
  name: string
  username?: string
  email: string
  phone: string
  role?: string
}

interface InformationStaffProps {
  staffInfo: StaffInfo
  onProfileUpdated?: (info: StaffInfo) => void
}

const InformationStaff = ({ staffInfo, onProfileUpdated }: InformationStaffProps) => {
  const [name, setName] = useState(staffInfo?.name || '')
  const [phone, setPhone] = useState(staffInfo?.phone || '')
  const [email, setEmail] = useState(staffInfo?.email || '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [method, setMethod] = useState<'email' | 'sms'>('email')
  const [otpId, setOtpId] = useState('')
  const [maskedContact, setMaskedContact] = useState('')
  const [otp, setOtp] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const token = useMemo(() => {
    return localStorage.getItem('staffToken') || sessionStorage.getItem('staffToken') || ''
  }, [])

  const resetPasswordFlow = () => {
    setOtpId('')
    setMaskedContact('')
    setOtp('')
    setVerificationToken('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  const handleUpdateProfile = async () => {
    try {
      setSavingProfile(true)
      const response = await fetch(getApiUrl('/staff/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, email })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Cập nhật thất bại')
      }

      const updated = data.data || { ...staffInfo, name, phone, email }
      const stored = localStorage.getItem('staffInfo')
      if (stored) {
        localStorage.setItem('staffInfo', JSON.stringify({ ...JSON.parse(stored), ...updated }))
      }
      onProfileUpdated?.(updated)
      alert('Cập nhật thông tin thành công')
    } catch (error: any) {
      alert(error.message || 'Cập nhật thất bại')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleRequestOtp = async () => {
    try {
      setSendingOtp(true)
      const result = await staffApi.requestPasswordChange(method, token)
      setOtpId(result.otpId)
      setMaskedContact(result.contact)
      setVerificationToken('')
      setOtp('')
      alert(`Đã gửi mã OTP tới ${result.contact}`)
    } catch (error: any) {
      alert(error.message || 'Gửi OTP thất bại')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpId || !otp) {
      alert('Vui lòng nhập mã OTP')
      return
    }

    try {
      setVerifyingOtp(true)
      const result = await staffApi.verifyOtp(otpId, otp, token)
      setVerificationToken(result.verificationToken)
      alert('Xác thực OTP thành công')
    } catch (error: any) {
      alert(error.message || 'Xác thực OTP thất bại')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert('Vui lòng nhập đầy đủ thông tin mật khẩu')
      return
    }
    if (newPassword !== confirmNewPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu chưa khớp')
      return
    }
    if (!verificationToken) {
      alert('Vui lòng xác thực OTP trước khi đổi mật khẩu')
      return
    }

    try {
      setChangingPassword(true)
      await staffApi.changePasswordWithOtp(
        { currentPassword, newPassword, verificationToken },
        token
      )
      alert('Đổi mật khẩu thành công')
      resetPasswordFlow()
    } catch (error: any) {
      alert(error.message || 'Đổi mật khẩu thất bại')
    } finally {
      setChangingPassword(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase() || '?'
  }

  return (
    <div className="max-w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-500 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {getInitials(staffInfo?.name)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{staffInfo?.name}</h1>
              {staffInfo?.role && (
                <p className="text-emerald-100 mt-1 flex items-center gap-2">
                  <Shield size={16} />
                  {staffInfo.role}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Họ Tên</p>
              <input
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Username */}
          {staffInfo?.username && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium">Tên đăng nhập</p>
                <p className="text-lg font-bold text-gray-900">{staffInfo.username}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Mail size={24} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Email</p>
              <input
                type="email"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Phone size={24} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Số điện thoại</p>
              <input
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleUpdateProfile}
            disabled={savingProfile}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-60"
          >
            <Save size={16} />
            {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="border border-gray-100 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock size={18} />
              Đổi mật khẩu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setMethod('email')}
                className={`px-3 py-2 rounded-lg border ${method === 'email' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200'}`}
              >
                Nhận mã qua Email
              </button>
              <button
                type="button"
                onClick={() => setMethod('sms')}
                className={`px-3 py-2 rounded-lg border ${method === 'sms' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200'}`}
              >
                Nhận mã qua SĐT
              </button>
            </div>

            <button
              onClick={handleRequestOtp}
              disabled={sendingOtp}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-60"
            >
              {sendingOtp ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
            {maskedContact && <p className="text-sm text-gray-500 mt-2">Mã đã gửi tới: {maskedContact}</p>}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="px-3 py-2 rounded-lg border border-gray-200"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || !otpId}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
              >
                {verifyingOtp ? 'Đang xác thực...' : 'Xác thực OTP'}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="password"
                className="px-3 py-2 rounded-lg border border-gray-200"
                placeholder="Mật khẩu cũ"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                className="px-3 py-2 rounded-lg border border-gray-200"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                className="px-3 py-2 rounded-lg border border-gray-200"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
            >
              {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InformationStaff
