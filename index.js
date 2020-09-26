const express = require('express');
const cors = require('cors');
const multer = require('multer');
const s3 = require('./aws/aws');
const { v4: uuidv4 } = require('uuid');
require('./db/mongoose');
const FileInfo = require('./models/file');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.get('/fileinfo', async (req, res) => {
  try {
    const filelist = await FileInfo.find({
      ...req.query,
    }).sort({ createdAt: 'desc' });
    res.status(200).send(filelist);
  } catch (e) {
    res.status(400).send(e);
  }
});

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

app.post('/file', upload.single('multerkey'), function (req, res, next) {
  const uniqueid = uuidv4();
  const extension = req.file.originalname.split('.').pop();

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: uniqueid,
    Body: req.file.buffer,
  };

  s3.upload(params, async function (err, data) {
    if (err) {
      throw err;
    }
    const file = new FileInfo({
      uuid: uniqueid,
      filename: req.file.originalname,
      extension: extension,
      ...req.query,
    });
    try {
      await file.save();
      res.status(201).send('uploaded successfully');
    } catch (e) {
      res.status(400).send(e);
    }
  });
});

app.listen(port, () => {
  console.log('Server is up on port ' + port);
});
