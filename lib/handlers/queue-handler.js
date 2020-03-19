/**
 * [SOCKET] GET /queues
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @returns {undefined}
 *  200: [
 *    {
 *      name: string
 *    }
 *  ]
 */
exports.getQueues = (req, res) => {
  res.json(req.queues.map(queue => ({name: queue.name})));
};
