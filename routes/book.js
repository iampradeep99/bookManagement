const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const router = express.Router();

mongoose.connect('mongodb://localhost:27017/booksDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, minlength: 3 },
  author: { type: String, required: true, minlength: 3 },
  publishedYear: { type: Number, required: true },
  genre: { type: String, required: true },
});

const Book = mongoose.model('Book', bookSchema);

const validateBook = (book) => {
  const schema = Joi.object({
    title: Joi.string().min(3).required(),
    author: Joi.string().min(3).required(),
    publishedYear: Joi.number().integer().required(),
    genre: Joi.string().required(),
  });
  return schema.validate(book);
};

const redis = new Redis(); 

const invalidateCache = async (keyPattern) => {
  await redis.publish('cache-invalidation', keyPattern);
};

const subscribeToCacheInvalidation = () => {
  const subscriber = new Redis();
  subscriber.subscribe('cache-invalidation', (err, count) => {
    if (err) {
      console.error('Failed to subscribe:', err);
    } else {
      console.log(`Subscribed to cache-invalidation channel`);
    }
  });

  subscriber.on('message', (channel, message) => {
    console.log(`Cache invalidation event: ${message}`);
    redis.del(message);
  });
};

router.get('/allbooks', async (req, res) => {
  const cacheKey = 'allbooks';

  const cachedBooks = await redis.get(cacheKey);
  if (cachedBooks) {
    console.log('Cache hit for all books');
    return res.status(200).json(JSON.parse(cachedBooks));
  }

  try {
    const books = await Book.find({});
    redis.setex(cacheKey, 30, JSON.stringify(books));
    res.status(200).json(books);
  } catch (error) {
    res.status(500).send('Error fetching books');
  }
});

router.post('/', async (req, res) => {
  const { error } = validateBook(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const { title, author, publishedYear, genre } = req.body;

  try {
    const newBook = new Book({ title, author, publishedYear, genre });
    await newBook.save();
    
    await invalidateCache('allbooks');
    await invalidateCache(`/book/${newBook._id}`);

    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).send('Error saving book');
  }
});

router.get('/:id', async (req, res) => {
  const cacheKey = `/book/${req.params.id}`;

  const cachedBook = await redis.get(cacheKey);
  if (cachedBook) {
    console.log(`Cache hit for book with ID: ${req.params.id}`);
    return res.status(200).json(JSON.parse(cachedBook));
  }

  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).send('Book not found');

    redis.setex(cacheKey, 30, JSON.stringify(book));
    res.status(200).json(book);
  } catch (error) {
    res.status(500).send('Error fetching book');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).send('Book not found');

    await invalidateCache('allbooks');
    await invalidateCache(`/book/${req.params.id}`);

    res.status(200).send('Book deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting book');
  }
});

module.exports = (io) => {
  subscribeToCacheInvalidation();
  router.io = io;
  return router;
};
