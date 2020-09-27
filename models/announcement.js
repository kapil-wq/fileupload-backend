const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    teacher: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
