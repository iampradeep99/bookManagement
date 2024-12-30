let books = [];  

const bookSchema = Joi.object({
  title: Joi.string().min(3).required(),
  author: Joi.string().min(3).required(),
  publishedYear: Joi.number().integer().required(),
  genre: Joi.string().required(),
});