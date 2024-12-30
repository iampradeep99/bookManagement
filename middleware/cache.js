const Redis = require('ioredis');
const redis = new Redis();

const cache = async (req, res, next) => {
  const cacheKey = req.originalUrl;

  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  }

  res.sendResponse = res.json;
  res.json = (body) => {
    redis.setex(cacheKey, 30, JSON.stringify(body));  
    res.sendResponse(body);
  };
  
  next();
};

module.exports = cache;
