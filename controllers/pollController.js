const pollService = require("../services/pollService");

async function createPoll(req, res, next) {
  try {
    const poll = await pollService.createPoll({
      question: req.body.question,
      options: req.body.options || [],
      targetClass: req.body.targetClass,
    });

    return res.status(201).json({
      success: true,
      message: "Poll created successfully",
      data: poll,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPolls(req, res, next) {
  try {
    const polls = await pollService.getPolls();
    return res.status(200).json({ success: true, data: polls });
  } catch (error) {
    return next(error);
  }
}

async function getPollResults(req, res, next) {
  try {
    const results = await pollService.getPollResults(req.params.id || null);
    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPoll,
  getPolls,
  getPollResults,
};
