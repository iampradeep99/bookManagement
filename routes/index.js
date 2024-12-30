var express = require('express');
var router = express.Router();
const fetchAndAggregateData = require('../utils/fetchData');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/fetchData', async(req, res)=>{
  try {
    const aggregatedData = await fetchAndAggregateData();
    console.log(aggregatedData);
    res.status(200).json({message:"fetched", data:aggregatedData}) // Output the aggregated data
} catch (error) {
    console.error('Error:', error);
}
})

module.exports = router;
