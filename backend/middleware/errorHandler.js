// Central error handler - keeps sensitive stack traces out of client responses in production
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value: this record already exists';
  }

  if (err instanceof require('multer').MulterError) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

module.exports = errorHandler;
