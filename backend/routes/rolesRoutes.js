const express = require('express');
const router = express.Router();
const RolesMaster = require('../models/RolesMaster');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

// GET all active roles (return objects with description)
router.get('/roles', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const roles = await RolesMaster.find({ isActive: true }).sort({ name: 1 });
        // Include an `id` field so frontend can perform deletions by id
        res.json(roles.map(r => ({ id: r._id, name: r.name, category: r.category, description: r.description })));
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch roles' });
    }
});

// POST add new role (accept optional description)
router.post('/roles', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const { name, category, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Role name is required' });
        }

        // Check if role already exists
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existing = await RolesMaster.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ message: 'Role already exists' });
        }

        const newRole = new RolesMaster({
            name: name.trim(),
            category: category || 'Custom',
            description: description || ''
        });

        await newRole.save();
        res.status(201).json({ message: 'Role added successfully', role: { name: newRole.name, description: newRole.description, category: newRole.category } });
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

// RESTORE role (undo deactivation)
router.post('/roles/:id/restore', authenticateJWT, isAdmin, async (req, res) => {
    try {
        await RolesMaster.findByIdAndUpdate(req.params.id, { isActive: true });
        res.json({ message: 'Role restored' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to restore role' });
    }
});

module.exports = router;
