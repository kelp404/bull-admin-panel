const PRIORITY = {
  10: 'low',
  0: 'normal',
  '-5': 'medium',
  '-10': 'high',
  '-15': 'critical'
};

module.exports = class Job {
  constructor(args) {
    this.id = Number(args.id);
    this.state = args._state;
    this.type = args.type;
    this.data = args.data;
    this.error = args._error;
    this.result = args.result;
    this.priority = PRIORITY[`${args._priority}`];
    this.progress = Number(args._progress);
    this.workerId = args.workerId;
    this.createdAt = args.created_at ? new Date(Number(args.created_at)) : args.created_at;
    this.promoteAt = args.promote_at ? new Date(Number(args.promote_at)) : args.promote_at;
    this.startedAt = args.started_at ? new Date(Number(args.started_at)) : args.started_at;
    this.failedAt = args.failed_at ? new Date(Number(args.failed_at)) : args.failed_at;
    this.updatedAt = args.updated_at ? new Date(Number(args.updated_at)) : args.updated_at;
  }
};
