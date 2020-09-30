// requiring packages
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const s3 = require('./aws/aws');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('./db/mongoose');
const FileInfo = require('./models/file');
const Subject = require('./models/subject');
const Announcement = require('./models/announcement');

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

app.get('/getdownloadtoken/:fileid', (req, res) => {
  var downloadtoken = jwt.sign(
    { fileid: req.params.fileid },
    process.env.JWT_DOWNLOAD_SECRET,
    {
      expiresIn: 200,
    }
  );
  res.send({ downloadtoken });
});

app.get('/downloadfile/:token', async (req, res) => {
  try {
    var { fileid } = jwt.verify(
      req.params.token,
      process.env.JWT_DOWNLOAD_SECRET
    );
    var { filename } = await FileInfo.findOne({ uuid: fileid }).select(
      'filename'
    );
  } catch (e) {
    res.status(400).send(e);
  }

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileid,
  };
  s3.getObject(params, function (err, data) {
    if (err === null) {
      res.attachment(filename);
      res.send(data.Body);
    } else {
      res.status(500).send(err);
    }
  });
});

app.delete('/file/:fileid', async (req, res) => {
  var fileid = req.params.fileid;
  try {
    var result = await FileInfo.deleteOne({ uuid: fileid });
  } catch (err) {
    res.status(500).send(err);
  }
  var params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileid,
  };
  if (result.deletedCount === 1) {
    s3.deleteObject(params, function (err, data) {
      if (data) {
        res.status(200).send('Deletion successful');
      } else {
        res.status(500).send(err);
      }
    });
  } else {
    res.status(500).send();
  }
});

app.post('/subject', async (req, res) => {
  const subject = new Subject({ ...req.body });
  try {
    await subject.save();
    res.status(201).send('Data uploaded');
  } catch (e) {
    res.status(400).send(e);
  }
});

app.get('/subject', async (req, res) => {
  try {
    var result = await Subject.find({ ...req.query });
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/announcement', async (req, res) => {
  const announcement = new Announcement({ ...req.body });
  try {
    await announcement.save();
    res.status(201).send('Data uploaded');
  } catch (e) {
    res.status(400).send(e);
  }
});

app.get('/announcement', async (req, res) => {
  try {
    var result = await Announcement.find({ ...req.query });
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log('Server is up on port ' + port);
});
