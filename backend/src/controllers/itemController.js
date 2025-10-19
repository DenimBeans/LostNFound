import Item from "../models/Item.js";

// POST /api/items
export const createItem = async (req, res) => {
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

    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/items?status=lost&search=backpack
export const listItems = async (req, res) => {
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
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
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