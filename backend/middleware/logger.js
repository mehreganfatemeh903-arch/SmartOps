function logger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    const log = {
      time: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress
    };

    // محیط توسعه → خروجی کامل
    if (process.env.NODE_ENV !== 'production') {
      console.log('📘 Request Log:', log);
    } else {
      // محیط production → خروجی خلاصه
      console.log(
        `[${log.time}] ${log.method} ${log.url} - ${log.status} (${log.duration})`
      );
    }
  });

  next();
}

module.exports = logger;
