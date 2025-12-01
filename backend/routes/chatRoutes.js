const express = require('express');
const { getOrCreateChat, getUserChats } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.route('/')
  .post(getOrCreateChat)
  .get(getUserChats);

module.exports = router;