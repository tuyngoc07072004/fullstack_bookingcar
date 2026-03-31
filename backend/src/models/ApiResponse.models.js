class ApiResponse {
  constructor(success, data, message, error = null, extra = null) {
    this.success = success;
    this.data = data;
    this.message = message;
    if (error) this.error = error;
    if (extra) this.extra = extra;
  }

  static success(data, message = 'Success', extra = null) {
    return new ApiResponse(true, data, message, null, extra);
  }

  static error(message, error = null, extra = null) {
    return new ApiResponse(false, null, message, error, extra);
  }
}

module.exports = ApiResponse;