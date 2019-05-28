const express = require('express');
const baseHandler = require('../handlers/base-handler');

const router = new express.Router();

router.get('/', baseHandler.baseView);

module.exports = router;
