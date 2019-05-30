const express = require('express');
const baseHandler = require('../handlers/base-handler');

const router = new express.Router();

router.get('/', baseHandler.baseView);
router.get(/^\/jobs\/\d+$/, baseHandler.baseView);

module.exports = router;
