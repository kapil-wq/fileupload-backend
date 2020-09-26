app.post('/fileinfo', async (req, res) => {
  const fileinfo = new FileInfo({
    ...req.body,
  });

  try {
    await fileinfo.save();
    res.status(201).send(fileinfo);
  } catch (e) {
    res.status(400).send(e);
  }
});
