exports.getTypes = (req, res) => new Promise((resolve, reject) => {
  req.queue.types((error, types) => {
    if (error) {
      return reject(error);
    }

    res.json(types);
    resolve();
  });
});
