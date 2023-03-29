import * as express from 'express';

export const expressApp = express();

expressApp.get('/express', (req, res) => {
  res.send('Hello Express!');
});
