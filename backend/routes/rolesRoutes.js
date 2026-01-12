const express = require('express');
const router = express.Router();
const RolesMaster = require('../models/RolesMaster');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

// GET all active roles
router.get('/roles', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const roles = await RolesMaster.find({ isActive: true }).sort({ name: 1 });
        res.json(roles.map(r => r.name));
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch roles' });
    }
});

// POST add new role
router.post('/roles', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const { name, category } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Role name is required' });
        }

        // Check if role already exists
        const existing = await RolesMaster.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ message: 'Role already exists' });
        }

        const newRole = new RolesMaster({
            name: name.trim(),
            category: category || 'Custom'
        });

        await newRole.save();
        res.status(201).json({ message: 'Role added successfully', role: newRole.name });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add role' });
    }
});

// DELETE role
router.delete('/roles/:id', authenticateJWT, isAdmin, async (req, res) => {
    try {
        await RolesMaster.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Role deactivated' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to deactivate role' });
    }
});

module.exports = router;
