const express = require('express');
const AdminPanel = require('./lib/admin-panel');

module.exports = class BullAdminPanel extends express.Router {
  constructor(args) {
    super();
    this.adminPanel = new AdminPanel({
      ...args,
      expressRouter: this,
    });
  }
};
