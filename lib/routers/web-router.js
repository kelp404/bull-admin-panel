const express = require('express');
const baseHandler = require('../handlers/base-handler');

const router = new express.Router();

router.get('/', baseHandler.getBaseTemplate);
router.get(/^\/jobs\/\d+$/, baseHandler.getBaseTemplate);

module.exports = router;
