module.exports = class Job {
  constructor(args) {
    this.id = `${args.id}`;
    this.name = args.name;
    this.opts = args.opts;
    this.data = args.data;
    this.progress = args._progress;
    this.delay = args.delay;
    this.timestamp = args.timestamp;
    this.processedOn = args.processedOn;
    this.finishedOn = args.finishedOn;
    this.stacktrace = args.stacktrace;
    this.returnvalue = args.returnvalue;
    this.attemptsMade = args.attemptsMade;
    this.failedReason = args.failedReason;
    this.queue = {name: args.queue.name};
    this.state = args.state;
  }
};
