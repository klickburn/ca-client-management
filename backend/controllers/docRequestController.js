const DocRequest = require('../models/DocRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get requests for a client
exports.getRequestsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    // Client users can only see their own
    if (req.user.role === 'client' && String(req.user.clientId) !== String(clientId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const requests = await DocRequest.find({ client: clientId })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// Create a document request
exports.createRequest = async (req, res) => {
  try {
    const { clientId } = req.params;
    const request = new DocRequest({ ...req.body, client: clientId, createdBy: req.user.id });
    await request.save();

    // Notify the client user if one exists
    const clientUser = await User.findOne({ clientId, role: 'client' });
    if (clientUser) {
      await Notification.create({
        recipient: clientUser._id,
        type: 'general',
        title: 'Document Request',
        message: `New document request: ${request.title}`,
        link: '/portal/documents',
      });
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error creating request', error: error.message });
  }
};

// Update a request
exports.updateRequest = async (req, res) => {
  try {
    const request = await DocRequest.findByIdAndUpdate(req.params.requestId, req.body, { new: true });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error updating request', error: error.message });
  }
};

// Delete a request
exports.deleteRequest = async (req, res) => {
  try {
    const request = await DocRequest.findByIdAndDelete(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting request', error: error.message });
  }
};

// Fulfill a document item in a request
exports.fulfillItem = async (req, res) => {
  try {
    const { requestId, itemIndex } = req.params;
    const { documentId } = req.body;

    const request = await DocRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Client access check
    if (req.user.role === 'client' && String(req.user.clientId) !== String(request.client)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const idx = parseInt(itemIndex);
    if (idx < 0 || idx >= request.documents.length) {
      return res.status(400).json({ message: 'Invalid document index' });
    }

    request.documents[idx].fulfilled = true;
    if (documentId) request.documents[idx].documentId = documentId;

    // Update overall status
    const total = request.documents.length;
    const fulfilled = request.documents.filter(d => d.fulfilled).length;
    if (fulfilled === total) request.status = 'fulfilled';
    else if (fulfilled > 0) request.status = 'partially_fulfilled';

    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error fulfilling item', error: error.message });
  }
};
