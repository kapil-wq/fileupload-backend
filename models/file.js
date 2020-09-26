const mongoose = require('mongoose');

const fileInfoSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
    },
    extension: {
      type: String,
    },
    category: {
      type: String,
    },
    subject: {
      type: String,
    },
    teacher: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const FileInfo = mongoose.model('File', fileInfoSchema);

module.exports = FileInfo;
