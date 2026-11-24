function sendSuccess({ res, data, statusCode = 200, pagination }) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(pagination && { pagination }),
  });
}

function sendError(res, statusCode, code, message, details) {
  const errorBody = { code, message };
  if (details !== undefined) {
    errorBody.details = details;
  }
  return res.status(statusCode).json({
    success: false,
    error: errorBody,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
