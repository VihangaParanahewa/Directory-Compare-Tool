var express = require('express');
var router = express.Router();

const diffController = require('./diffController.js');

router.post('/', diffController.compareDiff);
router.get('/', diffController.getDiff);


module.exports = router;
