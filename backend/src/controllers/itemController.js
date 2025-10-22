import Item from "../models/Item.js";

// POST /api/items
export const createItem = async (req, res) => {

  var error = "";
  try {
    const {
      title, description, category, imageUrl,
      lostAt, locationText, reporterName, reporterEmail, lat, lng
    } = req.body;

    if (!title || !reporterName || !reporterEmail) {
      return res.status(400).json({ error: "title, reporterName, reporterEmail are required" });
    }

    const item = await Item.create({
      title, description, category, imageUrl,
      lostAt, locationText, reporterName, reporterEmail, lat, lng
    });

    //Changed to have work with MERN App. Change as necessary when creating real app - Jean
    //res.status(201).json(item);
  } catch (err) {
    error = err.toString();
    res.status(400).json({ error: error });
  }

  res.status(201).json({ error: error });
};

// GET /api/items?status=lost&search=backpack
export const listItems = async (req, res) => {

  var error = "";
  try {
    const { status, search, category } = req.query;
    const q = {};

    if (status) q.status = status;
    if (category) q.category = category;
    if (search) {
      q.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { locationText: { $regex: search, $options: "i" } }
      ];
    }

    const items = await Item.find(q).sort({ createdAt: -1 });

    //Added to return item titles to MERN App. Change as neccessary for final app - Jean
    var _ret = [];
    for (var i = 0; i < items.length; i++) {
      _ret.push(items[i].title);
    }

    res.json({ results: _ret, error: error });
  } catch (err) {
    error = err.toString();
    res.status(500).json({ error: error });
  }
};

// GET /api/items/:id
export const getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PATCH /api/items/:id/claim
export const claimItem = async (req, res) => {
  try {
    const { claimerName, claimerEmail } = req.body;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status: "claimed", claimerName, claimerEmail },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PATCH /api/items/:id/return
export const markReturned = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status: "returned" },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/items/:id
export const deleteItem = async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};